"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.volunteerService = exports.VolunteerService = void 0;
const db_1 = require("../database/db");
const errors_1 = require("../common/errors");
const utils_1 = require("../common/utils");
const requestStateMachine_1 = require("../request/requestStateMachine");
const rewardService_1 = require("../reward/rewardService");
class VolunteerService {
    async getAvailableRequests(params) {
        let sql = `
      SELECT 
        r.id, r.category_id as categoryId, r.input_type as inputType,
        r.description, r.ai_summary as aiSummary,
        r.latitude, r.longitude, r.address_text as addressText,
        r.status, r.ai_easy as aiEasy, r.escalated_at as escalatedAt,
        r.approved_budget as approvedBudget, r.final_priority as finalPriority,
        r.created_at as createdAt,
        c.name as categoryName, c.slug as categorySlug,
        u.name as citizenName, u.phone as citizenPhone
      FROM requests r
      JOIN categories c ON r.category_id = c.id
      JOIN users u ON r.citizen_id = u.id
      WHERE r.status = 'OPEN'
        AND (r.ai_easy = TRUE OR r.approved_budget <= 2000.00 OR c.typical_budget_max <= 2000.00 OR r.escalated_at IS NOT NULL)
    `;
        const queryParams = [];
        if (params.categorySlug && params.categorySlug !== 'all') {
            sql += ' AND c.slug = ?';
            queryParams.push(params.categorySlug);
        }
        sql += ' ORDER BY (r.escalated_at IS NOT NULL) DESC, r.final_priority DESC, r.created_at ASC LIMIT 50';
        const rows = await (0, db_1.query)(sql, queryParams);
        // Fetch primary photos
        const reqIds = rows.map((r) => r.id);
        let photosMap = {};
        if (reqIds.length > 0) {
            const photos = await (0, db_1.query)(`SELECT request_id, kind, url FROM request_photos WHERE request_id IN (${reqIds.map(() => '?').join(',')})`, reqIds);
            photos.forEach((p) => {
                if (!photosMap[p.request_id])
                    photosMap[p.request_id] = [];
                photosMap[p.request_id].push(p);
            });
        }
        return rows.map((r) => ({
            id: r.id,
            categoryId: r.categoryId,
            categoryName: r.categoryName,
            categorySlug: r.categorySlug,
            description: r.description,
            aiSummary: r.aiSummary,
            latitude: Number(r.latitude),
            longitude: Number(r.longitude),
            addressText: r.addressText,
            status: r.status,
            aiEasy: Boolean(r.aiEasy),
            isEscalated: Boolean(r.escalatedAt),
            approvedBudget: r.approvedBudget ? Number(r.approvedBudget) : null,
            finalPriority: r.finalPriority ? Number(r.finalPriority) : null,
            citizenName: r.citizenName || 'Citizen',
            citizenPhoneMasked: (0, utils_1.maskPhone)(r.citizenPhone),
            createdAt: r.createdAt,
            photos: photosMap[r.id] || [],
        }));
    }
    async recordAction(volunteerId, requestId, outcome, notes, proofPhotoUrl) {
        // 1. Daily limit check: max 20 actions per volunteer per day
        const actionCountRows = await (0, db_1.query)(`SELECT COUNT(*) as count 
       FROM volunteer_actions 
       WHERE volunteer_id = ? AND DATE(created_at) = CURRENT_DATE()`, [volunteerId]);
        if (actionCountRows.length > 0 && actionCountRows[0].count >= 20) {
            throw errors_1.AppError.conflict('Daily limit of 20 volunteer actions reached for today', 'CONFLICT');
        }
        // 2. Fetch request
        const reqRows = await (0, db_1.query)('SELECT * FROM requests WHERE id = ? LIMIT 1', [requestId]);
        if (reqRows.length === 0) {
            throw errors_1.AppError.notFound(`Request #${requestId} not found`);
        }
        const req = reqRows[0];
        // 3. Handle action within transaction
        return (0, db_1.withTransaction)(async (conn) => {
            const [insertRes] = await conn.query(`INSERT INTO volunteer_actions (volunteer_id, request_id, outcome, notes, created_at)
         VALUES (?, ?, ?, ?, NOW())`, [volunteerId, requestId, outcome, notes?.slice(0, 500) || null]);
            // If action is RESOLVED_WITH_PROOF, attach AFTER photo and transition
            if (outcome === 'RESOLVED_WITH_PROOF') {
                if (!proofPhotoUrl) {
                    throw errors_1.AppError.badRequest('proofPhotoUrl is required for RESOLVED_WITH_PROOF');
                }
                // Insert proof photo
                await conn.query(`INSERT INTO request_photos (request_id, uploaded_by, kind, url, mime_type, size_bytes, sha256, created_at)
           VALUES (?, ?, 'AFTER', ?, 'image/jpeg', 1024, SHA2(?, 256), NOW())`, [requestId, volunteerId, proofPhotoUrl, proofPhotoUrl]);
                // Transition through state machine:
                await requestStateMachine_1.requestStateMachine.transition(requestId, 'COMPLETED', { id: volunteerId, role: 'CITIZEN', isVolunteer: true }, { note: `Resolved by verified volunteer. Proof: ${proofPhotoUrl}` }, conn);
                // Award reward points to volunteer
                await rewardService_1.rewardService.awardPoints(volunteerId, 'VOLUNTEER_TASK_COMPLETED', `Volunteer resolution proof approved for request #${requestId}`, requestId);
            }
            else if (outcome === 'ESCALATED') {
                await conn.query(`UPDATE requests SET escalated_at = NOW() WHERE id = ? AND escalated_at IS NULL`, [requestId]);
            }
            return {
                actionId: insertRes.insertId,
                requestId,
                outcome,
                notes: notes || null,
                status: outcome === 'RESOLVED_WITH_PROOF' ? 'COMPLETED' : req.status,
            };
        });
    }
    async submitVerificationRequest(userId, motivation) {
        const existing = await (0, db_1.query)(`SELECT id, status FROM verification_requests WHERE user_id = ? AND status = 'PENDING' LIMIT 1`, [userId]);
        if (existing.length > 0) {
            throw errors_1.AppError.conflict('You already have a pending verification request', 'CONFLICT');
        }
        const res = await (0, db_1.execute)(`INSERT INTO verification_requests (user_id, status, motivation, created_at)
       VALUES (?, 'PENDING', ?, NOW())`, [userId, motivation?.slice(0, 500) || null]);
        // Update user status to PENDING
        await (0, db_1.execute)('UPDATE users SET verification_status = "PENDING" WHERE id = ?', [userId]);
        return {
            verificationRequestId: res.insertId,
            status: 'PENDING',
            message: 'Volunteer verification application submitted successfully. Municipal admin will review your profile.',
        };
    }
    async getVerificationStatus(userId) {
        const user = await (0, db_1.query)('SELECT id, name, phone, role, verification_status as verificationStatus, verified_at as verifiedAt FROM users WHERE id = ? LIMIT 1', [userId]);
        if (user.length === 0)
            throw errors_1.AppError.notFound('User not found');
        const requests = await (0, db_1.query)(`SELECT id, status, motivation, review_note as reviewNote, created_at as createdAt, reviewed_at as reviewedAt
       FROM verification_requests WHERE user_id = ? ORDER BY id DESC LIMIT 1`, [userId]);
        return {
            user: user[0],
            latestApplication: requests.length > 0 ? requests[0] : null,
        };
    }
}
exports.VolunteerService = VolunteerService;
exports.volunteerService = new VolunteerService();
