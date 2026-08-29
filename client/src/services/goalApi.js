import { apiClient } from './apiClient';

export const goalApi = {
  async getGoals(params = {}) {
    const cleanParams = {};
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        cleanParams[key] = params[key];
      }
    });

    const queryStr = new URLSearchParams(cleanParams).toString();
    const endpoint = queryStr ? `/goals?${queryStr}` : '/goals';
    const res = await apiClient(endpoint);
    return res.data;
  },

  async getGoalById(id) {
    const res = await apiClient(`/goals/${id}`);
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
    return res.data;
  },
};
