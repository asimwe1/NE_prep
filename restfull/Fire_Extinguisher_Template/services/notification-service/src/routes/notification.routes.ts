import { Router } from 'express';
import { param } from 'express-validator';
import { authenticate, requireRole } from '../middleware/auth.middleware';
import { getNotifications, acknowledgeNotification, getNotificationStats } from '../controllers/notification.controller';

const router = Router();

router.get('/notifications', authenticate, getNotifications);
router.patch('/notifications/:id/acknowledge', authenticate, [param('id').isUUID()], acknowledgeNotification);
router.get('/notifications/stats', authenticate, requireRole('staff', 'admin'), getNotificationStats);

export default router;
