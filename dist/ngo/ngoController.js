"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ngoController = exports.NgoController = void 0;
const ngoService_1 = require("./ngoService");
const helperService_1 = require("../helper/helperService");
const requestService_1 = require("../request/requestService");
const response_1 = require("../common/response");
const errors_1 = require("../common/errors");
const db_1 = require("../database/db");
class NgoController {
    async getMe(req, res, next) {
        try {
            const ngo = await ngoService_1.ngoService.getNgoByUserId(req.user.id);
            return (0, response_1.sendSuccess)(res, ngo);
        }
        catch (err) {
            next(err);
        }
    }
    async updateMe(req, res, next) {
        try {
            const ngo = await ngoService_1.ngoService.getNgoByUserId(req.user.id);
            const { name, description, logoUrl, contactPhone, areaLabel } = req.body;
            const updates = ['updated_at = NOW()'];
            const params = [];
            if (name) {
                updates.push('name = ?');
                params.push(name);
            }
            if (description !== undefined) {
                updates.push('description = ?');
                params.push(description);
            }
            if (logoUrl !== undefined) {
                updates.push('logo_url = ?');
                params.push(logoUrl);
            }
            if (contactPhone !== undefined) {
                updates.push('contact_phone = ?');
                params.push(contactPhone);
            }
            if (areaLabel !== undefined) {
                updates.push('area_label = ?');
                params.push(areaLabel);
            }
            params.push(ngo.id);
            await (0, db_1.execute)(`UPDATE ngos SET ${updates.join(', ')} WHERE id = ?`, params);
            return this.getMe(req, res, next);
        }
        catch (err) {
            next(err);
        }
    }
    async getOpenRequests(req, res, next) {
        try {
            const ngo = await ngoService_1.ngoService.getNgoByUserId(req.user.id);
            const page = Math.max(0, Number(req.query.page) || 0);
            const size = Math.min(100, Math.max(1, Number(req.query.size) || 20));
            const { items, total } = await ngoService_1.ngoService.getOpenRequestsInArea(ngo.id, page, size);
            return (0, response_1.sendSuccess)(res, items, 200, { page, size, total });
        }
        catch (err) {
            next(err);
        }
    }
    async getRequestById(req, res, next) {
        try {
            const requestId = Number(req.params.id);
            if (isNaN(requestId))
                throw errors_1.AppError.badRequest('Invalid request ID');
            const details = await requestService_1.requestService.getRequestById(requestId, req.user);
            return (0, response_1.sendSuccess)(res, details);
        }
        catch (err) {
            next(err);
        }
    }
    async claim(req, res, next) {
        try {
            const ngo = await ngoService_1.ngoService.getNgoByUserId(req.user.id);
            const requestId = Number(req.params.id);
            if (isNaN(requestId))
                throw errors_1.AppError.badRequest('Invalid request ID');
            const result = await ngoService_1.ngoService.claimRequest(ngo.id, requestId);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async reject(req, res, next) {
        try {
            const ngo = await ngoService_1.ngoService.getNgoByUserId(req.user.id);
            const requestId = Number(req.params.id);
            if (isNaN(requestId))
                throw errors_1.AppError.badRequest('Invalid request ID');
            const { reason } = req.body;
            const result = await ngoService_1.ngoService.rejectRequest(ngo.id, requestId, reason);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async listClaims(req, res, next) {
        try {
            const ngo = await ngoService_1.ngoService.getNgoByUserId(req.user.id);
            const claims = await (0, db_1.query)(`SELECT c.id, c.request_id as requestId, c.status as claimStatus, c.claimed_at as claimedAt,
                r.status as requestStatus, r.description, r.ai_summary as summary,
                r.latitude, r.longitude, r.address_text as addressText,
                cat.name as categoryName,
                a.id as assignmentId, a.status as assignmentStatus, h.name as helperName
         FROM ngo_claims c
         JOIN requests r ON c.request_id = r.id
         JOIN categories cat ON r.category_id = cat.id
         LEFT JOIN assignments a ON a.claim_id = c.id AND a.status IN ('ASSIGNED', 'IN_PROGRESS')
         LEFT JOIN helpers h ON a.helper_id = h.id
         WHERE c.ngo_id = ? AND c.status = 'ACTIVE'
         ORDER BY c.claimed_at DESC`, [ngo.id]);
            return (0, response_1.sendSuccess)(res, claims);
        }
        catch (err) {
            next(err);
        }
    }
    async getHelperSuggestions(req, res, next) {
        try {
            const ngo = await ngoService_1.ngoService.getNgoByUserId(req.user.id);
            const claimId = Number(req.params.id);
            if (isNaN(claimId))
                throw errors_1.AppError.badRequest('Invalid claim ID');
            const suggestions = await ngoService_1.ngoService.getHelperSuggestions(ngo.id, claimId);
            return (0, response_1.sendSuccess)(res, suggestions);
        }
        catch (err) {
            next(err);
        }
    }
    async assignHelper(req, res, next) {
        try {
            const ngo = await ngoService_1.ngoService.getNgoByUserId(req.user.id);
            const claimId = Number(req.params.id);
            if (isNaN(claimId))
                throw errors_1.AppError.badRequest('Invalid claim ID');
            const { helperId, note } = req.body;
            const result = await ngoService_1.ngoService.assignHelper(ngo.id, claimId, helperId, note);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async startWork(req, res, next) {
        try {
            const ngo = await ngoService_1.ngoService.getNgoByUserId(req.user.id);
            const claimId = Number(req.params.id);
            if (isNaN(claimId))
                throw errors_1.AppError.badRequest('Invalid claim ID');
            const result = await ngoService_1.ngoService.startWork(ngo.id, claimId);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async attachPhoto(req, res, next) {
        try {
            const ngo = await ngoService_1.ngoService.getNgoByUserId(req.user.id);
            const claimId = Number(req.params.id);
            if (isNaN(claimId))
                throw errors_1.AppError.badRequest('Invalid claim ID');
            const { kind, uploadId } = req.body;
            if (!['BEFORE', 'AFTER'].includes(kind)) {
                throw errors_1.AppError.badRequest('Photo kind must be BEFORE or AFTER');
            }
            const result = await ngoService_1.ngoService.attachProofPhoto(ngo.id, claimId, kind, uploadId);
            return (0, response_1.sendSuccess)(res, result, 201);
        }
        catch (err) {
            next(err);
        }
    }
    async completeWork(req, res, next) {
        try {
            const ngo = await ngoService_1.ngoService.getNgoByUserId(req.user.id);
            const claimId = Number(req.params.id);
            if (isNaN(claimId))
                throw errors_1.AppError.badRequest('Invalid claim ID');
            const result = await ngoService_1.ngoService.completeWork(ngo.id, claimId);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async abandonClaim(req, res, next) {
        try {
            const ngo = await ngoService_1.ngoService.getNgoByUserId(req.user.id);
            const claimId = Number(req.params.id);
            if (isNaN(claimId))
                throw errors_1.AppError.badRequest('Invalid claim ID');
            const { reason } = req.body;
            const result = await ngoService_1.ngoService.abandonClaim(ngo.id, claimId, reason);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async getHeatMap(req, res, next) {
        try {
            const ngo = await ngoService_1.ngoService.getNgoByUserId(req.user.id);
            const precision = Number(req.query.precision) || 3;
            const heatmap = await ngoService_1.ngoService.getHeatMap(ngo.id, precision);
            return (0, response_1.sendSuccess)(res, heatmap);
        }
        catch (err) {
            next(err);
        }
    }
    async getHistory(req, res, next) {
        try {
            const ngo = await ngoService_1.ngoService.getNgoByUserId(req.user.id);
            const history = await (0, db_1.query)(`SELECT r.id, r.description, r.ai_summary as summary, r.address_text as addressText,
                r.closed_at as closedAt, c.name as categoryName,
                rt.stars as ratingStars, rt.comment as ratingComment
         FROM requests r
         JOIN categories c ON r.category_id = c.id
         JOIN ngo_claims cl ON cl.request_id = r.id
         LEFT JOIN ratings rt ON rt.request_id = r.id AND rt.ngo_id = cl.ngo_id
         WHERE cl.ngo_id = ? AND r.status = 'CLOSED'
         ORDER BY r.closed_at DESC`, [ngo.id]);
            return (0, response_1.sendSuccess)(res, history);
        }
        catch (err) {
            next(err);
        }
    }
    async getStats(req, res, next) {
        try {
            const ngo = await ngoService_1.ngoService.getNgoByUserId(req.user.id);
            const [activeClaims] = await (0, db_1.query)(`SELECT COUNT(*) as active FROM ngo_claims WHERE ngo_id = ? AND status = 'ACTIVE'`, [ngo.id]);
            const [helpers] = await (0, db_1.query)(`SELECT COUNT(*) as activeHelpers FROM helpers WHERE ngo_id = ? AND active = TRUE`, [ngo.id]);
            return (0, response_1.sendSuccess)(res, {
                rankScore: Number(ngo.rank_score),
                totalCompleted: Number(ngo.total_completed),
                avgRating: Number(ngo.avg_rating),
                avgResolutionHours: Number(ngo.avg_resolution_hours),
                abandonmentCount: Number(ngo.abandonment_count),
                rejectionCount: Number(ngo.rejection_count),
                activeClaimsCount: Number(activeClaims.active),
                activeHelpersCount: Number(helpers.activeHelpers),
            });
        }
        catch (err) {
            next(err);
        }
    }
    // Helper CRUD
    async listHelpers(req, res, next) {
        try {
            const ngo = await ngoService_1.ngoService.getNgoByUserId(req.user.id);
            const helpers = await helperService_1.helperService.listHelpers(ngo.id);
            return (0, response_1.sendSuccess)(res, helpers);
        }
        catch (err) {
            next(err);
        }
    }
    async createHelper(req, res, next) {
        try {
            const ngo = await ngoService_1.ngoService.getNgoByUserId(req.user.id);
            const result = await helperService_1.helperService.createHelper(ngo.id, req.body);
            return (0, response_1.sendSuccess)(res, result, 201);
        }
        catch (err) {
            next(err);
        }
    }
    async updateHelper(req, res, next) {
        try {
            const ngo = await ngoService_1.ngoService.getNgoByUserId(req.user.id);
            const helperId = Number(req.params.id);
            if (isNaN(helperId))
                throw errors_1.AppError.badRequest('Invalid helper ID');
            const result = await helperService_1.helperService.updateHelper(ngo.id, helperId, req.body);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async deleteHelper(req, res, next) {
        try {
            const ngo = await ngoService_1.ngoService.getNgoByUserId(req.user.id);
            const helperId = Number(req.params.id);
            if (isNaN(helperId))
                throw errors_1.AppError.badRequest('Invalid helper ID');
            const result = await helperService_1.helperService.deleteHelper(ngo.id, helperId);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.NgoController = NgoController;
exports.ngoController = new NgoController();
