import { Router } from 'express';
import { authController } from './authController';
import { validateBody } from '../common/validation';
import {
  requestOtpSchema,
  verifyOtpSchema,
  passwordLoginSchema,
  refreshTokenSchema,
  changePasswordSchema,
} from './authValidation';
import { authenticate, requireNotSuspended } from './authMiddleware';

const router = Router();

// Citizen OTP flow
router.post('/otp/request', validateBody(requestOtpSchema), (req, res, next) =>
  authController.requestOtp(req, res, next)
);

router.post('/otp/verify', validateBody(verifyOtpSchema), (req, res, next) =>
  authController.verifyOtp(req, res, next)
);

// Password login for all roles (Citizen, NGO, Admin)
router.post('/login', validateBody(passwordLoginSchema), (req, res, next) =>
  authController.login(req, res, next)
);

// Citizen registration with password
router.post('/register', (req, res, next) =>
  authController.registerCitizen(req, res, next)
);
router.post('/register/citizen', (req, res, next) =>
  authController.registerCitizen(req, res, next)
);

// NGO registration with password
router.post('/register/ngo', (req, res, next) =>
  authController.registerNgo(req, res, next)
);

// Token refresh
router.post('/refresh', validateBody(refreshTokenSchema), (req, res, next) =>
  authController.refresh(req, res, next)
);

// Logout
router.post('/logout', (req, res, next) => authController.logout(req, res, next));

// Password change (requires authenticated NGO or Admin)
router.post(
  '/change-password',
  authenticate,
  requireNotSuspended,
  validateBody(changePasswordSchema),
  (req, res, next) => authController.changePassword(req, res, next)
);

export default router;
