import { Router } from 'express';
import { requestController } from './requestController';
import { authenticate, requireRole, requireNotSuspended } from '../auth/authMiddleware';
import { validateBody } from '../common/validation';
import { createRequestSchema } from './requestValidation';
import { ratingController } from '../rating/ratingController';

const router = Router();

router.use(authenticate);

// Citizen creates civic request
router.post(
  '/',
  requireRole('CITIZEN'),
  requireNotSuspended,
  validateBody(createRequestSchema),
  (req, res, next) => requestController.create(req, res, next)
);

// Citizen views their own requests
router.get('/', (req, res, next) => requestController.listOwn(req, res, next));

// View request details
router.get('/:id', (req, res, next) => requestController.getById(req, res, next));

// View request works done history
router.get('/:id/history', (req, res, next) => requestController.getHistory(req, res, next));

// Citizen rates completed/closed request
router.post(
  '/:id/rating',
  requireRole('CITIZEN'),
  requireNotSuspended,
  (req, res, next) => ratingController.submitRating(req, res, next)
);

// Get rating for request
router.get('/:id/rating', (req, res, next) => ratingController.getRating(req, res, next));

export default router;
