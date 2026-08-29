import { apiClient } from './apiClient';

export const notificationApi = {
  async getNotifications() {
    const res = await apiClient('/notifications');
    return res;
  },

  async getUnreadCount() {
    const res = await apiClient('/notifications/unread-count');
    return res.unreadCount;
  },

  async markAsRead(id) {
    const res = await apiClient(`/notifications/${id}/read`, {
      method: 'PUT',
    });
    return res.data;
  },

  async markAllAsRead() {
    const res = await apiClient('/notifications/read-all', {
      method: 'PUT',
    });
    return res;
  },

  async deleteNotification(id) {
    const res = await apiClient(`/notifications/${id}`, {
      method: 'DELETE',
    });
    return res;
  },
};
