import { Router } from 'express';
import {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} from '../controllers/notificationController.js';
import { validateNotificationId } from '../middleware/notificationValidation.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Protect all notification routes
router.use(protect);

router.get('/', getNotifications);
router.get('/unread-count', getUnreadCount);
router.put('/read-all', markAllAsRead);
router.put('/:id/read', validateNotificationId, markAsRead);
router.delete('/:id', validateNotificationId, deleteNotification);

export default router;
