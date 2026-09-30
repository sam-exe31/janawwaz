"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ratingService = exports.RatingService = void 0;
const db_1 = require("../database/db");
const errors_1 = require("../common/errors");
const utils_1 = require("../common/utils");
const rankService_1 = require("../rank/rankService");
const rewardService_1 = require("../reward/rewardService");
const notificationService_1 = require("../notification/notificationService");
class RatingService {
    async submitRating(citizenId, requestId, stars, comment) {
        if (!Number.isInteger(stars) || stars < 1 || stars > 5) {
            throw errors_1.AppError.badRequest('Stars rating must be an integer between 1 and 5');
        }
        // 1. Validate and insert rating within transaction
        const { ratingId, ngoId } = await (0, db_1.withTransaction)(async (conn) => {
            const [reqRows] = await conn.query('SELECT id, citizen_id, status, closed_at FROM requests WHERE id = ? FOR UPDATE', [requestId]);
            if (reqRows.length === 0) {
                throw errors_1.AppError.notFound(`Request #${requestId} not found`);
            }
            const req = reqRows[0];
            if (req.citizen_id !== citizenId) {
                throw errors_1.AppError.forbidden('Only the citizen who submitted the request can submit a rating');
            }
            if (req.status !== 'CLOSED') {
                throw errors_1.AppError.conflict(`Cannot rate a request that is not CLOSED. Current status is ${req.status}`, 'CONFLICT');
            }
            if (req.closed_at) {
                const closedDate = (0, utils_1.parseUtcDate)(req.closed_at);
                const daysDiff = (Date.now() - closedDate.getTime()) / (1000 * 60 * 60 * 24);
                if (daysDiff > 14) {
                    throw errors_1.AppError.conflict('Ratings can only be submitted within 14 days of request closure', 'CONFLICT');
                }
            }
            const [existingRating] = await conn.query('SELECT id FROM ratings WHERE request_id = ? AND citizen_id = ? LIMIT 1', [requestId, citizenId]);
            if (existingRating.length > 0) {
                throw errors_1.AppError.conflict('You have already rated this request', 'CONFLICT');
            }
            const [claimRows] = await conn.query(`SELECT ngo_id FROM ngo_claims 
         WHERE request_id = ? AND status IN ('COMPLETED', 'CLOSED') 
         ORDER BY id DESC LIMIT 1`, [requestId]);
            if (claimRows.length === 0) {
                throw errors_1.AppError.badRequest('No completed NGO claim found for this request');
            }
            const targetNgoId = claimRows[0].ngo_id;
            const [insertRes] = await conn.query(`INSERT INTO ratings (request_id, citizen_id, ngo_id, stars, comment, created_at)
         VALUES (?, ?, ?, ?, ?, NOW())`, [requestId, citizenId, targetNgoId, stars, comment?.slice(0, 500) || null]);
            return { ratingId: insertRes.insertId, ngoId: targetNgoId };
        });
        // 2. Perform post-transaction updates (no locks held)
        const avgRows = await (0, db_1.query)('SELECT AVG(stars) as avgStars FROM ratings WHERE ngo_id = ?', [ngoId]);
        const newAvgRating = parseFloat(avgRows[0]?.avgStars || '0').toFixed(2);
        await (0, db_1.execute)('UPDATE ngos SET avg_rating = ? WHERE id = ?', [newAvgRating, ngoId]);
        // Recalculate rank
        await rankService_1.rankService.recalculateNgoRank(ngoId);
        // Award reward points
        await rewardService_1.rewardService.awardPoints(citizenId, 'RATING_SUBMITTED', `Rating submitted for request #${requestId}`, requestId);
        // Notify NGO
        const ngoUserRows = await (0, db_1.query)('SELECT user_id, name FROM ngos WHERE id = ? LIMIT 1', [ngoId]);
        if (ngoUserRows.length > 0) {
            await notificationService_1.notificationService.notify({
                userId: ngoUserRows[0].user_id,
                type: 'RATING',
                title: 'New Rating Received',
                body: `A citizen rated your resolution on request #${requestId}: ${stars} / 5 stars.${comment ? ` Feedback: "${comment}"` : ''}`,
                requestId,
            });
        }
        return {
            ratingId,
            requestId,
            ngoId,
            stars,
            comment: comment || null,
            newNgoAvgRating: Number(newAvgRating),
        };
    }
    async getRatingForRequest(requestId) {
        const rows = await (0, db_1.query)(`SELECT r.id, r.stars, r.comment, r.created_at as createdAt,
              u.name as citizenName
       FROM ratings r
       JOIN users u ON r.citizen_id = u.id
       WHERE r.request_id = ? LIMIT 1`, [requestId]);
        return rows.length > 0 ? rows[0] : null;
    }
}
exports.RatingService = RatingService;
exports.ratingService = new RatingService();
