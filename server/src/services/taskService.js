import Task from '../models/Task.js';
import Goal from '../models/Goal.js';

export const taskService = {
  async getAllTasks(userId, query = {}) {
    const filter = { user: userId };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.priority) {
      filter.priority = query.priority;
    }

    if (query.goal) {
      filter.goal = query.goal;
    }

    if (query.search && query.search.trim() !== '') {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    return await Task.find(filter)
      .sort(sort)
      .populate('goal', 'title progress status');
  },

  async getTaskById(id, userId) {
    return await Task.findOne({ _id: id, user: userId }).populate('goal', 'title progress status');
  },

  async createTask(taskData, userId) {
    const { user, ...cleanData } = taskData;

    // Validate optional goal ownership
    if (cleanData.goal) {
      const goalExists = await Goal.findOne({ _id: cleanData.goal, user: userId });
      if (!goalExists) {
        throw new Error('Selected goal does not exist or does not belong to you');
      }
    } else {
      cleanData.goal = null;
    }

    // Set completedAt timestamp if created as Completed
    if (cleanData.status === 'Completed') {
      cleanData.completedAt = new Date();
    }

    const task = await Task.create({
      ...cleanData,
      user: userId,
    });

    return await Task.findById(task._id).populate('goal', 'title progress status');
  },

  async updateTask(id, taskData, userId) {
    const { user, ...cleanData } = taskData;

    const existingTask = await Task.findOne({ _id: id, user: userId });
    if (!existingTask) {
      return null;
    }

    // Validate optional goal ownership if goal is changing
    if (cleanData.goal !== undefined && cleanData.goal !== null) {
      const goalExists = await Goal.findOne({ _id: cleanData.goal, user: userId });
      if (!goalExists) {
        throw new Error('Selected goal does not exist or does not belong to you');
      }
    }

    // Manage completedAt timestamp
    if (cleanData.status === 'Completed') {
      cleanData.completedAt = existingTask.completedAt || new Date();
    } else if (cleanData.status && cleanData.status !== 'Completed') {
      cleanData.completedAt = null;
    }

    const updated = await Task.findOneAndUpdate(
      { _id: id, user: userId },
      cleanData,
      {
        returnDocument: 'after',
        runValidators: true,
      }
    ).populate('goal', 'title progress status');

    return updated;
  },

  async deleteTask(id, userId) {
    return await Task.findOneAndDelete({ _id: id, user: userId });
  },
};
