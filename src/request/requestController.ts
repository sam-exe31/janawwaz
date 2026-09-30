import { Request, Response, NextFunction } from 'express';
import { requestService } from './requestService';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/errors';

export class RequestController {
  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const citizenId = req.user!.id;
      const result = await requestService.submitRequest(citizenId, req.body);
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  async listOwn(req: Request, res: Response, next: NextFunction) {
    try {
      const citizenId = req.user!.id;
      const page = Math.max(0, Number(req.query.page) || 0);
      const size = Math.min(100, Math.max(1, Number(req.query.size) || 20));

      const { items, total } = await requestService.getCitizenRequests(citizenId, page, size);
      return sendSuccess(res, items, 200, { page, size, total });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const requestId = Number(req.params.id);
      if (isNaN(requestId)) throw AppError.badRequest('Invalid request ID');

      const details = await requestService.getRequestById(requestId, req.user!);
      return sendSuccess(res, details);
    } catch (err) {
      next(err);
    }
  }

  async getHistory(req: Request, res: Response, next: NextFunction) {
    try {
      const requestId = Number(req.params.id);
      if (isNaN(requestId)) throw AppError.badRequest('Invalid request ID');

      const history = await requestService.getRequestHistory(requestId);
      return sendSuccess(res, history);
    } catch (err) {
      next(err);
    }
  }
}

export const requestController = new RequestController();
