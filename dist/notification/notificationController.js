"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationController = exports.NotificationController = void 0;
const notificationService_1 = require("./notificationService");
const response_1 = require("../common/response");
const errors_1 = require("../common/errors");
class NotificationController {
    async list(req, res, next) {
        try {
            const userId = req.user.id;
            const unreadOnly = req.query.unreadOnly === 'true';
            const page = Math.max(0, Number(req.query.page) || 0);
            const size = Math.min(100, Math.max(1, Number(req.query.size) || 20));
            const { items, total } = await notificationService_1.notificationService.getNotifications(userId, unreadOnly, page, size);
            return (0, response_1.sendSuccess)(res, items, 200, { page, size, total });
        }
        catch (err) {
            next(err);
        }
    }
    async markRead(req, res, next) {
        try {
            const userId = req.user.id;
            const id = Number(req.params.id);
            if (isNaN(id))
                throw errors_1.AppError.badRequest('Invalid notification ID');
            const result = await notificationService_1.notificationService.markAsRead(userId, id);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async markAllRead(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await notificationService_1.notificationService.markAllAsRead(userId);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async unreadCount(req, res, next) {
        try {
            const userId = req.user.id;
            const count = await notificationService_1.notificationService.getUnreadCount(userId);
            return (0, response_1.sendSuccess)(res, { unreadCount: count });
        }
        catch (err) {
            next(err);
        }
    }
}
exports.NotificationController = NotificationController;
exports.notificationController = new NotificationController();
