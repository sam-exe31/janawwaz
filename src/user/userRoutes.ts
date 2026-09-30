import { Router } from 'express';
import { userController, updateMeSchema } from './userController';
import { authenticate, requireNotSuspended } from '../auth/authMiddleware';
import { validateBody } from '../common/validation';

const router = Router();

router.get('/me', authenticate, (req, res, next) => userController.getMe(req, res, next));
router.put(
  '/me',
  authenticate,
  requireNotSuspended,
  validateBody(updateMeSchema),
  (req, res, next) => userController.updateMe(req, res, next)
);

export default router;
