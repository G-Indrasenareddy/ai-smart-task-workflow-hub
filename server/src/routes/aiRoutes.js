import { Router } from 'express';
import { chat, suggestSubtasks, getInsights } from '../controllers/aiController.js';
import { validateChatInput, validateSuggestSubtasksInput } from '../middleware/aiValidation.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all AI routes
router.use(protect);

router.post('/chat', validateChatInput, chat);
router.post('/suggest-tasks', validateSuggestSubtasksInput, suggestSubtasks);
router.get('/insights', getInsights);

export default router;
