"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmsOtpService = exports.DummyOtpService = void 0;
exports.getOtpService = getOtpService;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const config_1 = require("../config");
const errors_1 = require("../common/errors");
const db_1 = require("../database/db");
const utils_1 = require("../common/utils");
class DummyOtpService {
    async requestOtp(phone, ip) {
        // Check whitelist
        const isWhitelisted = config_1.config.otp.whitelist.includes(phone);
        if (!isWhitelisted) {
            throw new errors_1.AppError(403, 'PHONE_NOT_ALLOWED', 'Phone number is not whitelisted for dummy mode');
        }
        const code = config_1.config.otp.dummyCode; // default "123456"
        const codeHash = await bcryptjs_1.default.hash(code, 10);
        const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity
        await (0, db_1.execute)(`INSERT INTO otp_sessions (phone, code_hash, expires_at, attempts, ip)
       VALUES (?, ?, ?, 0, ?)`, [phone, codeHash, expiresAt, ip || null]);
        return {
            success: true,
            message: 'Dummy OTP sent successfully. Use configured test OTP.',
        };
    }
    async verifyOtp(phone, code) {
        const isWhitelisted = config_1.config.otp.whitelist.includes(phone);
        if (!isWhitelisted) {
            throw new errors_1.AppError(403, 'PHONE_NOT_ALLOWED', 'Phone number is not whitelisted');
        }
        const sessions = await (0, db_1.query)(`SELECT * FROM otp_sessions 
       WHERE phone = ? AND consumed_at IS NULL 
       ORDER BY created_at DESC LIMIT 1`, [phone]);
        if (sessions.length === 0) {
            throw new errors_1.AppError(400, 'INVALID_OTP', 'No active OTP session found. Please request a new OTP.');
        }
        const session = sessions[0];
        const expiryDate = (0, utils_1.parseUtcDate)(session.expires_at);
        if (new Date() > expiryDate) {
            throw new errors_1.AppError(400, 'OTP_EXPIRED', 'OTP has expired. Please request a new one.');
        }
        if (session.attempts >= 5) {
            throw new errors_1.AppError(400, 'INVALID_OTP', 'Maximum OTP verification attempts exceeded. Request a new OTP.');
        }
        const isMatch = await bcryptjs_1.default.compare(code, session.code_hash);
        if (!isMatch) {
            await (0, db_1.execute)('UPDATE otp_sessions SET attempts = attempts + 1 WHERE id = ?', [session.id]);
            throw new errors_1.AppError(400, 'INVALID_OTP', 'Invalid OTP code.');
        }
        // Mark consumed
        await (0, db_1.execute)('UPDATE otp_sessions SET consumed_at = NOW() WHERE id = ?', [session.id]);
        return true;
    }
}
exports.DummyOtpService = DummyOtpService;
class SmsOtpService {
    async requestOtp(phone, ip) {
        // Real mode stub
        throw new errors_1.AppError(501, 'INTERNAL_SERVER_ERROR', 'SMS OTP Service not configured yet.');
    }
    async verifyOtp(phone, code) {
        // Real mode stub
        throw new errors_1.AppError(501, 'INTERNAL_SERVER_ERROR', 'SMS OTP Service not configured yet.');
    }
}
exports.SmsOtpService = SmsOtpService;
let otpServiceInstance = null;
function getOtpService() {
    if (!otpServiceInstance) {
        if (config_1.config.otp.mode === 'REAL') {
            otpServiceInstance = new SmsOtpService();
        }
        else {
            otpServiceInstance = new DummyOtpService();
        }
    }
    return otpServiceInstance;
}
