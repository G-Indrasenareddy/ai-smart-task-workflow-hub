import Conversation from '../models/Conversation.js';

export const conversationService = {
  async createConversation(userId, title = 'New Conversation') {
    const cleanTitle = title && title.trim() !== '' ? title.trim().substring(0, 100) : 'New Conversation';
    return await Conversation.create({
      user: userId,
      title: cleanTitle,
      messages: [],
    });
  },

  async getUserConversations(userId) {
    return await Conversation.find({ user: userId })
      .select('title user createdAt updatedAt messages')
      .sort({ updatedAt: -1 });
  },

  async getConversationById(conversationId, userId) {
    return await Conversation.findOne({ _id: conversationId, user: userId });
  },

  async addMessage(conversationId, userId, role, content) {
    const conversation = await Conversation.findOne({ _id: conversationId, user: userId });
    if (!conversation) return null;

    conversation.messages.push({
      role,
      content: content.trim(),
      createdAt: new Date(),
    });

    // Auto-update conversation title if still default and this is the first user message
    if (conversation.title === 'New Conversation' && role === 'user' && conversation.messages.length === 1) {
      const generatedTitle = content.trim().length > 30 ? `${content.trim().substring(0, 30)}...` : content.trim();
      conversation.title = generatedTitle;
    }

    conversation.markModified('messages');
    await conversation.save();
    return conversation;
  },

  async updateConversationTitle(conversationId, userId, title) {
    const cleanTitle = title && title.trim() !== '' ? title.trim().substring(0, 100) : 'Untitled Conversation';
    return await Conversation.findOneAndUpdate(
      { _id: conversationId, user: userId },
      { title: cleanTitle },
      { returnDocument: 'after' }
    );
  },

  async deleteConversation(conversationId, userId) {
    return await Conversation.findOneAndDelete({ _id: conversationId, user: userId });
  },

  async clearConversationMessages(conversationId, userId) {
    const conversation = await Conversation.findOne({ _id: conversationId, user: userId });
    if (!conversation) return null;

    conversation.messages = [];
    conversation.markModified('messages');
    await conversation.save();
    return conversation;
  },
};
