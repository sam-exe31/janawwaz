import bcrypt from 'bcryptjs';
import { config } from '../config';
import { AppError } from '../common/errors';
import { query, execute } from '../database/db';
import { parseUtcDate } from '../common/utils';

export interface OtpService {
  requestOtp(phone: string, ip?: string): Promise<{ success: boolean; message: string }>;
  verifyOtp(phone: string, code: string): Promise<boolean>;
}

export class DummyOtpService implements OtpService {
  async requestOtp(phone: string, ip?: string): Promise<{ success: boolean; message: string }> {
    // Check whitelist
    const isWhitelisted = config.otp.whitelist.includes(phone);
    if (!isWhitelisted) {
      throw new AppError(403, 'PHONE_NOT_ALLOWED', 'Phone number is not whitelisted for dummy mode');
    }

    const code = config.otp.dummyCode; // default "123456"
    const codeHash = await bcrypt.hash(code, 10);
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5 minutes validity

    await execute(
      `INSERT INTO otp_sessions (phone, code_hash, expires_at, attempts, ip)
       VALUES (?, ?, ?, 0, ?)`,
      [phone, codeHash, expiresAt, ip || null]
    );

    return {
      success: true,
      message: 'Dummy OTP sent successfully. Use configured test OTP.',
    };
  }

  async verifyOtp(phone: string, code: string): Promise<boolean> {
    const isWhitelisted = config.otp.whitelist.includes(phone);
    if (!isWhitelisted) {
      throw new AppError(403, 'PHONE_NOT_ALLOWED', 'Phone number is not whitelisted');
    }

    const sessions = await query<any[]>(
      `SELECT * FROM otp_sessions 
       WHERE phone = ? AND consumed_at IS NULL 
       ORDER BY created_at DESC LIMIT 1`,
      [phone]
    );

    if (sessions.length === 0) {
      throw new AppError(400, 'INVALID_OTP', 'No active OTP session found. Please request a new OTP.');
    }

    const session = sessions[0];
    const expiryDate = parseUtcDate(session.expires_at);

    if (new Date() > expiryDate) {
      throw new AppError(400, 'OTP_EXPIRED', 'OTP has expired. Please request a new one.');
    }

    if (session.attempts >= 5) {
      throw new AppError(400, 'INVALID_OTP', 'Maximum OTP verification attempts exceeded. Request a new OTP.');
    }

    const isMatch = await bcrypt.compare(code, session.code_hash);
    if (!isMatch) {
      await execute('UPDATE otp_sessions SET attempts = attempts + 1 WHERE id = ?', [session.id]);
      throw new AppError(400, 'INVALID_OTP', 'Invalid OTP code.');
    }

    // Mark consumed
    await execute('UPDATE otp_sessions SET consumed_at = NOW() WHERE id = ?', [session.id]);
    return true;
  }
}

export class SmsOtpService implements OtpService {
  async requestOtp(phone: string, ip?: string): Promise<{ success: boolean; message: string }> {
    // Real mode stub
    throw new AppError(501, 'INTERNAL_SERVER_ERROR', 'SMS OTP Service not configured yet.');
  }

  async verifyOtp(phone: string, code: string): Promise<boolean> {
    // Real mode stub
    throw new AppError(501, 'INTERNAL_SERVER_ERROR', 'SMS OTP Service not configured yet.');
  }
}

let otpServiceInstance: OtpService | null = null;

export function getOtpService(): OtpService {
  if (!otpServiceInstance) {
    if (config.otp.mode === 'REAL') {
      otpServiceInstance = new SmsOtpService();
    } else {
      otpServiceInstance = new DummyOtpService();
    }
  }
  return otpServiceInstance;
}
