import { Router } from 'express';
import {
  getTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
} from '../controllers/taskController.js';
import {
  validateCreateTask,
  validateUpdateTask,
  validateTaskQueryParams,
} from '../middleware/taskValidation.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all task routes
router.use(protect);

router.route('/')
  .get(validateTaskQueryParams, getTasks)
  .post(validateCreateTask, createTask);

router.route('/:id')
  .get(getTaskById)
  .put(validateUpdateTask, updateTask)
  .delete(deleteTask);

export default router;
