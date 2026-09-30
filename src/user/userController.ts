import { Request, Response, NextFunction } from 'express';
import { query, execute } from '../database/db';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/errors';
import { z } from 'zod';
import { sanitizeText } from '../common/utils';

export const updateMeSchema = z.object({
  name: z.string().max(120).optional(),
  bio: z.string().max(300).optional(),
  avatarUrl: z.string().url().max(500).optional().nullable(),
});

export class UserController {
  async getMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;

      const users = await query<any[]>(
        `SELECT id, phone, email, role, name, status, verification_status as verificationStatus,
                avatar_url as avatarUrl, bio, last_login_at as lastLoginAt, created_at as createdAt
         FROM users WHERE id = ? AND deleted_at IS NULL LIMIT 1`,
        [userId]
      );

      if (users.length === 0) {
        throw AppError.notFound('User not found');
      }

      const user = users[0];

      // Calculate reward balance from ledger: SUM(points)
      const balanceRows = await query<any[]>(
        'SELECT COALESCE(SUM(points), 0) as balance FROM reward_ledger WHERE user_id = ?',
        [userId]
      );

      const rewardsBalance = balanceRows.length > 0 ? Number(balanceRows[0].balance) : 0;

      return sendSuccess(res, {
        ...user,
        rewardsBalance,
      });
    } catch (err) {
      next(err);
    }
  }

  async updateMe(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { name, bio, avatarUrl } = req.body;

      const updates: string[] = [];
      const values: any[] = [];

      if (name !== undefined) {
        updates.push('name = ?');
        values.push(sanitizeText(name));
      }
      if (bio !== undefined) {
        updates.push('bio = ?');
        values.push(sanitizeText(bio));
      }
      if (avatarUrl !== undefined) {
        updates.push('avatar_url = ?');
        values.push(avatarUrl);
      }

      if (updates.length > 0) {
        values.push(userId);
        await execute(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
      }

      return this.getMe(req, res, next);
    } catch (err) {
      next(err);
    }
  }
}

export const userController = new UserController();
