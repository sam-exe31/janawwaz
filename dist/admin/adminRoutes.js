"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const adminController_1 = require("./adminController");
const authMiddleware_1 = require("../auth/authMiddleware");
const validation_1 = require("../common/validation");
const zod_1 = require("zod");
const router = (0, express_1.Router)();
router.use(authMiddleware_1.authenticate);
router.use((0, authMiddleware_1.requireRole)('ADMIN'));
router.use(authMiddleware_1.requireNotSuspended);
// Dashboard & Progress
router.get('/dashboard', (req, res, next) => adminController_1.adminController.getDashboard(req, res, next));
router.get('/progress', (req, res, next) => adminController_1.adminController.getProgress(req, res, next));
router.get('/audit-log', (req, res, next) => adminController_1.adminController.getAuditLog(req, res, next));
// Requests Queue & Detail
router.get('/requests', (req, res, next) => adminController_1.adminController.getRequests(req, res, next));
router.get('/requests/:id', (req, res, next) => adminController_1.adminController.getRequestDetails(req, res, next));
// Actions
const noteSchema = zod_1.z.object({ note: zod_1.z.string().min(2).max(500) });
const categorySchema = zod_1.z.object({ categoryId: zod_1.z.number().int().positive(), note: zod_1.z.string().min(2) });
const budgetSchema = zod_1.z.object({ approvedBudget: zod_1.z.number().positive(), note: zod_1.z.string().min(2) });
const overrideSchema = zod_1.z.object({
    status: zod_1.z.enum([
        'SUBMITTED', 'SCREENING', 'OPEN', 'NEEDS_ADMIN_REVIEW', 'REJECTED_FAKE',
        'CLAIMED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED',
        'REJECTED_BY_NGO', 'ADMIN_IN_PROGRESS'
    ]),
    note: zod_1.z.string().min(2),
});
router.post('/requests/:id/approve', (0, validation_1.validateBody)(noteSchema), (req, res, next) => adminController_1.adminController.approve(req, res, next));
router.post('/requests/:id/mark-fake', (0, validation_1.validateBody)(noteSchema), (req, res, next) => adminController_1.adminController.markFake(req, res, next));
router.post('/requests/:id/set-category', (0, validation_1.validateBody)(categorySchema), (req, res, next) => adminController_1.adminController.setCategory(req, res, next));
router.post('/requests/:id/set-budget', (0, validation_1.validateBody)(budgetSchema), (req, res, next) => adminController_1.adminController.setBudget(req, res, next));
router.post('/requests/:id/close', (0, validation_1.validateBody)(noteSchema), (req, res, next) => adminController_1.adminController.close(req, res, next));
router.post('/requests/:id/release', (0, validation_1.validateBody)(noteSchema), (req, res, next) => adminController_1.adminController.release(req, res, next));
router.post('/requests/:id/take-over', (0, validation_1.validateBody)(noteSchema), (req, res, next) => adminController_1.adminController.takeOver(req, res, next));
router.post('/requests/:id/reject-proof', (0, validation_1.validateBody)(noteSchema), (req, res, next) => adminController_1.adminController.rejectProof(req, res, next));
router.post('/requests/:id/override-status', (0, validation_1.validateBody)(overrideSchema), (req, res, next) => adminController_1.adminController.overrideStatus(req, res, next));
// NGO Management
const createNgoSchema = zod_1.z.object({
    name: zod_1.z.string().min(2).max(150),
    email: zod_1.z.string().email(),
    registrationNumber: zod_1.z.string().min(2).max(100),
    contactPhone: zod_1.z.string().optional(),
    description: zod_1.z.string().optional(),
    latitude: zod_1.z.number().min(-90).max(90),
    longitude: zod_1.z.number().min(-180).max(180),
    serviceRadiusKm: zod_1.z.number().positive().optional(),
    areaLabel: zod_1.z.string().optional(),
});
router.get('/ngos', (req, res, next) => adminController_1.adminController.listNgos(req, res, next));
router.post('/ngos', (0, validation_1.validateBody)(createNgoSchema), (req, res, next) => adminController_1.adminController.createNgo(req, res, next));
router.delete('/ngos/:id', (req, res, next) => adminController_1.adminController.deleteNgo(req, res, next));
// Citizen Management
router.get('/citizens', (req, res, next) => adminController_1.adminController.listCitizens(req, res, next));
router.post('/citizens/:id/verify', (req, res, next) => adminController_1.adminController.verifyCitizen(req, res, next));
router.post('/citizens/:id/suspend', (req, res, next) => adminController_1.adminController.suspendCitizen(req, res, next));
router.post('/citizens/:id/reactivate', (req, res, next) => adminController_1.adminController.reactivateCitizen(req, res, next));
// Manual Rewards Grant
const grantRewardSchema = zod_1.z.object({
    userId: zod_1.z.number().int().positive(),
    points: zod_1.z.number().int(),
    reason: zod_1.z.string().min(2).max(255),
    requestId: zod_1.z.number().int().positive().optional(),
});
router.post('/rewards/grant', (0, validation_1.validateBody)(grantRewardSchema), (req, res, next) => adminController_1.adminController.grantReward(req, res, next));
exports.default = router;
