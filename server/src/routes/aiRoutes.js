import { Router } from 'express';
import { getAIStub } from '../controllers/aiController.js';

const router = Router();

router.get('/', getAIStub);

export default router;
