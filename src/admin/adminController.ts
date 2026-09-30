import { Request, Response, NextFunction } from 'express';
import { adminService } from './adminService';
import { rewardService } from '../reward/rewardService';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/errors';

export class AdminController {
  async getDashboard(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.getDashboard();
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getProgress(req: Request, res: Response, next: NextFunction) {
    try {
      const data = await adminService.getProgress();
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  async getRequests(req: Request, res: Response, next: NextFunction) {
    try {
      const { status, category, flag, escalated } = req.query;
      const page = Math.max(0, Number(req.query.page) || 0);
      const size = Math.min(100, Math.max(1, Number(req.query.size) || 20));

      const { items, total } = await adminService.getRequests(
        {
          status: status as string,
          category: category as string,
          flag: flag as string,
          escalated: escalated === 'true',
        },
        page,
        size
      );

      return sendSuccess(res, items, 200, { page, size, total });
    } catch (err) {
      next(err);
    }
  }

  async getRequestDetails(req: Request, res: Response, next: NextFunction) {
    try {
      const requestId = Number(req.params.id);
      if (isNaN(requestId)) throw AppError.badRequest('Invalid request ID');

      const data = await adminService.getAdminRequestDetails(requestId);
      return sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  async approve(req: Request, res: Response, next: NextFunction) {
    try {
      const requestId = Number(req.params.id);
      const { note } = req.body;
      const result = await adminService.approveRequest(req.user!.id, requestId, note);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async markFake(req: Request, res: Response, next: NextFunction) {
    try {
      const requestId = Number(req.params.id);
      const { note } = req.body;
      const result = await adminService.markFake(req.user!.id, requestId, note);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async setCategory(req: Request, res: Response, next: NextFunction) {
    try {
      const requestId = Number(req.params.id);
      const { categoryId, note } = req.body;
      const result = await adminService.setCategory(req.user!.id, requestId, categoryId, note);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async setBudget(req: Request, res: Response, next: NextFunction) {
    try {
      const requestId = Number(req.params.id);
      const { approvedBudget, note } = req.body;
      const result = await adminService.setBudget(req.user!.id, requestId, approvedBudget, note);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async close(req: Request, res: Response, next: NextFunction) {
    try {
      const requestId = Number(req.params.id);
      const { note } = req.body;
      const result = await adminService.closeRequest(req.user!.id, requestId, note);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async release(req: Request, res: Response, next: NextFunction) {
    try {
      const requestId = Number(req.params.id);
      const { note } = req.body;
      const result = await adminService.releaseClaim(req.user!.id, requestId, note);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async takeOver(req: Request, res: Response, next: NextFunction) {
    try {
      const requestId = Number(req.params.id);
      const { note } = req.body;
      const result = await adminService.takeOver(req.user!.id, requestId, note);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async rejectProof(req: Request, res: Response, next: NextFunction) {
    try {
      const requestId = Number(req.params.id);
      const { note } = req.body;
      const result = await adminService.rejectProof(req.user!.id, requestId, note);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async overrideStatus(req: Request, res: Response, next: NextFunction) {
    try {
      const requestId = Number(req.params.id);
      const { status, note } = req.body;
      const result = await adminService.overrideStatus(req.user!.id, requestId, status, note);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async listNgos(req: Request, res: Response, next: NextFunction) {
    try {
      const ngos = await adminService.listNgos();
      return sendSuccess(res, ngos);
    } catch (err) {
      next(err);
    }
  }

  async createNgo(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await adminService.createNgo(req.body);
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  async deleteNgo(req: Request, res: Response, next: NextFunction) {
    try {
      const ngoId = Number(req.params.id);
      const result = await adminService.softDeleteNgo(req.user!.id, ngoId);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async listCitizens(req: Request, res: Response, next: NextFunction) {
    try {
      const { verificationStatus, search } = req.query;
      const page = Math.max(0, Number(req.query.page) || 0);
      const size = Math.min(100, Math.max(1, Number(req.query.size) || 20));

      const result = await adminService.listCitizens(
        { verificationStatus: verificationStatus as string, search: search as string },
        page,
        size
      );
      return sendSuccess(res, result.items, 200, { page, size, total: result.total });
    } catch (err) {
      next(err);
    }
  }

  async verifyCitizen(req: Request, res: Response, next: NextFunction) {
    try {
      const citizenId = Number(req.params.id);
      const { note } = req.body;
      const result = await adminService.verifyCitizen(req.user!.id, citizenId, note);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async suspendCitizen(req: Request, res: Response, next: NextFunction) {
    try {
      const citizenId = Number(req.params.id);
      const { note } = req.body;
      const result = await adminService.suspendCitizen(req.user!.id, citizenId, note);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async reactivateCitizen(req: Request, res: Response, next: NextFunction) {
    try {
      const citizenId = Number(req.params.id);
      const result = await adminService.reactivateCitizen(req.user!.id, citizenId);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async getAuditLog(req: Request, res: Response, next: NextFunction) {
    try {
      const page = Math.max(0, Number(req.query.page) || 0);
      const size = Math.min(100, Math.max(1, Number(req.query.size) || 20));
      const { items, total } = await adminService.getAuditLog(page, size);
      return sendSuccess(res, items, 200, { page, size, total });
    } catch (err) {
      next(err);
    }
  }

  async grantReward(req: Request, res: Response, next: NextFunction) {
    try {
      const { userId, points, reason, requestId } = req.body;
      const result = await rewardService.manualGrantOrDeduct(
        req.user!.id,
        userId,
        points,
        reason,
        requestId
      );
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const adminController = new AdminController();
