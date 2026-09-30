import { Request, Response, NextFunction } from 'express';
export declare function createRateLimiter(options: {
    windowMs: number;
    maxRequests: number;
    message?: string;
    keyGenerator?: (req: Request) => string;
}): (req: Request, res: Response, next: NextFunction) => void;
