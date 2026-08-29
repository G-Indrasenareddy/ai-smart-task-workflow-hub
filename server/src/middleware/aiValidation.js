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

  if (Array.isArray(history) && history.length > 20) {
    return res.status(400).json({
      success: false,
      message: 'History exceeds maximum limit of 20 messages',
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
