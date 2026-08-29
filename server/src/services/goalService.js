import Goal from '../models/Goal.js';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { notificationService } from './notificationService.js';

export const goalService = {
  async getAllGoals(userId, query = {}) {
    const filter = { user: userId };

    if (query.status) {
      filter.status = query.status;
    }

    if (query.search && query.search.trim() !== '') {
      const searchRegex = new RegExp(query.search.trim(), 'i');
      filter.$or = [{ title: searchRegex }, { description: searchRegex }];
    }

    const sortField = query.sortBy || 'createdAt';
    const sortOrder = query.sortOrder === 'asc' ? 1 : -1;
    const sort = { [sortField]: sortOrder };

    return await Goal.find(filter).sort(sort);
  },

  async getGoalById(id, userId) {
    return await Goal.findOne({ _id: id, user: userId });
  },

  async createGoal(goalData, userId) {
    const { user, ...cleanData } = goalData;

    // Automatic completion behavior when progress reaches 100%
    if (cleanData.progress === 100) {
      cleanData.status = 'Completed';
      cleanData.completedAt = new Date();
    }

    const createdGoal = await Goal.create({
      ...cleanData,
      user: userId,
    });

    // Check user preferences and trigger notification if enabled
    const userDoc = await User.findById(userId);
    const prefs = userDoc?.notificationPreferences || { goalProgressUpdates: true };

    if (prefs.goalProgressUpdates && createdGoal.progress > 0) {
      const dedupKey = `goal_progress_${createdGoal._id}_${createdGoal.progress}`;
      await notificationService.createNotification(userId, {
        type: 'GOAL_PROGRESS',
        title: createdGoal.progress === 100 ? 'Goal Completed 🎉' : 'Goal Progress Update',
        message:
          createdGoal.progress === 100
            ? `Congratulations! Goal "${createdGoal.title}" has reached 100% completion.`
            : `Goal "${createdGoal.title}" progress updated to ${createdGoal.progress}%.`,
        relatedGoal: createdGoal._id,
        dedupKey,
      });
    }

    return createdGoal;
  },

  async updateGoal(id, goalData, userId) {
    const { user, ...cleanData } = goalData;

    const existingGoal = await Goal.findOne({ _id: id, user: userId });
    if (!existingGoal) {
      return null;
    }

    // Auto completion management
    if (cleanData.progress === 100) {
      cleanData.status = 'Completed';
      cleanData.completedAt = existingGoal.completedAt || new Date();
    } else if (cleanData.progress !== undefined && cleanData.progress < 100) {
      if (existingGoal.status === 'Completed' && (!cleanData.status || cleanData.status === 'Completed')) {
        cleanData.status = 'Active';
      }
      cleanData.completedAt = null;
    }

    const updatedGoal = await Goal.findOneAndUpdate(
      { _id: id, user: userId },
      cleanData,
      {
        returnDocument: 'after',
        runValidators: true,
      }
    );

    // Trigger notification on progress increase or 100% completion
    const userDoc = await User.findById(userId);
    const prefs = userDoc?.notificationPreferences || { goalProgressUpdates: true };

    if (prefs.goalProgressUpdates && updatedGoal && updatedGoal.progress !== existingGoal.progress) {
      const dedupKey = `goal_progress_${updatedGoal._id}_${updatedGoal.progress}`;
      await notificationService.createNotification(userId, {
        type: 'GOAL_PROGRESS',
        title: updatedGoal.progress === 100 ? 'Goal Completed 🎉' : 'Goal Progress Update',
        message:
          updatedGoal.progress === 100
            ? `Congratulations! Goal "${updatedGoal.title}" has reached 100% completion.`
            : `Goal "${updatedGoal.title}" progress updated to ${updatedGoal.progress}%.`,
        relatedGoal: updatedGoal._id,
        dedupKey,
      });
    }

    return updatedGoal;
  },

  async deleteGoal(id, userId) {
    // Unlink tasks referencing this goal safely without modifying another user's tasks
    await Task.updateMany({ goal: id, user: userId }, { goal: null });
    return await Goal.findOneAndDelete({ _id: id, user: userId });
  },
};
