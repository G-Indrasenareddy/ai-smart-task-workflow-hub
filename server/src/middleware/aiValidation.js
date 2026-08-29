import mongoose from 'mongoose';

export const validateChatInput = (req, res, next) => {
  const { message, history } = req.body;

  if (!message || typeof message !== 'string' || message.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Message is required and must be a non-empty string',
    });
  }

  if (message.length > 1000) {
    return res.status(400).json({
      success: false,
      message: 'Message exceeds maximum length of 1000 characters',
    });
  }

  if (history !== undefined && !Array.isArray(history)) {
    return res.status(400).json({
      success: false,
      message: 'History must be an array of message objects',
    });
  }

  if (Array.isArray(history) && history.length > 50) {
    return res.status(400).json({
      success: false,
      message: 'History exceeds maximum limit of 50 messages',
    });
  }

  next();
};

export const validateSuggestSubtasksInput = (req, res, next) => {
  const { goalTitle, goalDescription } = req.body;

  if (!goalTitle || typeof goalTitle !== 'string' || goalTitle.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Goal title is required and must be a non-empty string',
    });
  }

  if (goalTitle.length > 200) {
    return res.status(400).json({
      success: false,
      message: 'Goal title exceeds maximum length of 200 characters',
    });
  }

  if (goalDescription !== undefined && typeof goalDescription !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Goal description must be a string',
    });
  }

  next();
};

export const validateConversationId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid conversation ID format',
    });
  }
  next();
};

export const validateConversationTitle = (req, res, next) => {
  const { title } = req.body;
  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    return res.status(400).json({
      success: false,
      message: 'Conversation title must be a non-empty string',
    });
  }
  if (title && title.length > 100) {
    return res.status(400).json({
      success: false,
      message: 'Conversation title exceeds maximum length of 100 characters',
    });
  }
  next();
};
