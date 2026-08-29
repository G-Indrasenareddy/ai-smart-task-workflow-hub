import { Router } from 'express';
import { getTasksStub } from '../controllers/taskController.js';

const router = Router();

router.get('/', getTasksStub);

export default router;
