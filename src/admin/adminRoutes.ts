import { Router } from 'express';
import { adminController } from './adminController';
import { authenticate, requireRole, requireNotSuspended } from '../auth/authMiddleware';
import { validateBody } from '../common/validation';
import { z } from 'zod';

const router = Router();

router.use(authenticate);
router.use(requireRole('ADMIN'));
router.use(requireNotSuspended);

// Dashboard & Progress
router.get('/dashboard', (req, res, next) => adminController.getDashboard(req, res, next));
router.get('/progress', (req, res, next) => adminController.getProgress(req, res, next));
router.get('/audit-log', (req, res, next) => adminController.getAuditLog(req, res, next));

// Requests Queue & Detail
router.get('/requests', (req, res, next) => adminController.getRequests(req, res, next));
router.get('/requests/:id', (req, res, next) => adminController.getRequestDetails(req, res, next));

// Actions
const noteSchema = z.object({ note: z.string().min(2).max(500) });
const categorySchema = z.object({ categoryId: z.number().int().positive(), note: z.string().min(2) });
const budgetSchema = z.object({ approvedBudget: z.number().positive(), note: z.string().min(2) });
const overrideSchema = z.object({
  status: z.enum([
    'SUBMITTED', 'SCREENING', 'OPEN', 'NEEDS_ADMIN_REVIEW', 'REJECTED_FAKE',
    'CLAIMED', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CLOSED',
    'REJECTED_BY_NGO', 'ADMIN_IN_PROGRESS'
  ]),
  note: z.string().min(2),
});

router.post('/requests/:id/approve', validateBody(noteSchema), (req, res, next) =>
  adminController.approve(req, res, next)
);
router.post('/requests/:id/mark-fake', validateBody(noteSchema), (req, res, next) =>
  adminController.markFake(req, res, next)
);
router.post('/requests/:id/set-category', validateBody(categorySchema), (req, res, next) =>
  adminController.setCategory(req, res, next)
);
router.post('/requests/:id/set-budget', validateBody(budgetSchema), (req, res, next) =>
  adminController.setBudget(req, res, next)
);
router.post('/requests/:id/close', validateBody(noteSchema), (req, res, next) =>
  adminController.close(req, res, next)
);
router.post('/requests/:id/release', validateBody(noteSchema), (req, res, next) =>
  adminController.release(req, res, next)
);
router.post('/requests/:id/take-over', validateBody(noteSchema), (req, res, next) =>
  adminController.takeOver(req, res, next)
);
router.post('/requests/:id/reject-proof', validateBody(noteSchema), (req, res, next) =>
  adminController.rejectProof(req, res, next)
);
router.post('/requests/:id/override-status', validateBody(overrideSchema), (req, res, next) =>
  adminController.overrideStatus(req, res, next)
);

// NGO Management
const createNgoSchema = z.object({
  name: z.string().min(2).max(150),
  email: z.string().email(),
  registrationNumber: z.string().min(2).max(100),
  contactPhone: z.string().optional(),
  description: z.string().optional(),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  serviceRadiusKm: z.number().positive().optional(),
  areaLabel: z.string().optional(),
});
router.get('/ngos', (req, res, next) => adminController.listNgos(req, res, next));
router.post('/ngos', validateBody(createNgoSchema), (req, res, next) =>
  adminController.createNgo(req, res, next)
);
router.delete('/ngos/:id', (req, res, next) => adminController.deleteNgo(req, res, next));

// Citizen Management
router.get('/citizens', (req, res, next) => adminController.listCitizens(req, res, next));
router.post('/citizens/:id/verify', (req, res, next) => adminController.verifyCitizen(req, res, next));
router.post('/citizens/:id/suspend', (req, res, next) => adminController.suspendCitizen(req, res, next));
router.post('/citizens/:id/reactivate', (req, res, next) =>
  adminController.reactivateCitizen(req, res, next)
);

// Manual Rewards Grant
const grantRewardSchema = z.object({
  userId: z.number().int().positive(),
  points: z.number().int(),
  reason: z.string().min(2).max(255),
  requestId: z.number().int().positive().optional(),
});
router.post('/rewards/grant', validateBody(grantRewardSchema), (req, res, next) =>
  adminController.grantReward(req, res, next)
);

export default router;
