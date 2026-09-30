import { query, execute } from '../database/db';
import { config } from '../config';
import { AppError } from '../common/errors';
import { getTodayInKolkata } from '../common/utils';
import { notificationService } from '../notification/notificationService';

export class RewardService {
  async getBalance(userId: number): Promise<number> {
    const rows = await query<any[]>(
      'SELECT COALESCE(SUM(points), 0) as balance FROM reward_ledger WHERE user_id = ?',
      [userId]
    );
    return Number(rows[0].balance);
  }

  async getHistory(userId: number) {
    return query<any[]>(
      `SELECT id, points, reason, request_id as requestId, created_at as createdAt
       FROM reward_ledger
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [userId]
    );
  }

  async awardPoints(
    userId: number,
    eventType: string,
    reason: string,
    requestId?: number | null,
    grantedBy?: number | null
  ) {
    // 1. Fetch rule points
    const rules = await query<any[]>(
      'SELECT points, daily_cap_points FROM reward_rules WHERE event_type = ? LIMIT 1',
      [eventType]
    );

    const points = rules.length > 0 ? Number(rules[0].points) : 10;
    const dailyCap = rules.length > 0 ? Number(rules[0].daily_cap_points) : config.reward.dailyAutoCap;

    // 2. Check daily points accumulated from automatic rewards today
    const todayKolkata = getTodayInKolkata();
    const [todayAutoPoints]: any = await query(
      `SELECT COALESCE(SUM(points), 0) as totalToday
       FROM reward_ledger
       WHERE user_id = ? AND granted_by IS NULL AND points > 0
         AND DATE(CONVERT_TZ(created_at, '+00:00', ?)) = ?`,
      [userId, config.server.timezone, todayKolkata]
    );

    if (grantedBy === null && Number(todayAutoPoints.totalToday) >= dailyCap) {
      // Daily cap reached for automatic rewards
      return { awarded: false, message: 'Daily reward cap reached' };
    }

    // 3. Insert ledger entry (Append-only)
    await execute(
      `INSERT INTO reward_ledger (user_id, points, reason, request_id, granted_by, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, points, reason, requestId || null, grantedBy || null]
    );

    // Notify citizen
    await notificationService.notify({
      userId,
      type: 'REWARD',
      title: 'Reward Points Earned!',
      body: `You received ${points} civic reward points: ${reason}`,
      requestId,
    });

    return { awarded: true, points };
  }

  async manualGrantOrDeduct(
    adminId: number,
    userId: number,
    points: number,
    reason: string,
    requestId?: number | null
  ) {
    if (!reason || reason.trim().length === 0) {
      throw AppError.badRequest('Mandatory note/reason is required for manual reward adjustment');
    }

    await execute(
      `INSERT INTO reward_ledger (user_id, points, reason, request_id, granted_by, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [userId, points, reason.trim(), requestId || null, adminId]
    );

    await execute(
      `INSERT INTO audit_log (actor_id, actor_role, action, entity_type, entity_id, after_json, created_at)
       VALUES (?, 'ADMIN', 'MANUAL_REWARD_ADJUSTMENT', 'USER', ?, ?, NOW())`,
      [adminId, userId, JSON.stringify({ points, reason, requestId })]
    );

    return { success: true, points, reason };
  }
}

export const rewardService = new RewardService();
