import { Request, Response, NextFunction } from 'express';
import { notificationService } from './notificationService';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/errors';

export class NotificationController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const unreadOnly = req.query.unreadOnly === 'true';
      const page = Math.max(0, Number(req.query.page) || 0);
      const size = Math.min(100, Math.max(1, Number(req.query.size) || 20));

      const { items, total } = await notificationService.getNotifications(
        userId,
        unreadOnly,
        page,
        size
      );

      return sendSuccess(res, items, 200, { page, size, total });
    } catch (err) {
      next(err);
    }
  }

  async markRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const id = Number(req.params.id);
      if (isNaN(id)) throw AppError.badRequest('Invalid notification ID');

      const result = await notificationService.markAsRead(userId, id);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async markAllRead(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await notificationService.markAllAsRead(userId);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async unreadCount(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const count = await notificationService.getUnreadCount(userId);
      return sendSuccess(res, { unreadCount: count });
    } catch (err) {
      next(err);
    }
  }
}

export const notificationController = new NotificationController();
