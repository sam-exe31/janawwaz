"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const requestController_1 = require("./requestController");
const authMiddleware_1 = require("../auth/authMiddleware");
const validation_1 = require("../common/validation");
const requestValidation_1 = require("./requestValidation");
const ratingController_1 = require("../rating/ratingController");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
// Citizen creates civic request
router.post('/', (0, authMiddleware_1.requireRole)('CITIZEN'), authMiddleware_1.requireNotSuspended, (0, validation_1.validateBody)(requestValidation_1.createRequestSchema), (req, res, next) => requestController_1.requestController.create(req, res, next));
// Citizen views their own requests
router.get('/', (req, res, next) => requestController_1.requestController.listOwn(req, res, next));
// View request details
router.get('/:id', (req, res, next) => requestController_1.requestController.getById(req, res, next));
// View request works done history
router.get('/:id/history', (req, res, next) => requestController_1.requestController.getHistory(req, res, next));
// Citizen rates completed/closed request
router.post('/:id/rating', (0, authMiddleware_1.requireRole)('CITIZEN'), authMiddleware_1.requireNotSuspended, (req, res, next) => ratingController_1.ratingController.submitRating(req, res, next));
// Get rating for request
router.get('/:id/rating', (req, res, next) => ratingController_1.ratingController.getRating(req, res, next));
exports.default = router;
