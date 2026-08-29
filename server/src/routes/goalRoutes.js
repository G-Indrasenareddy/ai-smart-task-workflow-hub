import { Router } from 'express';
import { getGoalsStub } from '../controllers/goalController.js';

const router = Router();

router.get('/', getGoalsStub);

export default router;
