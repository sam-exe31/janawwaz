"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const ngoController_1 = require("./ngoController");
const authMiddleware_1 = require("../auth/authMiddleware");
const validation_1 = require("../common/validation");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.use((0, authMiddleware_1.requireRole)('NGO'));
router.use(authMiddleware_1.requireNotSuspended);
// NGO Profile
router.get('/me', (req, res, next) => ngoController_1.ngoController.getMe(req, res, next));
router.put('/me', (req, res, next) => ngoController_1.ngoController.updateMe(req, res, next));
// Open requests in service area
router.get('/requests', (req, res, next) => ngoController_1.ngoController.getOpenRequests(req, res, next));
router.get('/requests/:id', (req, res, next) => ngoController_1.ngoController.getRequestById(req, res, next));
// Claim & Reject
const rejectSchema = zod_1.z.object({
    reason: zod_1.z.string().min(3).max(300),
});
router.post('/requests/:id/claim', (req, res, next) => ngoController_1.ngoController.claim(req, res, next));
router.post('/requests/:id/reject', (0, validation_1.validateBody)(rejectSchema), (req, res, next) => ngoController_1.ngoController.reject(req, res, next));
// Claims workflow
router.get('/claims', (req, res, next) => ngoController_1.ngoController.listClaims(req, res, next));
router.get('/claims/:id/helper-suggestions', (req, res, next) => ngoController_1.ngoController.getHelperSuggestions(req, res, next));
const assignSchema = zod_1.z.object({
    helperId: zod_1.z.number().int().positive(),
    note: zod_1.z.string().max(500).optional(),
});
router.post('/claims/:id/assign', (0, validation_1.validateBody)(assignSchema), (req, res, next) => ngoController_1.ngoController.assignHelper(req, res, next));
router.post('/claims/:id/start', (req, res, next) => ngoController_1.ngoController.startWork(req, res, next));
const photoSchema = zod_1.z.object({
    kind: zod_1.z.enum(['BEFORE', 'AFTER']),
    uploadId: zod_1.z.string().uuid(),
});
router.post('/claims/:id/photos', (0, validation_1.validateBody)(photoSchema), (req, res, next) => ngoController_1.ngoController.attachPhoto(req, res, next));
router.post('/claims/:id/complete', (req, res, next) => ngoController_1.ngoController.completeWork(req, res, next));
const abandonSchema = zod_1.z.object({
    reason: zod_1.z.string().min(5).max(300),
});
router.post('/claims/:id/abandon', (0, validation_1.validateBody)(abandonSchema), (req, res, next) => ngoController_1.ngoController.abandonClaim(req, res, next));
// Analytics & History
router.get('/heatmap', (req, res, next) => ngoController_1.ngoController.getHeatMap(req, res, next));
router.get('/history', (req, res, next) => ngoController_1.ngoController.getHistory(req, res, next));
router.get('/stats', (req, res, next) => ngoController_1.ngoController.getStats(req, res, next));
// Helpers CRUD
const createHelperSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(120),
    phone: zod_1.z.string().regex(/^\+[1-9]\d{7,14}$/),
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    areaLabel: zod_1.z.string().max(100).optional(),
    photoUrl: zod_1.z.string().url().max(500).optional(),
});
router.get('/helpers', (req, res, next) => ngoController_1.ngoController.listHelpers(req, res, next));
router.post('/helpers', (0, validation_1.validateBody)(createHelperSchema), (req, res, next) => ngoController_1.ngoController.createHelper(req, res, next));
router.put('/helpers/:id', (req, res, next) => ngoController_1.ngoController.updateHelper(req, res, next));
router.delete('/helpers/:id', (req, res, next) => ngoController_1.ngoController.deleteHelper(req, res, next));
exports.default = router;
