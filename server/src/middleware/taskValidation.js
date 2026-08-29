const VALID_STATUSES = ['To Do', 'In Progress', 'Completed'];
const VALID_PRIORITIES = ['High', 'Medium', 'Low'];

export const validateCreateTask = (req, res, next) => {
  const { title, description, status, priority, dueDate } = req.body;

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

  next();
};

export const validateUpdateTask = (req, res, next) => {
  const { title, description, status, priority, dueDate } = req.body;

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

  next();
};
