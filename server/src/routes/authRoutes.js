import { Router } from 'express';
import { getAuthStub } from '../controllers/authController.js';

const router = Router();

router.get('/', getAuthStub);

export default router;
