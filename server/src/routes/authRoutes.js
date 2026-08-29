import { Router } from 'express';
import {
  register,
  login,
  getMe,
  updateProfile,
  updateNotificationPreferences,
  changePassword,
} from '../controllers/authController.js';
import {
  validateRegister,
  validateLogin,
  validateProfileUpdate,
  validateNotificationPreferences,
  validatePasswordChange,
} from '../middleware/authValidation.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', protect, getMe);
router.put('/profile', protect, validateProfileUpdate, updateProfile);
router.put('/notification-preferences', protect, validateNotificationPreferences, updateNotificationPreferences);
router.put('/password', protect, validatePasswordChange, changePassword);

export default router;
