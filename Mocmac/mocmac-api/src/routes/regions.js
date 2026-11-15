import { Router } from 'express';
import { requireAuth, requireRole, requirePermission } from '../middleware/auth.js';
import { getAllRegions, getRegionBySlug, exportRegions } from '../controllers/regionController.js';

const router = Router();

router.get('/', getAllRegions);
router.get('/export', requireAuth, requireRole('admin', 'staff'), requirePermission('regions.view'), exportRegions);
router.get('/:slug', getRegionBySlug);

export default router;
