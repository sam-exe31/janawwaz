import { Router } from 'express';
import { volunteerController } from './volunteerController';
import { authenticate, requireRole, requireNotSuspended } from '../auth/authMiddleware';

const router = Router();

router.use(authenticate);
router.use(requireRole('CITIZEN', 'ADMIN'));
router.use(requireNotSuspended);

// Get available requests for volunteer assistance
router.get('/requests', (req, res, next) => volunteerController.getRequests(req, res, next));

// Record volunteer action (call, coordinate, resolve with proof)
router.post('/requests/:id/actions', (req, res, next) =>
  volunteerController.recordAction(req, res, next)
);

// Apply for volunteer verification
router.post('/verification', (req, res, next) =>
  volunteerController.applyVerification(req, res, next)
);

// Get current user's verification status
router.get('/verification', (req, res, next) =>
  volunteerController.getVerificationStatus(req, res, next)
);

export default router;
