"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.publicController = exports.PublicController = void 0;
const publicService_1 = require("./publicService");
const response_1 = require("../common/response");
const errors_1 = require("../common/errors");
class PublicController {
    async recordVisit(req, res, next) {
        try {
            const hasCookie = req.signedCookies && req.signedCookies.visited_today === 'true';
            const result = await publicService_1.publicService.recordVisit(!!hasCookie);
            // Set signed cookie valid for 24 hours
            res.cookie('visited_today', 'true', {
                maxAge: 24 * 60 * 60 * 1000,
                signed: true,
                httpOnly: true,
                sameSite: 'lax',
            });
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async getCategories(req, res, next) {
        try {
            const categories = await publicService_1.publicService.getCategories();
            return (0, response_1.sendSuccess)(res, categories);
        }
        catch (err) {
            next(err);
        }
    }
    async getLeaderboard(req, res, next) {
        try {
            const period = req.query.period || 'ALL';
            const leaderboard = await publicService_1.publicService.getLeaderboard(period);
            return (0, response_1.sendSuccess)(res, leaderboard);
        }
        catch (err) {
            next(err);
        }
    }
    async getNgoProfile(req, res, next) {
        try {
            const ngoId = Number(req.params.id);
            if (isNaN(ngoId)) {
                throw errors_1.AppError.badRequest('Invalid NGO ID');
            }
            const profile = await publicService_1.publicService.getNgoPublicProfile(ngoId);
            if (!profile) {
                throw errors_1.AppError.notFound('NGO not found');
            }
            return (0, response_1.sendSuccess)(res, profile);
        }
        catch (err) {
            next(err);
        }
    }
    async getStats(req, res, next) {
        try {
            const stats = await publicService_1.publicService.getStats();
            return (0, response_1.sendSuccess)(res, stats);
        }
        catch (err) {
            next(err);
        }
    }
    async getPublicFeed(req, res, next) {
        try {
            const categorySlug = req.query.category;
            const limit = Number(req.query.limit) || 20;
            const feed = await publicService_1.publicService.getPublicFeed(categorySlug, limit);
            return (0, response_1.sendSuccess)(res, feed);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.PublicController = PublicController;
exports.publicController = new PublicController();
