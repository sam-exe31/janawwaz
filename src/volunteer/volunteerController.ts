import { Request, Response, NextFunction } from 'express';
import { volunteerService } from './volunteerService';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/errors';

export class VolunteerController {
  async getRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const lat = req.query.lat ? Number(req.query.lat) : undefined;
      const lng = req.query.lng ? Number(req.query.lng) : undefined;
      const radiusKm = req.query.radiusKm ? Number(req.query.radiusKm) : undefined;
      const categorySlug = req.query.category as string | undefined;

      const requests = await volunteerService.getAvailableRequests({
        lat,
        lng,
        radiusKm,
        categorySlug,
      });

      return sendSuccess(res, requests);
    } catch (err) {
      next(err);
    }
  }

  async recordAction(req: Request, res: Response, next: NextFunction) {
    try {
      const volunteerId = req.user!.id;
      const requestId = Number(req.params.id);
      if (isNaN(requestId)) {
        throw AppError.badRequest('Invalid request ID');
      }

      const { outcome, notes, proofPhotoUrl } = req.body;
      if (!outcome) {
        throw AppError.badRequest('Action outcome is required');
      }

      const validOutcomes = [
        'CALLED_NO_ANSWER',
        'CALLED_RESOLVED',
        'COORDINATING',
        'ESCALATED',
        'RESOLVED_WITH_PROOF',
      ];
      if (!validOutcomes.includes(outcome)) {
        throw AppError.badRequest(`Invalid outcome. Must be one of: ${validOutcomes.join(', ')}`);
      }

      const result = await volunteerService.recordAction(
        volunteerId,
        requestId,
        outcome,
        notes,
        proofPhotoUrl
      );

      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  async applyVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const { motivation } = req.body;

      const result = await volunteerService.submitVerificationRequest(userId, motivation);
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  async getVerificationStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const userId = req.user!.id;
      const result = await volunteerService.getVerificationStatus(userId);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const volunteerController = new VolunteerController();
