import mongoose from 'mongoose';
import Task from '../models/Task.js';
import User from '../models/User.js';
import { notificationService } from '../services/notificationService.js';

let intervalId = null;

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function parseDueDate(dueDateStr) {
  if (!dueDateStr) return null;
  const lower = dueDateStr.trim().toLowerCase();

  const todayStr = getLocalDateString(new Date());

  if (lower === 'today') {
    return { isToday: true, isOverdue: false, formattedDate: todayStr };
  }

  if (lower === 'tomorrow') {
    return { isToday: false, isOverdue: false, formattedDate: 'Tomorrow' };
  }

  // Handle YYYY-MM-DD date string directly
  if (/^\d{4}-\d{2}-\d{2}$/.test(dueDateStr.trim())) {
    const taskDateStr = dueDateStr.trim();
    const isToday = taskDateStr === todayStr;
    const isOverdue = taskDateStr < todayStr;
    return { isToday, isOverdue, formattedDate: taskDateStr };
  }

  // Handle standard date string
  const dateObj = new Date(dueDateStr);
  if (!isNaN(dateObj.getTime())) {
    const taskDateStr = getLocalDateString(dateObj);
    const isToday = taskDateStr === todayStr;
    const isOverdue = taskDateStr < todayStr;
    return { isToday, isOverdue, formattedDate: taskDateStr };
  }

  return null;
}

export async function checkTaskReminders() {
  try {
    // Only execute if Mongoose connection is connected (readyState === 1)
    if (mongoose.connection.readyState !== 1) {
      return;
    }

    const todayStr = getLocalDateString(new Date());

    // Find non-completed tasks only
    const pendingTasks = await Task.find({ status: { $ne: 'Completed' } }).populate('user');

    for (const task of pendingTasks) {
      if (!task.user) continue;

      const userPrefs = task.user.notificationPreferences || {
        taskDueReminders: true,
        overdueTaskAlerts: true,
      };

      const dateMeta = parseDueDate(task.dueDate);
      if (!dateMeta) continue;

      // 1. Task Due Today Alert
      if (userPrefs.taskDueReminders && dateMeta.isToday) {
        const dedupKey = `task_due_${task._id}_${todayStr}`;
        await notificationService.createNotification(task.user._id, {
          type: 'TASK_DUE',
          title: 'Task Due Today',
          message: `Your task "${task.title}" is due today.`,
          relatedTask: task._id,
          dedupKey,
        });
      }

      // 2. Overdue Task Alert
      if (userPrefs.overdueTaskAlerts && dateMeta.isOverdue) {
        const dedupKey = `task_overdue_${task._id}_${todayStr}`;
        await notificationService.createNotification(task.user._id, {
          type: 'TASK_OVERDUE',
          title: 'Overdue Task Alert',
          message: `Your task "${task.title}" is past its due date (${dateMeta.formattedDate}).`,
          relatedTask: task._id,
          dedupKey,
        });
      }
    }
  } catch (error) {
    console.error('[ReminderScheduler Error]:', error.message);
  }
}

export function startReminderScheduler() {
  console.log('[ReminderScheduler] Initialized interval scheduler (every 15 mins)');
  // Execute initial scan safely
  checkTaskReminders();
  // Schedule subsequent scans every 15 minutes
  intervalId = setInterval(checkTaskReminders, 15 * 60 * 1000);
}

export function stopReminderScheduler() {
  if (intervalId) {
    clearInterval(intervalId);
    intervalId = null;
    console.log('[ReminderScheduler] Scheduler stopped cleanly.');
  }
}
