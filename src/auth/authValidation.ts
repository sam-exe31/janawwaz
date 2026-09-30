import { z } from 'zod';

export const requestOtpSchema = z.object({
  phone: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/, 'Phone number must be a valid E.164 format (e.g. +919000000001)'),
});

export const verifyOtpSchema = z.object({
  phone: z
    .string()
    .regex(/^\+[1-9]\d{7,14}$/, 'Phone number must be a valid E.164 format (e.g. +919000000001)'),
  code: z.string().length(6, 'OTP code must be exactly 6 digits'),
});

export const passwordLoginSchema = z.object({
  email: z.string().min(2, 'Username, email or phone is required'),
  password: z.string().min(1, 'Password is required'),
});

export const registerCitizenSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().optional().or(z.literal('')),
  phone: z.string().optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const registerNgoSchema = z.object({
  name: z.string().min(2, 'Organization name is required'),
  email: z.string().email('Valid official email required'),
  phone: z.string().optional().or(z.literal('')),
  registrationNumber: z.string().min(2, 'Registration number is required'),
  description: z.string().optional().or(z.literal('')),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string().min(1, 'Refresh token is required'),
});

export const changePasswordSchema = z.object({
  oldPassword: z.string().min(1, 'Old password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters long'),
});
