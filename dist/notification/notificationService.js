"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.notificationService = exports.NotificationService = exports.EmailChannel = exports.SmsChannel = exports.InAppChannel = void 0;
const db_1 = require("../database/db");
class InAppChannel {
    async send(payload) {
        await (0, db_1.execute)(`INSERT INTO notifications (user_id, type, title, body, request_id, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`, [payload.userId, payload.type, payload.title, payload.body, payload.requestId || null]);
    }
}
exports.InAppChannel = InAppChannel;
class SmsChannel {
    async send(payload) {
        console.log(`[SMS Stub] To user ${payload.userId}: [${payload.type}] ${payload.title} - ${payload.body}`);
    }
}
exports.SmsChannel = SmsChannel;
class EmailChannel {
    async send(payload) {
        console.log(`[Email Stub] To user ${payload.userId}: [${payload.type}] ${payload.title} - ${payload.body}`);
    }
}
exports.EmailChannel = EmailChannel;
class NotificationService {
    channels = [
        new InAppChannel(),
        new SmsChannel(),
        new EmailChannel(),
    ];
    async notify(payload) {
        for (const channel of this.channels) {
            try {
                await channel.send(payload);
            }
            catch (err) {
                console.error('[NotificationService] Channel send error:', err);
            }
        }
    }
    async notifyAdmins(title, body, requestId) {
        const admins = await (0, db_1.query)('SELECT id FROM users WHERE role = "ADMIN" AND deleted_at IS NULL');
        for (const admin of admins) {
            await this.notify({
                userId: admin.id,
                type: 'SYSTEM',
                title,
                body,
                requestId,
            });
        }
    }
    async notifyVolunteers(title, body, requestId) {
        const volunteers = await (0, db_1.query)('SELECT id FROM users WHERE role = "CITIZEN" AND verification_status = "VERIFIED" AND deleted_at IS NULL');
        for (const vol of volunteers) {
            await this.notify({
                userId: vol.id,
                type: 'ESCALATION',
                title,
                body,
                requestId,
            });
        }
    }
    async getNotifications(userId, unreadOnly = false, page = 0, size = 20) {
        const offset = page * size;
        let where = 'WHERE user_id = ?';
        const params = [userId];
        if (unreadOnly) {
            where += ' AND read_at IS NULL';
        }
        const rows = await (0, db_1.query)(`SELECT id, type, title, body, request_id as requestId, read_at as readAt, created_at as createdAt
       FROM notifications
       ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`, [...params, size, offset]);
        const countRows = await (0, db_1.query)(`SELECT COUNT(*) as total FROM notifications ${where}`, params);
        return {
            items: rows,
            total: Number(countRows[0].total),
        };
    }
    async markAsRead(userId, notificationId) {
        await (0, db_1.execute)('UPDATE notifications SET read_at = NOW() WHERE id = ? AND user_id = ?', [notificationId, userId]);
        return { success: true };
    }
    async markAllAsRead(userId) {
        await (0, db_1.execute)('UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL', [userId]);
        return { success: true };
    }
    async getUnreadCount(userId) {
        const rows = await (0, db_1.query)('SELECT COUNT(*) as unreadCount FROM notifications WHERE user_id = ? AND read_at IS NULL', [userId]);
        return Number(rows[0].unreadCount);
    }
}
exports.NotificationService = NotificationService;
exports.notificationService = new NotificationService();
