"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.requireRole = requireRole;
exports.requireNotSuspended = requireNotSuspended;
exports.requireVolunteer = requireVolunteer;
const jwt_1 = require("./jwt");
const errors_1 = require("../common/errors");
const db_1 = require("../database/db");
async function authenticate(req, res, next) {
    try {
        const authHeader = req.headers.authorization;
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw errors_1.AppError.unauthenticated('Bearer authentication token required');
        }
        const token = authHeader.split(' ')[1];
        const decoded = (0, jwt_1.verifyAccessToken)(token);
        const users = await (0, db_1.query)('SELECT id, phone, email, role, name, status, verification_status FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1', [decoded.sub]);
        if (users.length === 0) {
            throw errors_1.AppError.unauthenticated('User not found or has been deactivated');
        }
        const user = users[0];
        req.user = {
            id: user.id,
            phone: user.phone,
            email: user.email,
            role: user.role,
            name: user.name,
            status: user.status,
            verificationStatus: user.verification_status,
        };
        next();
    }
    catch (err) {
        next(err);
    }
}
function requireRole(...allowedRoles) {
    return (req, res, next) => {
        if (!req.user) {
            return next(errors_1.AppError.unauthenticated());
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(errors_1.AppError.forbidden(`Requires one of roles: ${allowedRoles.join(', ')}`));
        }
        next();
    };
}
function requireNotSuspended(req, res, next) {
    if (!req.user) {
        return next(errors_1.AppError.unauthenticated());
    }
    if (req.user.status === 'SUSPENDED') {
        return next(errors_1.AppError.forbidden('Account is suspended. Write operations are disabled.', 'FORBIDDEN'));
    }
    next();
}
function requireVolunteer(req, res, next) {
    if (!req.user) {
        return next(errors_1.AppError.unauthenticated());
    }
    if (req.user.role !== 'CITIZEN' || req.user.verificationStatus !== 'VERIFIED') {
        return next(errors_1.AppError.forbidden('Verified citizen volunteer capabilities required for this action'));
    }
    next();
}
