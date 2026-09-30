"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.volunteerController = exports.VolunteerController = void 0;
const volunteerService_1 = require("./volunteerService");
const response_1 = require("../common/response");
const errors_1 = require("../common/errors");
class VolunteerController {
    async getRequests(req, res, next) {
        try {
            const lat = req.query.lat ? Number(req.query.lat) : undefined;
            const lng = req.query.lng ? Number(req.query.lng) : undefined;
            const radiusKm = req.query.radiusKm ? Number(req.query.radiusKm) : undefined;
            const categorySlug = req.query.category;
            const requests = await volunteerService_1.volunteerService.getAvailableRequests({
                lat,
                lng,
                radiusKm,
                categorySlug,
            });
            return (0, response_1.sendSuccess)(res, requests);
        }
        catch (err) {
            next(err);
        }
    }
    async recordAction(req, res, next) {
        try {
            const volunteerId = req.user.id;
            const requestId = Number(req.params.id);
            if (isNaN(requestId)) {
                throw errors_1.AppError.badRequest('Invalid request ID');
            }
            const { outcome, notes, proofPhotoUrl } = req.body;
            if (!outcome) {
                throw errors_1.AppError.badRequest('Action outcome is required');
            }
            const validOutcomes = [
                'CALLED_NO_ANSWER',
                'CALLED_RESOLVED',
                'COORDINATING',
                'ESCALATED',
                'RESOLVED_WITH_PROOF',
            ];
            if (!validOutcomes.includes(outcome)) {
                throw errors_1.AppError.badRequest(`Invalid outcome. Must be one of: ${validOutcomes.join(', ')}`);
            }
            const result = await volunteerService_1.volunteerService.recordAction(volunteerId, requestId, outcome, notes, proofPhotoUrl);
            return (0, response_1.sendSuccess)(res, result, 201);
        }
        catch (err) {
            next(err);
        }
    }
    async applyVerification(req, res, next) {
        try {
            const userId = req.user.id;
            const { motivation } = req.body;
            const result = await volunteerService_1.volunteerService.submitVerificationRequest(userId, motivation);
            return (0, response_1.sendSuccess)(res, result, 201);
        }
        catch (err) {
            next(err);
        }
    }
    async getVerificationStatus(req, res, next) {
        try {
            const userId = req.user.id;
            const result = await volunteerService_1.volunteerService.getVerificationStatus(userId);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.VolunteerController = VolunteerController;
exports.volunteerController = new VolunteerController();
