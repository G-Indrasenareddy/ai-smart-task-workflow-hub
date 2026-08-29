import { apiClient } from './apiClient';

export const aiApi = {
  // Existing AI Methods
  async chatWithAI(message, history = []) {
    const res = await apiClient('/ai/chat', {
      method: 'POST',
      body: { message, history },
    });
    return res.data;
  },

  async suggestSubtasks(goalTitle, goalDescription = '') {
    const res = await apiClient('/ai/suggest-tasks', {
      method: 'POST',
      body: { goalTitle, goalDescription },
    });
    return res.data;
  },

  async getAIInsights() {
    const res = await apiClient('/ai/insights', {
      method: 'GET',
    });
    return res.data;
  },

  // Persistent Conversation Methods
  async createConversation(title = 'New Conversation') {
    const res = await apiClient('/ai/conversations', {
      method: 'POST',
      body: { title },
    });
    return res.data;
  },

  async getConversations() {
    const res = await apiClient('/ai/conversations', {
      method: 'GET',
    });
    return res.data;
  },

  async getConversation(id) {
    const res = await apiClient(`/ai/conversations/${id}`, {
      method: 'GET',
    });
    return res.data;
  },

  async sendConversationMessage(id, message) {
    const res = await apiClient(`/ai/conversations/${id}/messages`, {
      method: 'POST',
      body: { message },
    });
    return res.data;
  },

  async renameConversation(id, title) {
    const res = await apiClient(`/ai/conversations/${id}`, {
      method: 'PUT',
      body: { title },
    });
    return res.data;
  },

  async deleteConversation(id) {
    const res = await apiClient(`/ai/conversations/${id}`, {
      method: 'DELETE',
    });
    return res;
  },

  async clearConversation(id) {
    const res = await apiClient(`/ai/conversations/${id}/messages`, {
      method: 'DELETE',
    });
    return res.data;
  },
};
