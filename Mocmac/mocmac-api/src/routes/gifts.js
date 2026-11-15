import { Router } from 'express';
import { requireAuth, requirePermission, requireRole } from '../middleware/auth.js';
import { createGift, deleteGift, getAllGifts, getGiftById, updateGift } from '../controllers/giftController.js';

const router = Router();

router.get('/', getAllGifts);
router.get('/:id', getGiftById);
router.post('/', requireAuth, requireRole('admin', 'staff'), requirePermission('products.create'), createGift);
router.put('/:id', requireAuth, requireRole('admin', 'staff'), requirePermission('products.update'), updateGift);
router.delete('/:id', requireAuth, requireRole('admin'), requirePermission('products.delete'), deleteGift);

export default router;
