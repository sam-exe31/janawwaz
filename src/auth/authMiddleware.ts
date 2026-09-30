import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from './jwt';
import { AppError } from '../common/errors';
import { query } from '../database/db';
import { Role } from './types';

export async function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw AppError.unauthenticated('Bearer authentication token required');
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyAccessToken(token);

    const users = await query<any[]>(
      'SELECT id, phone, email, role, name, status, verification_status FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1',
      [decoded.sub]
    );

    if (users.length === 0) {
      throw AppError.unauthenticated('User not found or has been deactivated');
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
  } catch (err) {
    next(err);
  }
}

export function requireRole(...allowedRoles: Role[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(AppError.unauthenticated());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(AppError.forbidden(`Requires one of roles: ${allowedRoles.join(', ')}`));
    }

    next();
  };
}

export function requireNotSuspended(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(AppError.unauthenticated());
  }

  if (req.user.status === 'SUSPENDED') {
    return next(AppError.forbidden('Account is suspended. Write operations are disabled.', 'FORBIDDEN'));
  }

  next();
}

export function requireVolunteer(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return next(AppError.unauthenticated());
  }

  if (req.user.role !== 'CITIZEN' || req.user.verificationStatus !== 'VERIFIED') {
    return next(AppError.forbidden('Verified citizen volunteer capabilities required for this action'));
  }

  next();
}
