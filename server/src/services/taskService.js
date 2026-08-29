import Task from '../models/Task.js';

export const taskService = {
  async getAllTasks(userId) {
    return await Task.find({ user: userId }).sort({ createdAt: -1 });
  },

  async getTaskById(id, userId) {
    return await Task.findOne({ _id: id, user: userId });
  },

  async createTask(taskData, userId) {
    // Strip client-provided user field for security
    const { user, ...cleanData } = taskData;
    return await Task.create({
      ...cleanData,
      user: userId,
    });
  },

  async updateTask(id, taskData, userId) {
    const { user, ...cleanData } = taskData;
    return await Task.findOneAndUpdate(
      { _id: id, user: userId },
      cleanData,
      {
        returnDocument: 'after',
        runValidators: true,
      }
    );
  },

  async deleteTask(id, userId) {
    return await Task.findOneAndDelete({ _id: id, user: userId });
  },
};
