import { Request, Response, NextFunction } from 'express';
export declare class VolunteerController {
    getRequests(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    recordAction(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    applyVerification(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getVerificationStatus(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const volunteerController: VolunteerController;
