import dotenv from "dotenv"; 
dotenv.config(); 
import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { logAction, getRequestInfo } from '../utils/auditLog.js';
import QRCode from 'qrcode';
import { hostedProductImage, productImageReferences, productImagesWithUrls, publicProductImage } from '../utils/productImages.js';
import { emptyReviewStats, reviewFilter, reviewStatsFor } from '../utils/reviewData.js';

const BASE_URL = (process.env.BACKEND_URL || 'http://localhost:3000').replace(/\/+$/, '');
const UPLOAD_SERVER_URL = (process.env.UPLOAD_SERVER_URL || 'http://localhost:5001').replace(/\/+$/, '');
const ROOT_QR_URL = (process.env.ROOT_QR_URL || process.env.FRONTEND_URL || 'http://localhost:4200').replace(/\/+$/, '');

async function deleteImageFromUploadServer(imageUrl) {
  try {
    let filename;
    if (imageUrl.startsWith('http')) {
      const url = new URL(imageUrl);
      filename = url.pathname.split('/uploads/')[1];
    } else if (imageUrl.startsWith('/uploads/')) {
      filename = imageUrl.split('/uploads/')[1];
    }
    if (!filename) return;

    const deleteUrl = imageUrl.startsWith(`${UPLOAD_SERVER_URL}/uploads/`)
      ? `${UPLOAD_SERVER_URL}/uploads/${filename}`
      : `${BASE_URL}/api/uploads/${filename}`;

    await fetch(deleteUrl, { method: 'DELETE' });
  } catch (error) {
    console.error('Failed to delete image from upload server:', error.message);
  }
}

function addBaseUrlToImages(product) {
  if (!product) return product;
  const prod = product.toObject ? product.toObject() : { ...product };
  const withUrls = productImagesWithUrls(prod, publicProductImage);
  const images = [
    ...(withUrls.images ?? []),
    ...(withUrls.variants ?? []).flatMap(variant => [variant?.image, ...(variant?.images ?? [])]),
  ];
  return { ...withUrls, referenceImages: productImageReferences(images) };
}

export const getAllProducts = async (req, res) => {
  const filter = {};
  if (req.query.cat) filter.cat = String(req.query.cat);
  if (req.query.q) {
    const search = String(req.query.q);
    filter.$or = [
      { name: new RegExp(search, 'i') },
      { region: new RegExp(search, 'i') },
      { province: new RegExp(search, 'i') },
      { village: new RegExp(search, 'i') },
      { cat: new RegExp(search, 'i') },
      { type: new RegExp(search, 'i') },
      { slug: new RegExp(search.replace(/\s+/g, '-'), 'i') },
    ];
  }

  const page = Math.max(1, Number(req.query.page) || 1);
  const limit = Math.max(1, Math.min(100, Number(req.query.limit) || 50));
  const skip = (page - 1) * limit;

  const [products, total] = await Promise.all([
    Product.find(filter).sort({ id: 1 }).skip(skip).limit(limit).lean(),
    Product.countDocuments(filter),
  ]);

  const stats = await reviewStatsFor(products);
  const productsWithUrls = products.map((p) => {
    const reviewStats = stats.get(Number(p.id)) ?? emptyReviewStats();
    return {
      ...addBaseUrlToImages(p),
      qrUrl: `${ROOT_QR_URL}/san-pham/${p.slug}`,
      reviewStats,
      avgRating: reviewStats.average,
      numReviews: reviewStats.count,
      rate: reviewStats.average,
      reviews: reviewStats.count,
    };
  });

  res.json({
    success: true,
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
    products: productsWithUrls,
  });
};

export const getProductBySlug = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug }).lean();
  if (!product) {
    return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  }

  const [reviews, stats] = await Promise.all([
    Review.find(reviewFilter(product)).populate('user', 'name').sort({ createdAt: -1, _id: -1 }).lean(),
    reviewStatsFor([product]),
  ]);
  const reviewStats = stats.get(Number(product.id)) ?? emptyReviewStats();

  res.json({
    ...addBaseUrlToImages(product),
    qrUrl: `${ROOT_QR_URL}/san-pham/${product.slug}`,
    reviewStats,
    avgRating: reviewStats.average,
    numReviews: reviewStats.count,
    rate: reviewStats.average,
    reviews,
  });
};

