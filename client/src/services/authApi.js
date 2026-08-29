import { apiClient } from './apiClient';

export const authApi = {
  async register(name, email, password) {
    return await apiClient('/auth/register', {
      method: 'POST',
      body: { name, email, password },
    });
  },

  async login(email, password) {
    return await apiClient('/auth/login', {
      method: 'POST',
      body: { email, password },
    });
  },

  async getMe() {
    return await apiClient('/auth/me', {
      method: 'GET',
    });
  },
};
