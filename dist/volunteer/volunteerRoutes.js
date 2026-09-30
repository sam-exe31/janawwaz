"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const volunteerController_1 = require("./volunteerController");
const authMiddleware_1 = require("../auth/authMiddleware");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.use((0, authMiddleware_1.requireRole)('CITIZEN', 'ADMIN'));
router.use(authMiddleware_1.requireNotSuspended);
// Get available requests for volunteer assistance
router.get('/requests', (req, res, next) => volunteerController_1.volunteerController.getRequests(req, res, next));
// Record volunteer action (call, coordinate, resolve with proof)
router.post('/requests/:id/actions', (req, res, next) => volunteerController_1.volunteerController.recordAction(req, res, next));
// Apply for volunteer verification
router.post('/verification', (req, res, next) => volunteerController_1.volunteerController.applyVerification(req, res, next));
// Get current user's verification status
router.get('/verification', (req, res, next) => volunteerController_1.volunteerController.getVerificationStatus(req, res, next));
exports.default = router;
