import { Router } from 'express';
import {
  chat,
  suggestSubtasks,
  getInsights,
  createConversation,
  getConversations,
  getConversation,
  sendConversationMessage,
  renameConversation,
  deleteConversation,
  clearConversation,
} from '../controllers/aiController.js';
import {
  validateChatInput,
  validateSuggestSubtasksInput,
  validateConversationId,
  validateConversationTitle,
} from '../middleware/aiValidation.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all AI routes
router.use(protect);

// Existing AI Endpoints
router.post('/chat', validateChatInput, chat);
router.post('/suggest-tasks', validateSuggestSubtasksInput, suggestSubtasks);
router.get('/insights', getInsights);

// Persistent Conversation Endpoints
router.post('/conversations', validateConversationTitle, createConversation);
router.get('/conversations', getConversations);
router.get('/conversations/:id', validateConversationId, getConversation);
router.post('/conversations/:id/messages', validateConversationId, validateChatInput, sendConversationMessage);
router.put('/conversations/:id', validateConversationId, validateConversationTitle, renameConversation);
router.delete('/conversations/:id', validateConversationId, deleteConversation);
router.delete('/conversations/:id/messages', validateConversationId, clearConversation);

export default router;
