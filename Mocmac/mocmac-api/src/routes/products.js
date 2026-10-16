import { Router } from 'express';
import { Product } from '../models/Product.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

router.get('/', async (req, res) => {
  const filter = {};
  if (req.query.cat) filter.cat = String(req.query.cat);
  const products = await Product.find(filter).sort({ id: 1 }).lean();
  res.json(products);
});

router.get('/:id', async (req, res) => {
  const product = await Product.findOne({ id: Number(req.params.id) }).lean();
  if (!product) {
    return res.status(404).json({ message: 'Không tìm thấy sản phẩm' });
  }
  res.json(product);
});

router.post('/', requireAuth, requireRole('admin'), async (req, res) => {
  const product = await Product.create(req.body);
  res.status(201).json(product);
});

export default router;
