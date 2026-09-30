"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ratingController = exports.RatingController = void 0;
const ratingService_1 = require("./ratingService");
const response_1 = require("../common/response");
const errors_1 = require("../common/errors");
class RatingController {
    async submitRating(req, res, next) {
        try {
            const citizenId = req.user.id;
            const requestId = Number(req.params.id);
            if (isNaN(requestId)) {
                throw errors_1.AppError.badRequest('Invalid request ID');
            }
            const { stars, comment } = req.body;
            if (stars === undefined) {
                throw errors_1.AppError.badRequest('Stars (1-5) is required');
            }
            const result = await ratingService_1.ratingService.submitRating(citizenId, requestId, Number(stars), comment);
            return (0, response_1.sendSuccess)(res, result, 201);
        }
        catch (err) {
            next(err);
        }
    }
    async getRating(req, res, next) {
        try {
            const requestId = Number(req.params.id);
            if (isNaN(requestId)) {
                throw errors_1.AppError.badRequest('Invalid request ID');
            }
            const rating = await ratingService_1.ratingService.getRatingForRequest(requestId);
            return (0, response_1.sendSuccess)(res, rating);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.RatingController = RatingController;
exports.ratingController = new RatingController();
