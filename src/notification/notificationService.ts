import { query, execute } from '../database/db';

export type NotificationType =
  | 'STATUS_CHANGE'
  | 'CLAIM'
  | 'ASSIGNMENT'
  | 'ESCALATION'
  | 'RATING'
  | 'VERIFICATION'
  | 'REWARD'
  | 'SYSTEM';

export interface NotificationPayload {
  userId: number;
  type: NotificationType;
  title: string;
  body: string;
  requestId?: number | null;
}

export interface NotificationChannel {
  send(payload: NotificationPayload): Promise<void>;
}

export class InAppChannel implements NotificationChannel {
  async send(payload: NotificationPayload): Promise<void> {
    await execute(
      `INSERT INTO notifications (user_id, type, title, body, request_id, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [payload.userId, payload.type, payload.title, payload.body, payload.requestId || null]
    );
  }
}

export class SmsChannel implements NotificationChannel {
  async send(payload: NotificationPayload): Promise<void> {
    console.log(`[SMS Stub] To user ${payload.userId}: [${payload.type}] ${payload.title} - ${payload.body}`);
  }
}

export class EmailChannel implements NotificationChannel {
  async send(payload: NotificationPayload): Promise<void> {
    console.log(`[Email Stub] To user ${payload.userId}: [${payload.type}] ${payload.title} - ${payload.body}`);
  }
}

export class NotificationService {
  private channels: NotificationChannel[] = [
    new InAppChannel(),
    new SmsChannel(),
    new EmailChannel(),
  ];

  async notify(payload: NotificationPayload): Promise<void> {
    for (const channel of this.channels) {
      try {
        await channel.send(payload);
      } catch (err) {
        console.error('[NotificationService] Channel send error:', err);
      }
    }
  }

  async notifyAdmins(title: string, body: string, requestId?: number | null): Promise<void> {
    const admins = await query<any[]>('SELECT id FROM users WHERE role = "ADMIN" AND deleted_at IS NULL');
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

  async notifyVolunteers(title: string, body: string, requestId?: number | null): Promise<void> {
    const volunteers = await query<any[]>(
      'SELECT id FROM users WHERE role = "CITIZEN" AND verification_status = "VERIFIED" AND deleted_at IS NULL'
    );
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

  async getNotifications(userId: number, unreadOnly: boolean = false, page: number = 0, size: number = 20) {
    const offset = page * size;
    let where = 'WHERE user_id = ?';
    const params: any[] = [userId];

    if (unreadOnly) {
      where += ' AND read_at IS NULL';
    }

    const rows = await query<any[]>(
      `SELECT id, type, title, body, request_id as requestId, read_at as readAt, created_at as createdAt
       FROM notifications
       ${where}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, size, offset]
    );

    const countRows = await query<any[]>(
      `SELECT COUNT(*) as total FROM notifications ${where}`,
      params
    );

    return {
      items: rows,
      total: Number(countRows[0].total),
    };
  }

  async markAsRead(userId: number, notificationId: number) {
    await execute(
      'UPDATE notifications SET read_at = NOW() WHERE id = ? AND user_id = ?',
      [notificationId, userId]
    );
    return { success: true };
  }

  async markAllAsRead(userId: number) {
    await execute(
      'UPDATE notifications SET read_at = NOW() WHERE user_id = ? AND read_at IS NULL',
      [userId]
    );
    return { success: true };
  }

  async getUnreadCount(userId: number): Promise<number> {
    const rows = await query<any[]>(
      'SELECT COUNT(*) as unreadCount FROM notifications WHERE user_id = ? AND read_at IS NULL',
      [userId]
    );
    return Number(rows[0].unreadCount);
  }
}

export const notificationService = new NotificationService();
