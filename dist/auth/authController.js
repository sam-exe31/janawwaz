"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authController = exports.AuthController = void 0;
const authService_1 = require("./authService");
const response_1 = require("../common/response");
class AuthController {
    async requestOtp(req, res, next) {
        try {
            const { phone } = req.body;
            const ip = req.ip || req.socket.remoteAddress;
            const result = await authService_1.authService.requestOtp(phone, ip);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async verifyOtp(req, res, next) {
        try {
            const { phone, code } = req.body;
            const ip = req.ip || req.socket.remoteAddress;
            const userAgent = req.headers['user-agent'];
            const result = await authService_1.authService.verifyOtp(phone, code, ip, userAgent);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async login(req, res, next) {
        try {
            const { email, password } = req.body;
            const ip = req.ip || req.socket.remoteAddress;
            const userAgent = req.headers['user-agent'];
            const result = await authService_1.authService.loginWithPassword(email, password, ip, userAgent);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async registerCitizen(req, res, next) {
        try {
            const ip = req.ip || req.socket.remoteAddress;
            const userAgent = req.headers['user-agent'];
            const result = await authService_1.authService.registerCitizen(req.body, ip, userAgent);
            return (0, response_1.sendSuccess)(res, result, 201);
        }
        catch (err) {
            next(err);
        }
    }
    async registerNgo(req, res, next) {
        try {
            const ip = req.ip || req.socket.remoteAddress;
            const userAgent = req.headers['user-agent'];
            const result = await authService_1.authService.registerNgo(req.body, ip, userAgent);
            return (0, response_1.sendSuccess)(res, result, 201);
        }
        catch (err) {
            next(err);
        }
    }
    async refresh(req, res, next) {
        try {
            const { refreshToken } = req.body;
            const ip = req.ip || req.socket.remoteAddress;
            const result = await authService_1.authService.refreshTokens(refreshToken, ip);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
    async logout(req, res, next) {
        try {
            const { refreshToken } = req.body;
            if (refreshToken) {
                await authService_1.authService.logout(refreshToken);
            }
            return (0, response_1.sendSuccess)(res, { success: true, message: 'Logged out successfully' });
        }
        catch (err) {
            next(err);
        }
    }
    async changePassword(req, res, next) {
        try {
            const { oldPassword, newPassword } = req.body;
            const userId = req.user.id;
            const result = await authService_1.authService.changePassword(userId, oldPassword, newPassword);
            return (0, response_1.sendSuccess)(res, result);
        }
        catch (err) {
            next(err);
        }
    }
}
exports.AuthController = AuthController;
exports.authController = new AuthController();
