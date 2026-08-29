import { apiClient } from './apiClient';

export const taskApi = {
  async getTasks() {
    const res = await apiClient('/tasks', { method: 'GET' });
    return res.data || [];
  },

  async getTaskById(id) {
    const res = await apiClient(`/tasks/${id}`, { method: 'GET' });
    return res.data;
  },

  async createTask(taskData) {
    const res = await apiClient('/tasks', {
      method: 'POST',
      body: taskData,
    });
    return res.data;
  },

  async updateTask(id, taskData) {
    const res = await apiClient(`/tasks/${id}`, {
      method: 'PUT',
      body: taskData,
    });
    return res.data;
  },

  async deleteTask(id) {
    const res = await apiClient(`/tasks/${id}`, {
      method: 'DELETE',
    });
    return res;
  },
};
