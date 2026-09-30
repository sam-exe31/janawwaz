import { Request, Response, NextFunction } from 'express';
import { Role } from './types';
export declare function authenticate(req: Request, res: Response, next: NextFunction): Promise<void>;
export declare function requireRole(...allowedRoles: Role[]): (req: Request, res: Response, next: NextFunction) => void;
export declare function requireNotSuspended(req: Request, res: Response, next: NextFunction): void;
export declare function requireVolunteer(req: Request, res: Response, next: NextFunction): void;
