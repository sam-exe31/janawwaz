"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
const errors_1 = require("./errors");
const response_1 = require("./response");
const zod_1 = require("zod");
function errorHandler(err, req, res, next) {
    // Check if headers already sent
    if (res.headersSent) {
        return next(err);
    }
    // Handle known AppError
    if (err instanceof errors_1.AppError) {
        return (0, response_1.sendError)(res, err.statusCode, err.code, err.message, err.details);
    }
    // Handle Zod validation errors
    if (err instanceof zod_1.ZodError) {
        const details = err.issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
        }));
        return (0, response_1.sendError)(res, 400, 'VALIDATION_FAILED', 'Validation failed on input', details);
    }
    // Handle MySQL duplicate entry error
    if (err.code === 'ER_DUP_ENTRY') {
        return (0, response_1.sendError)(res, 409, 'CONFLICT', 'A record with duplicate unique fields already exists.');
    }
    // Handle SyntaxError (JSON parse failure)
    if (err instanceof SyntaxError && 'body' in err) {
        return (0, response_1.sendError)(res, 400, 'VALIDATION_FAILED', 'Malformed JSON in request body');
    }
    // Fallback for unexpected errors: Log internally, never leak stack trace to client
    console.error('[Unhandled Error]', err);
    return (0, response_1.sendError)(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.');
}
