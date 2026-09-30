"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminController = exports.AdminController = void 0;
const adminService_1 = require("./adminService");
const rewardService_1 = require("../reward/rewardService");
const response_1 = require("../common/response");
const errors_1 = require("../common/errors");
class AdminController {
    async getDashboard(req, res, next) {
        try {
            const data = await adminService_1.adminService.getDashboard();
            return (0, response_1.sendSuccess)(res, data);
        }
        catch (err) {
            next(err);
        }
    }
    async getProgress(req, res, next) {
        try {
            const data = await adminService_1.adminService.getProgress();
            return (0, response_1.sendSuccess)(res, data);
        }
        catch (err) {
            next(err);
        }
    }
    async getRequests(req, res, next) {
        try {
            const { status, category, flag, escalated } = req.query;
            const page = Math.max(0, Number(req.query.page) || 0);
            const size = Math.min(100, Math.max(1, Number(req.query.size) || 20));
            const { items, total } = await adminService_1.adminService.getRequests({
                status: status,
                category: category,
                flag: flag,
                escalated: escalated === 'true',
            }, page, size);
            return (0, response_1.sendSuccess)(res, items, 200, { page, size, total });
        }
        catch (err) {
            next(err);
        }
    }
    async getRequestDetails(req, res, next) {
        try {
            const requestId = Number(req.params.id);
            if (isNaN(requestId))
                throw errors_1.AppError.badRequest('Invalid request ID');
            const data = await adminService_1.adminService.getAdminRequestDetails(requestId);
            return (0, response_1.sendSuccess)(res, data);
        }
        catch (err) {
            next(err);
        }
    }
    async approve(req, res, next) {
        try {
            const requestId = Number(req.params.id);
            const { note } = req.body;
            const result = await adminService_1.adminService.approveRequest(req.user.id, requestId, note);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async markFake(req, res, next) {
        try {
            const requestId = Number(req.params.id);
            const { note } = req.body;
            const result = await adminService_1.adminService.markFake(req.user.id, requestId, note);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async setCategory(req, res, next) {
        try {
            const requestId = Number(req.params.id);
            const { categoryId, note } = req.body;
            const result = await adminService_1.adminService.setCategory(req.user.id, requestId, categoryId, note);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async setBudget(req, res, next) {
        try {
            const requestId = Number(req.params.id);
            const { approvedBudget, note } = req.body;
            const result = await adminService_1.adminService.setBudget(req.user.id, requestId, approvedBudget, note);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async close(req, res, next) {
        try {
            const requestId = Number(req.params.id);
            const { note } = req.body;
            const result = await adminService_1.adminService.closeRequest(req.user.id, requestId, note);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async release(req, res, next) {
        try {
            const requestId = Number(req.params.id);
            const { note } = req.body;
            const result = await adminService_1.adminService.releaseClaim(req.user.id, requestId, note);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async takeOver(req, res, next) {
        try {
            const requestId = Number(req.params.id);
            const { note } = req.body;
            const result = await adminService_1.adminService.takeOver(req.user.id, requestId, note);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async rejectProof(req, res, next) {
        try {
            const requestId = Number(req.params.id);
            const { note } = req.body;
            const result = await adminService_1.adminService.rejectProof(req.user.id, requestId, note);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async overrideStatus(req, res, next) {
        try {
            const requestId = Number(req.params.id);
            const { status, note } = req.body;
            const result = await adminService_1.adminService.overrideStatus(req.user.id, requestId, status, note);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async listNgos(req, res, next) {
        try {
            const ngos = await adminService_1.adminService.listNgos();
            return (0, response_1.sendSuccess)(res, ngos);
        }
        catch (err) {
            next(err);
        }
    }
    async createNgo(req, res, next) {
        try {
            const result = await adminService_1.adminService.createNgo(req.body);
            return (0, response_1.sendSuccess)(res, result, 201);
        }
        catch (err) {
            next(err);
        }
    }
    async deleteNgo(req, res, next) {
        try {
            const ngoId = Number(req.params.id);
            const result = await adminService_1.adminService.softDeleteNgo(req.user.id, ngoId);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async listCitizens(req, res, next) {
        try {
            const { verificationStatus, search } = req.query;
            const page = Math.max(0, Number(req.query.page) || 0);
            const size = Math.min(100, Math.max(1, Number(req.query.size) || 20));
            const result = await adminService_1.adminService.listCitizens({ verificationStatus: verificationStatus, search: search }, page, size);
            return (0, response_1.sendSuccess)(res, result.items, 200, { page, size, total: result.total });
        }
        catch (err) {
            next(err);
        }
    }
    async verifyCitizen(req, res, next) {
        try {
            const citizenId = Number(req.params.id);
            const { note } = req.body;
            const result = await adminService_1.adminService.verifyCitizen(req.user.id, citizenId, note);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async suspendCitizen(req, res, next) {
        try {
            const citizenId = Number(req.params.id);
            const { note } = req.body;
            const result = await adminService_1.adminService.suspendCitizen(req.user.id, citizenId, note);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async reactivateCitizen(req, res, next) {
        try {
            const citizenId = Number(req.params.id);
            const result = await adminService_1.adminService.reactivateCitizen(req.user.id, citizenId);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async getAuditLog(req, res, next) {
        try {
            const page = Math.max(0, Number(req.query.page) || 0);
            const size = Math.min(100, Math.max(1, Number(req.query.size) || 20));
            const { items, total } = await adminService_1.adminService.getAuditLog(page, size);
            return (0, response_1.sendSuccess)(res, items, 200, { page, size, total });
        }
        catch (err) {
            next(err);
        }
    }
    async grantReward(req, res, next) {
        try {
            const { userId, points, reason, requestId } = req.body;
            const result = await rewardService_1.rewardService.manualGrantOrDeduct(req.user.id, userId, points, reason, requestId);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AdminController = AdminController;
exports.adminController = new AdminController();
