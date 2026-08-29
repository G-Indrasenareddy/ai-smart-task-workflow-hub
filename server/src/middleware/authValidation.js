const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegister = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!name || typeof name !== 'string' || name.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Name is required and must be a non-empty string',
    });
  }

  if (!email || typeof email !== 'string' || !EMAIL_REGEX.test(email.trim())) {
    return res.status(400).json({
      success: false,
      message: 'A valid email address is required',
    });
  }

  if (!password || typeof password !== 'string' || password.length < 6) {
    return res.status(400).json({
      success: false,
      message: 'Password is required and must be at least 6 characters',
    });
  }

  next();
};

export const validateLogin = (req, res, next) => {
  const { email, password } = req.body;

  if (!email || typeof email !== 'string' || email.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Email is required',
    });
  }

  if (!password || typeof password !== 'string' || password.trim() === '') {
    return res.status(400).json({
      success: false,
      message: 'Password is required',
    });
  }

  next();
};
