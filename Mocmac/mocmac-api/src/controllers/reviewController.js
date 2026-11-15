import { Review } from '../models/Review.js';
import { Product } from '../models/Product.js';
import { Order } from '../models/Order.js';
import { logAction, getRequestInfo } from '../utils/auditLog.js';
import { emptyReviewStats, reviewFilter, reviewStatsFor } from '../utils/reviewData.js';

async function updateProductStats(product) {
  const stats = await reviewStatsFor([product]);
  const { average, count } = stats.get(Number(product.id)) ?? emptyReviewStats();
  await Product.findByIdAndUpdate(product._id, { avgRating: average, numReviews: count, rate: average, reviews: count });
}

async function refreshReviewedProduct(review) {
  if (!review.product && !Number.isSafeInteger(review.productId)) return;
  const lookup = review.product ? { _id: review.product } : { id: review.productId };
  const product = await Product.findOne(lookup).select('_id id').lean();
  if (product) await updateProductStats(product);
}

export const getProductReviews = async (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isSafeInteger(id) || id < 1) {
      return res.status(400).json({ success: false, message: 'Mã sản phẩm không hợp lệ.' });
    }

    const product = await Product.findOne({ id }).lean();
    if (!product) {
      return res.json({ success: true, total: 0, page: 1, limit: 0, totalPages: 0, avgRating: 0, ratedCount: 0, reviews: [] });
    }

    const requestedPage = Number(req.query.page);
    const requestedLimit = Number(req.query.limit);
    const page = Number.isSafeInteger(requestedPage) ? Math.max(1, requestedPage) : 1;
    const limit = Number.isSafeInteger(requestedLimit) ? Math.max(1, Math.min(100, requestedLimit)) : 20;
    const [reviews, stats] = await Promise.all([
      Review.find(reviewFilter(product))
        .populate('user', 'name')
        .sort({ createdAt: -1, _id: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      reviewStatsFor([product]),
    ]);
    const { count, average, ratedCount } = stats.get(id) ?? emptyReviewStats();

    return res.json({
      success: true,
      total: count,
      page,
      limit,
      totalPages: Math.ceil(count / limit),
      avgRating: average,
      ratedCount,
      reviews,
    });
  } catch (error) {
    console.error('❌ Lỗi lấy đánh giá:', error);
    return res.status(500).json({ success: false, message: 'Không thể lấy đánh giá.', error: error.message });
  }
};

export const createReview = async (req, res) => {
  try {
    const { productId, slug, rating, comment } = req.body ?? {};

    if (!rating || (!productId && !slug)) {
      return res.status(400).json({ success: false, message: 'Vui lòng chọn sản phẩm và đánh giá.' });
    }

    let productDoc = null;
    if (productId) {
      productDoc = await Product.findOne({ id: productId });
    } else if (slug) {
      productDoc = await Product.findOne({ slug });
    }

    if (!productDoc) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm.' });
    }

    const hasReceivedOrder = await Order.exists({
      user: req.user.id,
      status: 'delivered',
      'items.productId': productDoc.id,
    });

    if (!hasReceivedOrder) {
      return res.status(403).json({
        success: false,
        message: 'Bạn chỉ có thể đánh giá sản phẩm sau khi đã nhận hàng.',
      });
    }

    const existing = await Review.findOne({ product: productDoc._id, user: req.user.id });
    if (existing) {
      return res.status(400).json({ success: false, message: 'Bạn đã đánh giá sản phẩm này rồi.' });
    }

    const review = await Review.create({
      product: productDoc._id,
      user: req.user.id,
      rating: Number(rating),
      comment: String(comment || ''),
    });

    await updateProductStats(productDoc);

    const { user, ip } = getRequestInfo(req);
    await logAction({
      action: 'review.create',
      resourceType: 'Review',
      resourceId: review._id,
      user,
      ip,
      details: { product: productDoc._id, rating: Number(rating), comment: String(comment || '').slice(0, 100) },
    });

    return res.status(201).json({ success: true, message: 'Đánh giá thành công.', review });
  } catch (error) {
    console.error('❌ Lỗi tạo đánh giá:', error);
    return res.status(500).json({ success: false, message: 'Không thể đánh giá.', error: error.message });
  }
};

