"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.userController = exports.UserController = exports.updateMeSchema = void 0;
const db_1 = require("../database/db");
const response_1 = require("../common/response");
const errors_1 = require("../common/errors");
const zod_1 = require("zod");
const utils_1 = require("../common/utils");
exports.updateMeSchema = zod_1.z.object({
    name: zod_1.z.string().max(120).optional(),
    bio: zod_1.z.string().max(300).optional(),
    avatarUrl: zod_1.z.string().url().max(500).optional().nullable(),
});
class UserController {
    async getMe(req, res, next) {
        try {
            const userId = req.user.id;
            const users = await (0, db_1.query)(`SELECT id, phone, email, role, name, status, verification_status as verificationStatus,
                avatar_url as avatarUrl, bio, last_login_at as lastLoginAt, created_at as createdAt
         FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1`, [userId]);
            if (users.length === 0) {
                throw errors_1.AppError.notFound('User not found');
            }
            const user = users[0];
            // Calculate reward balance from ledger: SUM(points)
            const balanceRows = await (0, db_1.query)('SELECT COALESCE(SUM(points), 0) as balance FROM reward_ledger WHERE user_id = ?', [userId]);
            const rewardsBalance = balanceRows.length > 0 ? Number(balanceRows[0].balance) : 0;
            return (0, response_1.sendSuccess)(res, {
                ...user,
                rewardsBalance,
            });
        }
        catch (err) {
            next(err);
        }
    }
    async updateMe(req, res, next) {
        try {
            const userId = req.user.id;
            const { name, bio, avatarUrl } = req.body;
            const updates = [];
            const values = [];
            if (name !== undefined) {
                updates.push('name = ?');
                values.push((0, utils_1.sanitizeText)(name));
            }
            if (bio !== undefined) {
                updates.push('bio = ?');
                values.push((0, utils_1.sanitizeText)(bio));
            }
            if (avatarUrl !== undefined) {
                updates.push('avatar_url = ?');
                values.push(avatarUrl);
            }
            if (updates.length > 0) {
                values.push(userId);
                await (0, db_1.execute)(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
            }
            return this.getMe(req, res, next);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.UserController = UserController;
exports.userController = new UserController();
