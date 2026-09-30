import { Request, Response, NextFunction } from 'express';
import fs from 'fs';
import { storageService } from './storageService';
import { sendSuccess } from '../common/response';
import { AppError } from '../common/errors';

export class UploadController {
  async handleUpload(req: Request, res: Response, next: NextFunction) {
    try {
      const files = req.files as Express.Multer.File[];
      if (!files || files.length === 0) {
        throw AppError.badRequest('At least one file must be provided in the "files" field');
      }

      if (files.length > 5) {
        throw AppError.badRequest('Maximum 5 files can be uploaded per request');
      }

      const results = [];
      for (const file of files) {
        const metadata = await storageService.saveFile(file.buffer, file.originalname);
        results.push(metadata);
      }

      return sendSuccess(res, results, 201);
    } catch (err) {
      next(err);
    }
  }

  async getFile(req: Request, res: Response, next: NextFunction) {
    try {
      const filename = String(req.params.filename);
      const filePath = storageService.getFilePath(filename);

      if (!fs.existsSync(filePath)) {
        throw AppError.notFound('Requested file does not exist');
      }

      return res.sendFile(filePath);
    } catch (err) {
      next(err);
    }
  }
}

export const uploadController = new UploadController();
