export type NotificationType = 'STATUS_CHANGE' | 'CLAIM' | 'ASSIGNMENT' | 'ESCALATION' | 'RATING' | 'VERIFICATION' | 'REWARD' | 'SYSTEM';
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
export declare class InAppChannel implements NotificationChannel {
    send(payload: NotificationPayload): Promise<void>;
}
export declare class SmsChannel implements NotificationChannel {
    send(payload: NotificationPayload): Promise<void>;
}
export declare class EmailChannel implements NotificationChannel {
    send(payload: NotificationPayload): Promise<void>;
}
export declare class NotificationService {
    private channels;
    notify(payload: NotificationPayload): Promise<void>;
    notifyAdmins(title: string, body: string, requestId?: number | null): Promise<void>;
    notifyVolunteers(title: string, body: string, requestId?: number | null): Promise<void>;
    getNotifications(userId: number, unreadOnly?: boolean, page?: number, size?: number): Promise<{
        items: any[];
        total: number;
    }>;
    markAsRead(userId: number, notificationId: number): Promise<{
        success: boolean;
    }>;
    markAllAsRead(userId: number): Promise<{
        success: boolean;
    }>;
    getUnreadCount(userId: number): Promise<number>;
}
export declare const notificationService: NotificationService;
