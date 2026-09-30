import { Request, Response, NextFunction } from 'express';
export declare class AdminController {
    getDashboard(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getProgress(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getRequests(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getRequestDetails(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    approve(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    markFake(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    setCategory(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    setBudget(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    close(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    release(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    takeOver(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    rejectProof(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    overrideStatus(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    listNgos(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    createNgo(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    deleteNgo(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    listCitizens(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    verifyCitizen(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    suspendCitizen(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    reactivateCitizen(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getAuditLog(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    grantReward(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const adminController: AdminController;
