import { Request, Response, NextFunction } from 'express';
export declare class UploadController {
    handleUpload(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getFile(req: Request, res: Response, next: NextFunction): Promise<void>;
}
export declare const uploadController: UploadController;
