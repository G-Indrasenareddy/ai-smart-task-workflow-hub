import { aiService } from '../services/aiService.js';

export const chat = async (req, res, next) => {
  try {
    const { message, history } = req.body;

    if (!message || typeof message !== 'string' || message.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Message is required and must be a non-empty string',
      });
    }

    const result = await aiService.generateChatResponse(req.user.id, message, history);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

export const suggestSubtasks = async (req, res, next) => {
  try {
    const { goalTitle, goalDescription } = req.body;

    if (!goalTitle || typeof goalTitle !== 'string' || goalTitle.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'goalTitle is required',
      });
    }

    const subtasks = await aiService.suggestSubtasks(req.user.id, goalTitle, goalDescription);

    res.status(200).json({
      success: true,
      data: subtasks,
    });
  } catch (error) {
    next(error);
  }
};

export const getInsights = async (req, res, next) => {
  try {
    const insights = await aiService.getAIInsights(req.user.id);

    res.status(200).json({
      success: true,
      data: insights,
    });
  } catch (error) {
    next(error);
  }
};
