import { apiClient } from './apiClient';

export const aiApi = {
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
};
