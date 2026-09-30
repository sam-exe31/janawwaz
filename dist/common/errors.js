"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppError = void 0;
class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, code, message, details = []) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        Object.setPrototypeOf(this, new.target.prototype);
    }
    static badRequest(message, code = 'VALIDATION_FAILED', details = []) {
        return new AppError(400, code, message, details);
    }
    static unauthenticated(message = 'Authentication required', code = 'UNAUTHENTICATED') {
        return new AppError(401, code, message);
    }
    static forbidden(message = 'Access denied', code = 'FORBIDDEN') {
        return new AppError(403, code, message);
    }
    static notFound(message = 'Resource not found', code = 'NOT_FOUND') {
        return new AppError(404, code, message);
    }
    static conflict(message, code = 'CONFLICT') {
        return new AppError(409, code, message);
    }
    static unprocessable(message, code = 'SEMANTIC_FAILURE') {
        return new AppError(422, code, message);
    }
    static rateLimit(message = 'Rate limit exceeded', code = 'RATE_LIMIT_EXCEEDED') {
        return new AppError(429, code, message);
    }
    static internal(message = 'Internal server error', code = 'INTERNAL_SERVER_ERROR') {
        return new AppError(500, code, message);
    }
}
exports.AppError = AppError;
