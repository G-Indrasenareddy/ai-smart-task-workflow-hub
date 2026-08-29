import Notification from '../models/Notification.js';

export const notificationService = {
  async createNotification(userId, data) {
    try {
      const notification = await Notification.create({
        ...data,
        user: userId,
      });
      return notification;
    } catch (error) {
      // Ignore duplicate key error for dedupKey cleanly
      if (error.code === 11000) {
        return null;
      }
      throw error;
    }
  },

  async getUserNotifications(userId) {
    return await Notification.find({ user: userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('relatedTask', 'title status dueDate')
      .populate('relatedGoal', 'title progress status');
  },

  async getUnreadCount(userId) {
    return await Notification.countDocuments({ user: userId, isRead: false });
  },

  async markAsRead(id, userId) {
    return await Notification.findOneAndUpdate(
      { _id: id, user: userId },
      { isRead: true },
      { returnDocument: 'after' }
    );
  },

  async markAllAsRead(userId) {
    await Notification.updateMany(
      { user: userId, isRead: false },
      { isRead: true }
    );
    return true;
  },

  async deleteNotification(id, userId) {
    return await Notification.findOneAndDelete({ _id: id, user: userId });
  },
};
