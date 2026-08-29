import { Router } from 'express';
import { register, login, getMe } from '../controllers/authController.js';
import { validateRegister, validateLogin } from '../middleware/authValidation.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.post('/register', validateRegister, register);
router.post('/login', validateLogin, login);
router.get('/me', protect, getMe);

export default router;
