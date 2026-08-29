import { Router } from 'express';
import healthRoutes from './healthRoutes.js';
import taskRoutes from './taskRoutes.js';
import goalRoutes from './goalRoutes.js';
import authRoutes from './authRoutes.js';
import aiRoutes from './aiRoutes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/tasks', taskRoutes);
router.use('/goals', goalRoutes);
router.use('/auth', authRoutes);
router.use('/ai', aiRoutes);

export default router;
