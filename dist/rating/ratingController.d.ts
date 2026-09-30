import { Request, Response, NextFunction } from 'express';
export declare class RatingController {
    submitRating(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
    getRating(req: Request, res: Response, next: NextFunction): Promise<Response<any, Record<string, any>> | undefined>;
}
export declare const ratingController: RatingController;
