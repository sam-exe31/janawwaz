"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.changePasswordSchema = exports.refreshTokenSchema = exports.registerNgoSchema = exports.registerCitizenSchema = exports.passwordLoginSchema = exports.verifyOtpSchema = exports.requestOtpSchema = void 0;
const zod_1 = require("zod");
exports.requestOtpSchema = zod_1.z.object({
    phone: zod_1.z
        .string()
        .regex(/^\+[1-9]\d{7,14}$/, 'Phone number must be a valid E.164 format (e.g. +919000000001)'),
});
exports.verifyOtpSchema = zod_1.z.object({
    phone: zod_1.z
        .string()
        .regex(/^\+[1-9]\d{7,14}$/, 'Phone number must be a valid E.164 format (e.g. +919000000001)'),
    code: zod_1.z.string().length(6, 'OTP code must be exactly 6 digits'),
});
exports.passwordLoginSchema = zod_1.z.object({
    email: zod_1.z.string().min(2, 'Username, email or phone is required'),
    password: zod_1.z.string().min(1, 'Password is required'),
});
exports.registerCitizenSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Name must be at least 2 characters'),
    email: zod_1.z.string().optional().or(zod_1.z.literal('')),
    phone: zod_1.z.string().optional().or(zod_1.z.literal('')),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
exports.registerNgoSchema = zod_1.z.object({
    name: zod_1.z.string().min(2, 'Organization name is required'),
    email: zod_1.z.string().email('Valid official email required'),
    phone: zod_1.z.string().optional().or(zod_1.z.literal('')),
    registrationNumber: zod_1.z.string().min(2, 'Registration number is required'),
    description: zod_1.z.string().optional().or(zod_1.z.literal('')),
    password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
});
exports.refreshTokenSchema = zod_1.z.object({
    refreshToken: zod_1.z.string().min(1, 'Refresh token is required'),
});
exports.changePasswordSchema = zod_1.z.object({
    oldPassword: zod_1.z.string().min(1, 'Old password is required'),
    newPassword: zod_1.z.string().min(8, 'New password must be at least 8 characters long'),
});
