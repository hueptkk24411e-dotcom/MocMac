import { Router } from 'express';
import { requireAuth } from '../middleware/auth.js';
import {
  login,
  loginWithGoogle,
  register,
  getMe,
  forgotPassword,
  resetPassword,
  adminResetPassword,
} from '../controllers/authController.js';

const router = Router();

router.get('/me', requireAuth, getMe);
router.post('/login', login);
router.post('/google', loginWithGoogle);
router.post('/register', register);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.post('/admin/reset', adminResetPassword);

export default router;
