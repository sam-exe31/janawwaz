"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.signAccessToken = signAccessToken;
exports.verifyAccessToken = verifyAccessToken;
exports.signRefreshToken = signRefreshToken;
exports.verifyRefreshToken = verifyRefreshToken;
exports.hashToken = hashToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const config_1 = require("../config");
const errors_1 = require("../common/errors");
function signAccessToken(payload) {
    return jsonwebtoken_1.default.sign({
        sub: payload.sub,
        role: payload.role,
        verificationStatus: payload.verificationStatus,
    }, config_1.config.jwt.secret, {
        algorithm: 'HS256',
        expiresIn: `${config_1.config.jwt.accessExpirationMinutes}m`,
    });
}
function verifyAccessToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.secret, { algorithms: ['HS256'] });
        return {
            sub: Number(decoded.sub),
            role: decoded.role,
            verificationStatus: decoded.verificationStatus,
        };
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw errors_1.AppError.unauthenticated('Access token has expired');
        }
        throw errors_1.AppError.unauthenticated('Invalid access token');
    }
}
function signRefreshToken(userId, sessionId) {
    return jsonwebtoken_1.default.sign({
        sub: userId,
        sessionId,
    }, config_1.config.jwt.refreshSecret, {
        algorithm: 'HS256',
        expiresIn: `${config_1.config.jwt.refreshExpirationDays}d`,
    });
}
function verifyRefreshToken(token) {
    try {
        const decoded = jsonwebtoken_1.default.verify(token, config_1.config.jwt.refreshSecret, { algorithms: ['HS256'] });
        return {
            sub: Number(decoded.sub),
            sessionId: Number(decoded.sessionId),
        };
    }
    catch (err) {
        if (err.name === 'TokenExpiredError') {
            throw errors_1.AppError.unauthenticated('Refresh token has expired');
        }
        throw errors_1.AppError.unauthenticated('Invalid refresh token');
    }
}
function hashToken(token) {
    return crypto_1.default.createHash('sha256').update(token).digest('hex');
}
