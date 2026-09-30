import { Request, Response, NextFunction } from 'express';
import { publicService } from './publicService';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/errors';

export class PublicController {
  async recordVisit(req: Request, res: Response, next: NextFunction) {
    try {
      const hasCookie = req.signedCookies && req.signedCookies.visited_today === 'true';
      const result = await publicService.recordVisit(!!hasCookie);

      // Set signed cookie valid for 24 hours
      res.cookie('visited_today', 'true', {
        maxAge: 24 * 60 * 60 * 1000,
        signed: true,
        httpOnly: true,
        sameSite: 'lax',
      });

      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getCategories(req: Request, res: Response, next: NextFunction) {
    try {
      const categories = await publicService.getCategories();
      return sendSuccess(res, categories);
    } catch (err) {
      next(err);
    }
  }

  async getLeaderboard(req: Request, res: Response, next: NextFunction) {
    try {
      const period = (req.query.period as string) || 'ALL';
      const leaderboard = await publicService.getLeaderboard(period);
      return sendSuccess(res, leaderboard);
    } catch (err) {
      next(err);
    }
  }

  async getNgoProfile(req: Request, res: Response, next: NextFunction) {
    try {
      const ngoId = Number(req.params.id);
      if (isNaN(ngoId)) {
        throw AppError.badRequest('Invalid NGO ID');
      }

      const profile = await publicService.getNgoPublicProfile(ngoId);
      if (!profile) {
        throw AppError.notFound('NGO not found');
      }

      return sendSuccess(res, profile);
    } catch (err) {
      next(err);
    }
  }

  async getStats(req: Request, res: Response, next: NextFunction) {
    try {
      const stats = await publicService.getStats();
      return sendSuccess(res, stats);
    } catch (err) {
      next(err);
    }
  }

  async getPublicFeed(req: Request, res: Response, next: NextFunction) {
    try {
      const categorySlug = req.query.category as string | undefined;
      const limit = Number(req.query.limit) || 20;
      const feed = await publicService.getPublicFeed(categorySlug, limit);
      return sendSuccess(res, feed);
    } catch (err) {
      next(err);
    }
  }
}

export const publicController = new PublicController();
