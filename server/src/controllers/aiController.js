import { aiService } from '../services/aiService.js';
import { conversationService } from '../services/conversationService.js';

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

// -------------------------------------------------------------
// PERSISTENT CONVERSATION CONTROLLERS
// -------------------------------------------------------------

export const createConversation = async (req, res, next) => {
  try {
    const { title } = req.body;
    const conversation = await conversationService.createConversation(req.user.id, title);

    res.status(201).json({
      success: true,
      message: 'Conversation created successfully',
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

export const getConversations = async (req, res, next) => {
  try {
    const conversations = await conversationService.getUserConversations(req.user.id);

    res.status(200).json({
      success: true,
      count: conversations.length,
      data: conversations,
    });
  } catch (error) {
    next(error);
  }
};

export const getConversation = async (req, res, next) => {
  try {
    const conversation = await conversationService.getConversationById(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: `Conversation not found with id of ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

export const sendConversationMessage = async (req, res, next) => {
  try {
    const { message } = req.body;
    const conversationId = req.params.id;

    // 1. Verify conversation belongs to req.user.id
    const conversation = await conversationService.getConversationById(conversationId, req.user.id);
    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: `Conversation not found with id of ${conversationId}`,
      });
    }

    // 2. Append User Message to conversation
    await conversationService.addMessage(conversationId, req.user.id, 'user', message);

    // 3. Generate AI response using fresh task/goal context + conversation history
    const aiResult = await aiService.generateChatResponse(req.user.id, message, conversation.messages);

    // 4. Append AI Assistant Message to conversation
    const updatedConversation = await conversationService.addMessage(
      conversationId,
      req.user.id,
      'assistant',
      aiResult.text
    );

    res.status(200).json({
      success: true,
      data: {
        text: aiResult.text,
        isFallback: aiResult.isFallback,
        provider: aiResult.provider,
        conversation: updatedConversation,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const renameConversation = async (req, res, next) => {
  try {
    const { title } = req.body;
    const conversation = await conversationService.updateConversationTitle(req.params.id, req.user.id, title);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: `Conversation not found with id of ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Conversation title updated successfully',
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteConversation = async (req, res, next) => {
  try {
    const conversation = await conversationService.deleteConversation(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: `Conversation not found with id of ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Conversation deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};

export const clearConversation = async (req, res, next) => {
  try {
    const conversation = await conversationService.clearConversationMessages(req.params.id, req.user.id);

    if (!conversation) {
      return res.status(404).json({
        success: false,
        message: `Conversation not found with id of ${req.params.id}`,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Conversation messages cleared successfully',
      data: conversation,
    });
  } catch (error) {
    next(error);
  }
};
