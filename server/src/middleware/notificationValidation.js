import mongoose from 'mongoose';

export const validateNotificationId = (req, res, next) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid notification ID format',
    });
  }
  next();
};