export const getAllReviews = async (req, res) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.max(1, Number(req.query.limit) || 20);
    const skip = (page - 1) * limit;

    const filter = {};

    if (req.query.q) {
      const search = String(req.query.q);
      filter.$or = [
        { 'product.name': new RegExp(search, 'i') },
        { 'user.name': new RegExp(search, 'i') },
        { 'user.email': new RegExp(search, 'i') },
        { comment: new RegExp(search, 'i') },
      ];
    }

    if (req.query.rating) {
      const r = Number(req.query.rating);
      if (!isNaN(r) && r >= 1 && r <= 5) {
        filter.rating = r;
      }
    }

    if (req.query.status) {
      filter.status = String(req.query.status);
    }

    if (req.query.productId) {
      filter.product = req.query.productId;
    }

    if (req.query.userId) {
      filter.user = req.query.userId;
    }

    const sort = {};
    const sortBy = String(req.query.sortBy || 'createdAt');
    const sortDir = req.query.sortDir === 'asc' ? 1 : -1;
    sort[sortBy] = sortDir;

    const [reviews, total] = await Promise.all([
      Review.find(filter)
        .populate('product', 'name')
        .populate('user', 'name email')
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .lean(),
      Review.countDocuments(filter),
    ]);

    return res.json({
      success: true,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
      reviews,
    });
  } catch (error) {
    console.error('❌ Lỗi lấy tất cả đánh giá:', error);
    return res.status(500).json({
      success: false,
      message: 'Không thể lấy.',
      error: error.message,
    });
  }
};

export const updateReviewStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { status: status === 'hidden' ? 'hidden' : 'visible' },
      { new: true }
    ).lean();

    if (!review) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá.' });
    }
    await refreshReviewedProduct(review);
    return res.json({ success: true, message: 'Cập nhật trạng thái.', review });
  } catch (error) {
    console.error('❌ Lỗi cập nhật đánh giá:', error);
    return res.status(500).json({ success: false, message: 'Không thể cập nhật.', error: error.message });
  }
};

export const deleteReview = async (req, res) => {
  try {
    const review = await Review.findById(req.params.id);
    if (!review) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá.' });
    }

    await review.deleteOne();
    await refreshReviewedProduct(review);

    return res.json({ success: true, message: 'Xóa đánh giá thành công.' });
  } catch (error) {
    console.error('❌ Lỗi xóa đánh giá:', error);
    return res.status(500).json({ success: false, message: 'Không thể xóa.', error: error.message });
  }
};

export const replyReview = async (req, res) => {
  try {
    const { reply } = req.body;
    const review = await Review.findByIdAndUpdate(
      req.params.id,
      { reply: String(reply || ''), replyAt: new Date() },
      { new: true }
    )
      .populate('product', 'name')
      .populate('user', 'name email')
      .lean();

    if (!review) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đánh giá.' });
    }

    const { user, ip } = getRequestInfo(req);
    await logAction({
      action: 'review.reply',
      resourceType: 'Review',
      resourceId: review._id,
      user,
      ip,
      details: { reply: String(reply || '').slice(0, 100) },
    });

    return res.json({ success: true, message: 'Phản hồi thành công.', review });
  } catch (error) {
    console.error('❌ Lỗi phản hồi đánh giá:', error);
    return res.status(500).json({ success: false, message: 'Không thể phản hồi.', error: error.message });
  }
};

export const exportReviews = async (req, res) => {
  try {
    const filter = {};

    if (req.query.q) {
      const search = String(req.query.q);
      filter.$or = [
        { 'product.name': new RegExp(search, 'i') },
        { 'user.name': new RegExp(search, 'i') },
        { 'user.email': new RegExp(search, 'i') },
        { comment: new RegExp(search, 'i') },
      ];
    }

    if (req.query.rating) {
      const r = Number(req.query.rating);
      if (!isNaN(r) && r >= 1 && r <= 5) {
        filter.rating = r;
      }
    }

    if (req.query.status) {
      filter.status = String(req.query.status);
    }

    if (req.query.productId) {
      filter.product = req.query.productId;
    }

    if (req.query.userId) {
      filter.user = req.query.userId;
    }

    const reviews = await Review.find(filter)
      .populate('product', 'name')
      .populate('user', 'name email')
      .sort({ createdAt: -1 })
      .lean();

    const headers = ['ID', 'Sản phẩm', 'Người dùng', 'Email', 'Điểm', 'Nội dung', 'Trạng thái', 'Phản hồi', 'Ngày phản hồi', 'Ngày tạo'];
    const rows = reviews.map((r) => [
      r._id,
      r.product?.name || '',
      r.user?.name || '',
      r.user?.email || '',
      r.rating,
      r.comment?.replace(/"/g, '""') || '',
      r.status,
      r.reply?.replace(/"/g, '""') || '',
      r.replyAt ? new Date(r.replyAt).toLocaleString('vi-VN') : '',
      new Date(r.createdAt).toLocaleString('vi-VN'),
    ]);

    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${String(c)}"`).join(','))
      .join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="danh-gia-${new Date().toISOString().slice(0, 10)}.csv"`);
    return res.send('\uFEFF' + csv);
  } catch (error) {
    console.error('❌ Lỗi xuất đánh giá:', error);
    return res.status(500).json({ success: false, message: 'Không thể xuất file.', error: error.message });
  }
};
