import { apiClient } from './apiClient';

export const taskApi = {
  async getTasks(params = {}) {
    const cleanParams = {};
    Object.keys(params).forEach((key) => {
      if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
        cleanParams[key] = params[key];
      }
    });

    const queryStr = new URLSearchParams(cleanParams).toString();
    const endpoint = queryStr ? `/tasks?${queryStr}` : '/tasks';
    const res = await apiClient(endpoint);
    return res.data;
  },

  async getTaskById(id) {
    const res = await apiClient(`/tasks/${id}`);
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
    return res.data;
  },
};
