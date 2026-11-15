import { Region } from '../models/Region.js';
import { Product } from '../models/Product.js';
import { productImagesWithUrls, publicProductImage } from '../utils/productImages.js';

export const getAllRegions = async (req, res) => {
  const regions = await Region.find().sort({ name: 1 }).lean();

  const regionsWithCount = await Promise.all(
    regions.map(async (r) => {
      const count = await Product.countDocuments({ region: r.name });
      return { ...r, productCount: count };
    })
  );

  res.json(regionsWithCount);
};

export const getRegionBySlug = async (req, res) => {
  const region = await Region.findOne({ slug: req.params.slug }).lean();
  if (!region) {
    return res.status(404).json({ message: 'Không tìm thấy vùng miền' });
  }

  const products = await Product.find({ region: region.name }).lean();
  res.json({ ...region, products: products.map(product => productImagesWithUrls(product, publicProductImage)) });
};

export const exportRegions = async (req, res) => {
  try {
    const regions = await Region.find().sort({ name: 1 }).lean();

    const regionsWithCount = await Promise.all(
      regions.map(async (r) => {
        const count = await Product.countDocuments({ region: r.name });
        return { ...r, productCount: count };
      })
    );

    const escapeCsv = (val) => {
      const s = String(val == null ? '' : val);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };

    const headers = ['Ten vung mien', 'So san pham', 'Mo ta'];
    const lines = [headers.join(',')];
    for (const r of regionsWithCount) {
      const row = [
        escapeCsv(r.name || ''),
        escapeCsv(r.productCount || 0),
        escapeCsv(r.description || ''),
      ];
      lines.push(row.join(','));
    }

    const csv = lines.join('\n');
    const filename = `vung-mien-${new Date().toISOString().slice(0, 10)}.csv`;

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Cache-Control', 'no-cache');
    return res.send(csv);
  } catch (error) {
    console.error('❌ Lỗi xuat CSV vung mien:', error);
    return res.status(500).json({
      success: false,
      message: 'Khong xuat duoc file CSV.',
      error: error.message,
    });
  }
};
