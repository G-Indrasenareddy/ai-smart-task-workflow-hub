const VALID_GOAL_STATUSES = ['Active', 'Completed', 'At Risk'];
const VALID_SORT_BY = ['targetDate', 'progress', 'createdAt', 'title'];
const VALID_SORT_ORDER = ['asc', 'desc'];

export const validateCreateGoal = (req, res, next) => {
  const { title, description, progress, status, targetDate, tasksCount } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Goal title is required and must be a non-empty string',
    });
  }

  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Goal description must be a string',
    });
  }

  if (progress !== undefined && (typeof progress !== 'number' || isNaN(progress) || progress < 0 || progress > 100)) {
    return res.status(400).json({
      success: false,
      message: 'Goal progress must be a number between 0 and 100',
    });
  }

  if (status !== undefined && !VALID_GOAL_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid goal status. Must be one of: ${VALID_GOAL_STATUSES.join(', ')}`,
    });
  }

  if (targetDate !== undefined && typeof targetDate !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Goal target date must be a string',
    });
  }

  if (tasksCount !== undefined && (typeof tasksCount !== 'number' || isNaN(tasksCount) || tasksCount < 0)) {
    return res.status(400).json({
      success: false,
      message: 'Goal tasks count must be a non-negative number',
    });
  }

  next();
};

export const validateUpdateGoal = (req, res, next) => {
  const { title, description, progress, status, targetDate, tasksCount } = req.body;

  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    return res.status(400).json({
      success: false,
      message: 'Goal title must be a non-empty string',
    });
  }

  if (description !== undefined && typeof description !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Goal description must be a string',
    });
  }

  if (progress !== undefined && (typeof progress !== 'number' || isNaN(progress) || progress < 0 || progress > 100)) {
    return res.status(400).json({
      success: false,
      message: 'Goal progress must be a number between 0 and 100',
    });
  }

  if (status !== undefined && !VALID_GOAL_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid goal status. Must be one of: ${VALID_GOAL_STATUSES.join(', ')}`,
    });
  }

  if (targetDate !== undefined && typeof targetDate !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Goal target date must be a string',
    });
  }

  if (tasksCount !== undefined && (typeof tasksCount !== 'number' || isNaN(tasksCount) || tasksCount < 0)) {
    return res.status(400).json({
      success: false,
      message: 'Goal tasks count must be a non-negative number',
    });
  }

  next();
};

export const validateGoalQueryParams = (req, res, next) => {
  const { status, sortBy, sortOrder, search } = req.query;

  if (status && !VALID_GOAL_STATUSES.includes(status)) {
    return res.status(400).json({
      success: false,
      message: `Invalid status query parameter. Allowed: ${VALID_GOAL_STATUSES.join(', ')}`,
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

  if (search && (typeof search !== 'string' || search.length > 100)) {
    return res.status(400).json({
      success: false,
      message: 'Search query parameter exceeds maximum length of 100 characters',
    });
  }

  next();
};
