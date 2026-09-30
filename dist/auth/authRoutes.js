"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const authController_1 = require("./authController");
const validation_1 = require("../common/validation");
const authValidation_1 = require("./authValidation");
const authMiddleware_1 = require("./authMiddleware");
const router = (0, express_1.Router)();
// Citizen OTP flow
router.post('/otp/request', (0, validation_1.validateBody)(authValidation_1.requestOtpSchema), (req, res, next) => authController_1.authController.requestOtp(req, res, next));
router.post('/otp/verify', (0, validation_1.validateBody)(authValidation_1.verifyOtpSchema), (req, res, next) => authController_1.authController.verifyOtp(req, res, next));
// Password login for all roles (Citizen, NGO, Admin)
router.post('/login', (0, validation_1.validateBody)(authValidation_1.passwordLoginSchema), (req, res, next) => authController_1.authController.login(req, res, next));
// Citizen registration with password
router.post('/register', (req, res, next) => authController_1.authController.registerCitizen(req, res, next));
router.post('/register/citizen', (req, res, next) => authController_1.authController.registerCitizen(req, res, next));
// NGO registration with password
router.post('/register/ngo', (req, res, next) => authController_1.authController.registerNgo(req, res, next));
// Token refresh
router.post('/refresh', (0, validation_1.validateBody)(authValidation_1.refreshTokenSchema), (req, res, next) => authController_1.authController.refresh(req, res, next));
// Logout
router.post('/logout', (req, res, next) => authController_1.authController.logout(req, res, next));
// Password change (requires authenticated NGO or Admin)
router.post('/change-password', authMiddleware_1.authenticate, authMiddleware_1.requireNotSuspended, (0, validation_1.validateBody)(authValidation_1.changePasswordSchema), (req, res, next) => authController_1.authController.changePassword(req, res, next));
exports.default = router;
