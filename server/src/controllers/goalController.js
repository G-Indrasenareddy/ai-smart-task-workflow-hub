import { goalService } from '../services/goalService.js';

export const getGoals = async (req, res, next) => {
  try {
    const goals = await goalService.getAllGoals(req.user.id);
    res.status(200).json({
      success: true,
      count: goals.length,
      data: goals,
    });
  } catch (error) {
    next(error);
  }
};

export const getGoalById = async (req, res, next) => {
  try {
    const goal = await goalService.getGoalById(req.params.id, req.user.id);
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: `Goal not found with id of ${req.params.id}`,
      });
    }
    res.status(200).json({
      success: true,
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

export const createGoal = async (req, res, next) => {
  try {
    const goal = await goalService.createGoal(req.body, req.user.id);
    res.status(201).json({
      success: true,
      message: 'Goal created successfully',
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

export const updateGoal = async (req, res, next) => {
  try {
    const goal = await goalService.updateGoal(req.params.id, req.body, req.user.id);
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: `Goal not found with id of ${req.params.id}`,
      });
    }
    res.status(200).json({
      success: true,
      message: 'Goal updated successfully',
      data: goal,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteGoal = async (req, res, next) => {
  try {
    const goal = await goalService.deleteGoal(req.params.id, req.user.id);
    if (!goal) {
      return res.status(404).json({
        success: false,
        message: `Goal not found with id of ${req.params.id}`,
      });
    }
    res.status(200).json({
      success: true,
      message: 'Goal deleted successfully',
      data: {},
    });
  } catch (error) {
    next(error);
  }
};
