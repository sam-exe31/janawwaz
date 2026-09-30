import { Request, Response, NextFunction } from 'express';
import { ratingService } from './ratingService';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/errors';

export class RatingController {
  async submitRating(req: Request, res: Response, next: NextFunction) {
    try {
      const citizenId = req.user!.id;
      const requestId = Number(req.params.id);
      if (isNaN(requestId)) {
        throw AppError.badRequest('Invalid request ID');
      }

      const { stars, comment } = req.body;
      if (stars === undefined) {
        throw AppError.badRequest('Stars (1-5) is required');
      }

      const result = await ratingService.submitRating(citizenId, requestId, Number(stars), comment);
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  async getRating(req: Request, res: Response, next: NextFunction) {
    try {
      const requestId = Number(req.params.id);
      if (isNaN(requestId)) {
        throw AppError.badRequest('Invalid request ID');
      }

      const rating = await ratingService.getRatingForRequest(requestId);
      return sendSuccess(res, rating);
    } catch (err) {
      next(err);
    }
  }
}

export const ratingController = new RatingController();
