"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.rewardService = exports.RewardService = void 0;
const db_1 = require("../database/db");
const config_1 = require("../config");
const errors_1 = require("../common/errors");
const utils_1 = require("../common/utils");
const notificationService_1 = require("../notification/notificationService");
class RewardService {
    async getBalance(userId) {
        const rows = await (0, db_1.query)('SELECT COALESCE(SUM(points), 0) as balance FROM reward_ledger WHERE user_id = ?', [userId]);
        return Number(rows[0].balance);
    }
    async getHistory(userId) {
        return (0, db_1.query)(`SELECT id, points, reason, request_id as requestId, created_at as createdAt
       FROM reward_ledger
       WHERE user_id = ?
       ORDER BY created_at DESC`, [userId]);
    }
    async awardPoints(userId, eventType, reason, requestId, grantedBy) {
        // 1. Fetch rule points
        const rules = await (0, db_1.query)('SELECT points, daily_cap_points FROM reward_rules WHERE event_type = ? LIMIT 1', [eventType]);
        const points = rules.length > 0 ? Number(rules[0].points) : 10;
        const dailyCap = rules.length > 0 ? Number(rules[0].daily_cap_points) : config_1.config.reward.dailyAutoCap;
        // 2. Check daily points accumulated from automatic rewards today
        const todayKolkata = (0, utils_1.getTodayInKolkata)();
        const [todayAutoPoints] = await (0, db_1.query)(`SELECT COALESCE(SUM(points), 0) as totalToday
       FROM reward_ledger
       WHERE user_id = ? AND granted_by IS NULL AND points > 0
         AND DATE(CONVERT_TZ(created_at, '+00:00', ?)) = ?`, [userId, config_1.config.server.timezone, todayKolkata]);
        if (grantedBy === null && Number(todayAutoPoints.totalToday) >= dailyCap) {
            // Daily cap reached for automatic rewards
            return { awarded: false, message: 'Daily reward cap reached' };
        }
        // 3. Insert ledger entry (Append-only)
        await (0, db_1.execute)(`INSERT INTO reward_ledger (user_id, points, reason, request_id, granted_by, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`, [userId, points, reason, requestId || null, grantedBy || null]);
        // Notify citizen
        await notificationService_1.notificationService.notify({
            userId,
            type: 'REWARD',
            title: 'Reward Points Earned!',
            body: `You received ${points} civic reward points: ${reason}`,
            requestId,
        });
        return { awarded: true, points };
    }
    async manualGrantOrDeduct(adminId, userId, points, reason, requestId) {
        if (!reason || reason.trim().length === 0) {
            throw errors_1.AppError.badRequest('Mandatory note/reason is required for manual reward adjustment');
        }
        await (0, db_1.execute)(`INSERT INTO reward_ledger (user_id, points, reason, request_id, granted_by, created_at)
       VALUES (?, ?, ?, ?, ?, NOW())`, [userId, points, reason.trim(), requestId || null, adminId]);
        await (0, db_1.execute)(`INSERT INTO audit_log (actor_id, actor_role, action, entity_type, entity_id, after_json, created_at)
       VALUES (?, 'ADMIN', 'MANUAL_REWARD_ADJUSTMENT', 'USER', ?, ?, NOW())`, [adminId, userId, JSON.stringify({ points, reason, requestId })]);
        return { success: true, points, reason };
    }
}
exports.RewardService = RewardService;
exports.rewardService = new RewardService();
