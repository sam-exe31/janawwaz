import { Request, Response, NextFunction } from 'express';
export declare class NgoController {
    getMe(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    updateMe(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getOpenRequests(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getRequestById(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    claim(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    reject(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    listClaims(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getHelperSuggestions(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    assignHelper(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    startWork(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    attachPhoto(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    completeWork(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    abandonClaim(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getHeatMap(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getHistory(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getStats(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    listHelpers(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    createHelper(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    updateHelper(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    deleteHelper(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const ngoController: NgoController;
