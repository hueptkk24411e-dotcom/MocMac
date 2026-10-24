import { Router } from 'express';
import { Product } from '../models/Product.js';
import { Review } from '../models/Review.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// GET /api/products - Danh sách sản phẩm
router.get('/', async (req, res) => {
  try {
    const filter = {};
    if (req.query.cat) filter.cat = String(req.query.cat);

    const products = await Product.find(filter)
      .sort({ id: 1 })
      .lean();

    return res.json(products);
  } catch (error) {
    console.error('Lỗi lấy danh sách sản phẩm:', error);
    return res.status(500).json({ message: 'Không thể lấy danh sách sản phẩm.' });
  }
});

// GET /api/products/:id/reviews - Review của sản phẩm, dùng Product.id dạng số.
// Keep this before GET /:id for route readability and to avoid accidental conflicts.
router.get('/:id/reviews', async (req, res) => {
  try {
    const productId = Number(req.params.id);
    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return res.status(400).json({ message: 'Mã sản phẩm không hợp lệ.' });
    }

    const rows = await Review.find({ productId })
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    const reviews = rows.map(row => ({
      id: String(row._id),
      productId: Number(row.productId),
      productName: row.productName || '',
      userName: row.userName || row.name || row.username || 'Khách hàng',
      rating: Number(row.rating) || 5,
      content: String(row.content || ''),
      createdAt: row.createdAt || null,
      isDemo: Boolean(row.isDemo)
    }));

    return res.json({ success: true, total: reviews.length, reviews });
  } catch (error) {
    console.error('Lỗi tải review:', error);
    return res.status(500).json({ message: 'Không thể tải đánh giá sản phẩm.' });
  }
});

// POST /api/products/:id/reviews - Lưu review mới vào MongoDB.
router.post('/:id/reviews', async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const userName = String(req.body?.userName ?? req.body?.name ?? '').trim();
    const content = String(req.body?.content ?? '').trim();
    const rating = Number(req.body?.rating);

    if (!Number.isSafeInteger(productId) || productId <= 0) {
      return res.status(400).json({ message: 'Mã sản phẩm không hợp lệ.' });
    }
    if (userName.length < 2 || userName.length > 80) {
      return res.status(400).json({ message: 'Tên hiển thị phải có từ 2 đến 80 ký tự.' });
    }
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Số sao phải từ 1 đến 5.' });
    }
    if (content.length < 3 || content.length > 1500) {
      return res.status(400).json({ message: 'Nội dung đánh giá phải từ 3 đến 1500 ký tự.' });
    }

    const product = await Product.findOne({ id: productId })
      .select('id name')
      .lean();

    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
    }

    const review = await Review.create({
      productId,
      productName: product.name,
      userName,
      rating,
      content,
      createdAt: new Date(),
      isDemo: false
    });

    return res.status(201).json({
      success: true,
      message: 'Đã lưu đánh giá.',
      review: {
        id: String(review._id),
        productId: review.productId,
        productName: review.productName,
        userName: review.userName,
        rating: review.rating,
        content: review.content,
        createdAt: review.createdAt,
        isDemo: review.isDemo
      }
    });
  } catch (error) {
    console.error('Lỗi lưu review:', error);
    return res.status(500).json({ message: 'Không thể lưu đánh giá. Vui lòng thử lại.' });
  }
});

// GET /api/products/:id - Chi tiết sản phẩm
router.get('/:id', async (req, res) => {
  try {
    const productId = Number(req.params.id);
    const product = await Product.findOne({ id: productId }).lean();

    if (!product) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
    }

    return res.json(product);
  } catch (error) {
    console.error('Lỗi lấy chi tiết sản phẩm:', error);
    return res.status(500).json({ message: 'Không thể lấy chi tiết sản phẩm.' });
  }
});

// POST /api/products - Thêm sản phẩm, quyền admin.
router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  try {
    const product = await Product.create(req.body);
    return res.status(201).json(product);
  } catch (error) {
    console.error('Lỗi thêm sản phẩm:', error);
    return res.status(500).json({ message: 'Không thể thêm sản phẩm.' });
  }
});

export default router;
