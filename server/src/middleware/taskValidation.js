import mongoose from 'mongoose';

const VALID_STATUSES = ['To Do', 'In Progress', 'Completed'];
const VALID_PRIORITIES = ['High', 'Medium', 'Low'];
const VALID_SORT_BY = ['dueDate', 'priority', 'createdAt', 'title'];
const VALID_SORT_ORDER = ['asc', 'desc'];

export const validateCreateTask = (req, res, next) => {
  const { title, description, status, priority, dueDate, goal } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Task title is required and must be a non-empty string',
    });
  }

  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Task description must be a string',
    });
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid task status. Must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }

  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({
      success: false,
      message: `Invalid task priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`,
    });
  }

  if (dueDate !== undefined && typeof dueDate !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Task due date must be a string',
    });
  }

  if (goal !== undefined && goal !== null && !mongoose.Types.ObjectId.isValid(goal)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid goal ID format',
    });
  }

  next();
};

export const validateUpdateTask = (req, res, next) => {
  const { title, description, status, priority, dueDate, goal } = req.body;

  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    return res.status(400).json({
      success: false,
      message: 'Task title must be a non-empty string',
    });
  }

  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Task description must be a string',
    });
  }

  if (status !== undefined && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid task status. Must be one of: ${VALID_STATUSES.join(', ')}`,
    });
  }

  if (priority !== undefined && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({
      success: false,
      message: `Invalid task priority. Must be one of: ${VALID_PRIORITIES.join(', ')}`,
    });
  }

  if (dueDate !== undefined && typeof dueDate !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Task due date must be a string',
    });
  }

  if (goal !== undefined && goal !== null && !mongoose.Types.ObjectId.isValid(goal)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid goal ID format',
    });
  }

  next();
};

export const validateTaskQueryParams = (req, res, next) => {
  const { status, priority, sortBy, sortOrder, goal, search } = req.query;

  if (status && !VALID_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status query parameter. Allowed: ${VALID_STATUSES.join(', ')}`,
    });
  }

  if (priority && !VALID_PRIORITIES.includes(priority)) {
    return res.status(400).json({
      success: false,
      message: `Invalid priority query parameter. Allowed: ${VALID_PRIORITIES.join(', ')}`,
    });
  }

  if (sortBy && !VALID_SORT_BY.includes(sortBy)) {
    return res.status(400).json({
      success: false,
      message: `Invalid sortBy query parameter. Allowed: ${VALID_SORT_BY.join(', ')}`,
    });
  }

  if (sortOrder && !VALID_SORT_ORDER.includes(sortOrder.toLowerCase())) {
    return res.status(400).json({
      success: false,
      message: `Invalid sortOrder query parameter. Allowed: ${VALID_SORT_ORDER.join(', ')}`,
    });
  }

  if (goal && !mongoose.Types.ObjectId.isValid(goal)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid goal query parameter format',
    });
  }

  if (search && (typeof search !== 'string' || search.length > 100)) {
    return res.status(400).json({
      success: false,
      message: 'Search query parameter exceeds maximum length of 100 characters',
    });
  }

  next();
};