export const createProduct = async (req, res) => {
  const body = productImagesWithUrls({ ...req.body });
  if (body.id == null) {
    const last = await Product.findOne().sort({ id: -1 }).select({ id: 1 }).lean();
    body.id = last ? last.id + 1 : 1;
  }
  if (!body.slug || !String(body.slug).trim()) {
    return res.status(400).json({ message: 'Thiếu slug sản phẩm' });
  }
  body.slug = String(body.slug).trim();

  const qrUrl = `${ROOT_QR_URL}/san-pham/${body.slug}`;
  try {
    body.qrCode = await QRCode.toDataURL(qrUrl, { margin: 1, width: 300 });
  } catch (e) {
    console.error('QR generation failed:', e?.message || e);
  }

  const product = await Product.create(body);

  const { user, ip } = getRequestInfo(req);
  await logAction({
    action: 'product.create',
    resourceType: 'Product',
    resourceId: product._id,
    user,
    ip,
    details: { name: product.name, slug: product.slug, price: product.price },
  });

  res.status(201).json({ success: true, product: addBaseUrlToImages(product), qrUrl, qrCode: product.qrCode });
};

export const updateProduct = async (req, res) => {
  const body = productImagesWithUrls({ ...req.body });
  if (body.slug) {
    body.slug = String(body.slug).trim();
    const qrUrl = `${ROOT_QR_URL}/san-pham/${body.slug}`;
    try {
      body.qrCode = await QRCode.toDataURL(qrUrl, { margin: 1, width: 300 });
    } catch (e) {
      console.error('QR generation failed:', e?.message || e);
    }
  }
  const product = await Product.findOneAndUpdate(
    { slug: req.params.slug },
    body,
    { new: true, runValidators: true }
  ).lean();
  if (!product) {
    return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  }

  const { user, ip } = getRequestInfo(req);
  await logAction({
    action: 'product.update',
    resourceType: 'Product',
    resourceId: product._id,
    user,
    ip,
    details: { slug: product.slug },
  });

  res.json({ success: true, product: addBaseUrlToImages(product), qrUrl: `${ROOT_QR_URL}/san-pham/${product.slug}`, qrCode: product.qrCode });
};

export const deleteProduct = async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug });
  if (!product) {
    return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  }

  const imageUrls = Array.isArray(product.images) ? product.images : [];
  for (const imageUrl of imageUrls) {
    if (
      typeof imageUrl === 'string' && hostedProductImage(imageUrl) === imageUrl &&
      (imageUrl.startsWith('/uploads/') || imageUrl.startsWith(`${BASE_URL}/uploads/`) ||
       imageUrl.startsWith(`${UPLOAD_SERVER_URL}/uploads/`))
    ) {
      await deleteImageFromUploadServer(imageUrl);
    }
  }

  await Product.findByIdAndDelete(product._id);
  res.json({ message: 'Đã xóa sản phẩm' });
};

export const exportProducts = async (req, res) => {
  try {
    const filter = {};

    if (req.query.cat) filter.cat = String(req.query.cat);
    if (req.query.q) {
      const search = String(req.query.q);
      filter.$or = [
        { name: new RegExp(search, 'i') },
        { region: new RegExp(search, 'i') },
        { province: new RegExp(search, 'i') },
        { village: new RegExp(search, 'i') },
        { cat: new RegExp(search, 'i') },
        { type: new RegExp(search, 'i') },
        { slug: new RegExp(search.replace(/\s+/g, '-'), 'i') },
      ];
    }

    const products = await Product.find(filter).sort({ id: 1 }).lean();

    const headers = [
      'Id',
      'Ma slug',
      'Ten san pham',
      'Danh muc',
      'Loai',
      'Vung',
      'Tinh',
      'Xa',
      'Gia',
      'Con hang',
      'Ngay tao',
    ];

    const escapeCsv = (val) => {
      const s = String(val == null ? '' : val);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };

    const lines = [headers.join(',')];
    for (const p of products) {
      const createdAt = p.createdAt
        ? new Date(p.createdAt).toLocaleString('vi-VN')
        : '';
      const row = [
        escapeCsv(p.id || ''),
        escapeCsv(p.slug || ''),
        escapeCsv(p.name || ''),
        escapeCsv(p.cat || ''),
        escapeCsv(p.type || ''),
        escapeCsv(p.region || ''),
        escapeCsv(p.province || ''),
        escapeCsv(p.village || ''),
        escapeCsv(p.price || 0),
        escapeCsv(p.inStock ? 'Co' : 'Het'),
        escapeCsv(createdAt),
      ];
      lines.push(row.join(','));
    }

    const csv = lines.join('\n');
    const filename = `san-pham-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    return res.send(csv);
  } catch (error) {
    console.error('❌ Lỗi xuat CSV san pham:', error);
    return res.status(500).json({
      success: false,
      message: 'Khong xuat duoc file CSV.',
      error: error.message,
    });
  }
};
