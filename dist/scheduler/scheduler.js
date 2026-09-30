"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.scheduler = exports.Scheduler = void 0;
const db_1 = require("../database/db");
const screeningService_1 = require("../screening/screeningService");
const rankService_1 = require("../rank/rankService");
const notificationService_1 = require("../notification/notificationService");
class Scheduler {
    intervals = [];
    startAll() {
        console.log('[Scheduler] Initializing background jobs...');
        // 1. SLA Escalation check every 15 minutes (900,000 ms)
        const slaInterval = setInterval(() => {
            this.runSlaEscalation().catch((err) => console.error('[Scheduler] SLA Escalation job failed:', err));
        }, 15 * 60 * 1000);
        this.intervals.push(slaInterval);
        // 2. Stuck Screening check every 5 minutes (300,000 ms)
        const stuckScreeningInterval = setInterval(() => {
            screeningService_1.screeningService
                .checkStuckScreening()
                .catch((err) => console.error('[Scheduler] Stuck screening check failed:', err));
        }, 5 * 60 * 1000);
        this.intervals.push(stuckScreeningInterval);
        // 3. Expired OTP and old session cleanup every 1 hour (3,600,000 ms)
        const cleanupInterval = setInterval(() => {
            this.cleanupExpiredData().catch((err) => console.error('[Scheduler] Cleanup job failed:', err));
        }, 60 * 60 * 1000);
        this.intervals.push(cleanupInterval);
        console.log('[Scheduler] Background jobs scheduled.');
    }
    stopAll() {
        for (const interval of this.intervals) {
            clearInterval(interval);
        }
        this.intervals = [];
        console.log('[Scheduler] All background jobs stopped.');
    }
    async runSlaEscalation() {
        // Find OPEN requests older than 48 hours without escalation
        const expiredRequests = await (0, db_1.query)(`SELECT r.id, r.citizen_id, c.expected_resolution_hours as expectedHours,
              TIMESTAMPDIFF(HOUR, r.created_at, NOW()) as hoursOpen
       FROM requests r
       JOIN categories c ON r.category_id = c.id
       WHERE r.status = 'OPEN' 
         AND r.escalated_at IS NULL
         AND TIMESTAMPDIFF(HOUR, r.created_at, NOW()) >= COALESCE(c.expected_resolution_hours, 48)`);
        if (expiredRequests.length === 0) {
            return 0;
        }
        const ids = expiredRequests.map((r) => r.id);
        await (0, db_1.execute)(`UPDATE requests 
       SET escalated_at = NOW() 
       WHERE id IN (${ids.map(() => '?').join(',')})`, ids);
        // Notify admins
        const admins = await (0, db_1.query)('SELECT id FROM users WHERE role = "ADMIN" AND status = "ACTIVE"');
        for (const r of expiredRequests) {
            for (const admin of admins) {
                await notificationService_1.notificationService.notify({
                    userId: admin.id,
                    type: 'ESCALATION',
                    title: 'SLA Escalation Alert',
                    body: `Request #${r.id} has breached SLA (${r.hoursOpen} hours open) and has been escalated to volunteer & admin queues.`,
                    requestId: r.id,
                });
            }
        }
        return expiredRequests.length;
    }
    async cleanupExpiredData() {
        // Delete expired OTP sessions older than 24 hours
        await (0, db_1.execute)(`DELETE FROM otp_sessions 
       WHERE expires_at < NOW() - INTERVAL 24 HOUR OR consumed_at < NOW() - INTERVAL 24 HOUR`);
        // Revoke idle sessions older than 30 days
        await (0, db_1.execute)(`UPDATE user_sessions 
       SET revoked_at = NOW() 
       WHERE revoked_at IS NULL AND last_seen_at < NOW() - INTERVAL 30 DAY`);
    }
    async runNightlyRankRecalculation() {
        return rankService_1.rankService.recalculateAllNgos();
    }
}
exports.Scheduler = Scheduler;
exports.scheduler = new Scheduler();
