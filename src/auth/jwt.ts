import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { config } from '../config';
import { JwtUserPayload } from './types';
import { AppError } from '../common/errors';

export function signAccessToken(payload: JwtUserPayload): string {
  return jwt.sign(
    {
      sub: payload.sub,
      role: payload.role,
      verificationStatus: payload.verificationStatus,
    },
    config.jwt.secret,
    {
      algorithm: 'HS256',
      expiresIn: `${config.jwt.accessExpirationMinutes}m`,
    }
  );
}

export function verifyAccessToken(token: string): JwtUserPayload {
  try {
    const decoded = jwt.verify(token, config.jwt.secret, { algorithms: ['HS256'] }) as any;
    return {
      sub: Number(decoded.sub),
      role: decoded.role,
      verificationStatus: decoded.verificationStatus,
    };
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw AppError.unauthenticated('Access token has expired');
    }
    throw AppError.unauthenticated('Invalid access token');
  }
}

export function signRefreshToken(userId: number, sessionId: number): string {
  return jwt.sign(
    {
      sub: userId,
      sessionId,
    },
    config.jwt.refreshSecret,
    {
      algorithm: 'HS256',
      expiresIn: `${config.jwt.refreshExpirationDays}d`,
    }
  );
}

export function verifyRefreshToken(token: string): { sub: number; sessionId: number } {
  try {
    const decoded = jwt.verify(token, config.jwt.refreshSecret, { algorithms: ['HS256'] }) as any;
    return {
      sub: Number(decoded.sub),
      sessionId: Number(decoded.sessionId),
    };
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      throw AppError.unauthenticated('Refresh token has expired');
    }
    throw AppError.unauthenticated('Invalid refresh token');
  }
}

export function hashToken(token: string): string {
  return crypto.createHash('sha256').update(token).digest('hex');
}
