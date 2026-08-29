import { Router } from 'express';
import {
  getGoals,
  getGoalById,
  createGoal,
  updateGoal,
  deleteGoal,
} from '../controllers/goalController.js';
import {
  validateCreateGoal,
  validateUpdateGoal,
} from '../middleware/goalValidation.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all goal routes
router.use(protect);

router.route('/')
  .get(getGoals)
  .post(validateCreateGoal, createGoal);

router.route('/:id')
  .get(getGoalById)
  .put(validateUpdateGoal, updateGoal)
  .delete(deleteGoal);

export default router;
