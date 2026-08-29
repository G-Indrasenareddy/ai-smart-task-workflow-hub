import { apiClient } from './apiClient';

export const goalApi = {
  async getGoals() {
    const res = await apiClient('/goals', { method: 'GET' });
    return res.data || [];
  },

  async getGoalById(id) {
    const res = await apiClient(`/goals/${id}`, { method: 'GET' });
    return res.data;
  },

  async createGoal(goalData) {
    const res = await apiClient('/goals', {
      method: 'POST',
      body: goalData,
    });
    return res.data;
  },

  async updateGoal(id, goalData) {
    const res = await apiClient(`/goals/${id}`, {
      method: 'PUT',
      body: goalData,
    });
    return res.data;
  },

  async deleteGoal(id) {
    const res = await apiClient(`/goals/${id}`, {
      method: 'DELETE',
    });
    return res;
  },
};
