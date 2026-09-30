import { Router } from 'express';
import { notificationController } from './notificationController';
import { authenticate } from '../auth/authMiddleware';

const router = Router();

router.use(authenticate);

router.get('/', (req, res, next) => notificationController.list(req, res, next));
router.get('/unread-count', (req, res, next) => notificationController.unreadCount(req, res, next));
router.post('/read-all', (req, res, next) => notificationController.markAllRead(req, res, next));
router.post('/:id/read', (req, res, next) => notificationController.markRead(req, res, next));

export default router;
