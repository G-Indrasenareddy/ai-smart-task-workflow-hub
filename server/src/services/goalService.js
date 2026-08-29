import Goal from '../models/Goal.js';

export const goalService = {
  async getAllGoals(userId) {
    return await Goal.find({ user: userId }).sort({ createdAt: -1 });
  },

  async getGoalById(id, userId) {
    return await Goal.findOne({ _id: id, user: userId });
  },

  async createGoal(goalData, userId) {
    // Strip client-provided user field for security
    const { user, ...cleanData } = goalData;
    return await Goal.create({
      ...cleanData,
      user: userId,
    });
  },

  async updateGoal(id, goalData, userId) {
    const { user, ...cleanData } = goalData;
    return await Goal.findOneAndUpdate(
      { _id: id, user: userId },
      cleanData,
      {
        returnDocument: 'after',
        runValidators: true,
      }
    );
  },

  async deleteGoal(id, userId) {
    return await Goal.findOneAndDelete({ _id: id, user: userId });
  },
};
