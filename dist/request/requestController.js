"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requestController = exports.RequestController = void 0;
const requestService_1 = require("./requestService");
const response_1 = require("../common/response");
const errors_1 = require("../common/errors");
class RequestController {
    async create(req, res, next) {
        try {
            const citizenId = req.user.id;
            const result = await requestService_1.requestService.submitRequest(citizenId, req.body);
            return (0, response_1.sendSuccess)(res, result, 201);
        }
        catch (err) {
            next(err);
        }
    }
    async listOwn(req, res, next) {
        try {
            const citizenId = req.user.id;
            const page = Math.max(0, Number(req.query.page) || 0);
            const size = Math.min(100, Math.max(1, Number(req.query.size) || 20));
            const { items, total } = await requestService_1.requestService.getCitizenRequests(citizenId, page, size);
            return (0, response_1.sendSuccess)(res, items, 200, { page, size, total });
        }
        catch (err) {
            next(err);
        }
    }
    async getById(req, res, next) {
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
    async getHistory(req, res, next) {
        try {
            const requestId = Number(req.params.id);
            if (isNaN(requestId))
                throw errors_1.AppError.badRequest('Invalid request ID');
            const history = await requestService_1.requestService.getRequestHistory(requestId);
            return (0, response_1.sendSuccess)(res, history);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.RequestController = RequestController;
exports.requestController = new RequestController();
