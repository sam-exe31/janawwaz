import { Request, Response, NextFunction } from 'express';
import { authService } from './authService';
import { sendSuccess } from '../common/response';

export class AuthController {
  async requestOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone } = req.body;
      const ip = req.ip || req.socket.remoteAddress;
      const result = await authService.requestOtp(phone, ip);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async verifyOtp(req: Request, res: Response, next: NextFunction) {
    try {
      const { phone, code } = req.body;
      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const result = await authService.verifyOtp(phone, code, ip, userAgent);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async login(req: Request, res: Response, next: NextFunction) {
    try {
      const { email, password } = req.body;
      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const result = await authService.loginWithPassword(email, password, ip, userAgent);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async registerCitizen(req: Request, res: Response, next: NextFunction) {
    try {
      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const result = await authService.registerCitizen(req.body, ip, userAgent);
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  async registerNgo(req: Request, res: Response, next: NextFunction) {
    try {
      const ip = req.ip || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];
      const result = await authService.registerNgo(req.body, ip, userAgent);
      return sendSuccess(res, result, 201);
    } catch (err) {
      next(err);
    }
  }

  async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      const ip = req.ip || req.socket.remoteAddress;
      const result = await authService.refreshTokens(refreshToken, ip);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }

  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const { refreshToken } = req.body;
      if (refreshToken) {
        await authService.logout(refreshToken);
      }
      return sendSuccess(res, { success: true, message: 'Logged out successfully' });
    } catch (err) {
      next(err);
    }
  }

  async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      const { oldPassword, newPassword } = req.body;
      const userId = req.user!.id;
      const result = await authService.changePassword(userId, oldPassword, newPassword);
      return sendSuccess(res, result);
    } catch (err) {
      next(err);
    }
  }
}

export const authController = new AuthController();
