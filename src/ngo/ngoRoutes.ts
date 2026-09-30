import { Router } from 'express';
import { ngoController } from './ngoController';
import { authenticate, requireRole, requireNotSuspended } from '../auth/authMiddleware';
import { validateBody } from '../common/validation';
import { z } from 'zod';

const router = Router();

router.use(authenticate);
router.use(requireRole('NGO'));
router.use(requireNotSuspended);

// NGO Profile
router.get('/me', (req, res, next) => ngoController.getMe(req, res, next));
router.put('/me', (req, res, next) => ngoController.updateMe(req, res, next));

// Open requests in service area
router.get('/requests', (req, res, next) => ngoController.getOpenRequests(req, res, next));
router.get('/requests/:id', (req, res, next) => ngoController.getRequestById(req, res, next));

// Claim & Reject
const rejectSchema = z.object({
  reason: z.string().min(3).max(300),
});
router.post('/requests/:id/claim', (req, res, next) => ngoController.claim(req, res, next));
router.post('/requests/:id/reject', validateBody(rejectSchema), (req, res, next) =>
  ngoController.reject(req, res, next)
);

// Claims workflow
router.get('/claims', (req, res, next) => ngoController.listClaims(req, res, next));
router.get('/claims/:id/helper-suggestions', (req, res, next) =>
  ngoController.getHelperSuggestions(req, res, next)
);

const assignSchema = z.object({
  helperId: z.number().int().positive(),
  note: z.string().max(500).optional(),
});
router.post('/claims/:id/assign', validateBody(assignSchema), (req, res, next) =>
  ngoController.assignHelper(req, res, next)
);

router.post('/claims/:id/start', (req, res, next) => ngoController.startWork(req, res, next));

const photoSchema = z.object({
  kind: z.enum(['BEFORE', 'AFTER']),
  uploadId: z.string().uuid(),
});
router.post('/claims/:id/photos', validateBody(photoSchema), (req, res, next) =>
  ngoController.attachPhoto(req, res, next)
);

router.post('/claims/:id/complete', (req, res, next) => ngoController.completeWork(req, res, next));

const abandonSchema = z.object({
  reason: z.string().min(5).max(300),
});
router.post('/claims/:id/abandon', validateBody(abandonSchema), (req, res, next) =>
  ngoController.abandonClaim(req, res, next)
);

// Analytics & History
router.get('/heatmap', (req, res, next) => ngoController.getHeatMap(req, res, next));
router.get('/history', (req, res, next) => ngoController.getHistory(req, res, next));
router.get('/stats', (req, res, next) => ngoController.getStats(req, res, next));

// Helpers CRUD
const createHelperSchema = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().regex(/^\+[1-9]\d{7,14}$/),
  latitude: z.number().min(-90).max(90),
  longitude: z.number().min(-180).max(180),
  areaLabel: z.string().max(100).optional(),
  photoUrl: z.string().url().max(500).optional(),
});
router.get('/helpers', (req, res, next) => ngoController.listHelpers(req, res, next));
router.post('/helpers', validateBody(createHelperSchema), (req, res, next) =>
  ngoController.createHelper(req, res, next)
);
router.put('/helpers/:id', (req, res, next) => ngoController.updateHelper(req, res, next));
router.delete('/helpers/:id', (req, res, next) => ngoController.deleteHelper(req, res, next));

export default router;
