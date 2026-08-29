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

  async updateProfile(name, email) {
    return await apiClient('/auth/profile', {
      method: 'PUT',
      body: { name, email },
    });
  },

  async updateNotificationPreferences(preferences) {
    return await apiClient('/auth/notification-preferences', {
      method: 'PUT',
      body: preferences,
    });
  },

  async changePassword(currentPassword, newPassword) {
    return await apiClient('/auth/password', {
      method: 'PUT',
      body: { currentPassword, newPassword },
    });
  },
};
