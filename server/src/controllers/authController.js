import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import { config } from '../config/env.js';

const generateToken = (id) => {
  return jwt.sign({ id }, config.jwtSecret, {
    expiresIn: config.jwtExpiresIn,
  });
};

const formatUserResponse = (user) => ({
  id: user.id || user._id.toString(),
  name: user.name,
  email: user.email,
  notificationPreferences: user.notificationPreferences || {
    taskDueReminders: true,
    overdueTaskAlerts: true,
    goalProgressUpdates: true,
    weeklyProductivitySummary: false,
  },
});

export const register = async (req, res, next) => {
  try {
    const { name, email, password } = req.body;

    const userExists = await User.findOne({ email: email.toLowerCase() });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Email is already registered',
      });
    }

    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      password,
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Logged in successfully',
      token,
      user: formatUserResponse(user),
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      data: formatUserResponse(req.user),
    });
  } catch (error) {
    next(error);
  }
};

export const updateProfile = async (req, res, next) => {
  try {
    const { name, email } = req.body;
    const cleanEmail = email.toLowerCase().trim();

    // Check if email is in use by another user
    const existingUser = await User.findOne({
      email: cleanEmail,
      _id: { $ne: req.user.id },
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'Email is already in use by another account',
      });
    }

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { name: name.trim(), email: cleanEmail },
      { returnDocument: 'after', runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      user: formatUserResponse(updatedUser),
    });
  } catch (error) {
    next(error);
  }
};

export const updateNotificationPreferences = async (req, res, next) => {
  try {
    const { taskDueReminders, overdueTaskAlerts, goalProgressUpdates, weeklyProductivitySummary } = req.body;

    const currentPreferences = req.user.notificationPreferences || {
      taskDueReminders: true,
      overdueTaskAlerts: true,
      goalProgressUpdates: true,
      weeklyProductivitySummary: false,
    };

    const newPreferences = {
      taskDueReminders: taskDueReminders !== undefined ? taskDueReminders : currentPreferences.taskDueReminders,
      overdueTaskAlerts: overdueTaskAlerts !== undefined ? overdueTaskAlerts : currentPreferences.overdueTaskAlerts,
      goalProgressUpdates: goalProgressUpdates !== undefined ? goalProgressUpdates : currentPreferences.goalProgressUpdates,
      weeklyProductivitySummary:
        weeklyProductivitySummary !== undefined ? weeklyProductivitySummary : currentPreferences.weeklyProductivitySummary,
    };

    const updatedUser = await User.findByIdAndUpdate(
      req.user.id,
      { notificationPreferences: newPreferences },
      { returnDocument: 'after', runValidators: true }
    );

    res.status(200).json({
      success: true,
      message: 'Notification preferences updated successfully',
      user: formatUserResponse(updatedUser),
    });
  } catch (error) {
    next(error);
  }
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    user.password = newPassword;
    await user.save();

    const token = generateToken(user._id);

    res.status(200).json({
      success: true,
      message: 'Password changed successfully',
      token,
    });
  } catch (error) {
    next(error);
  }
};
