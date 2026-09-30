import { Response } from 'express';
export interface PaginationMeta {
    page: number;
    size: number;
    total: number;
}
export interface ApiResponse<T = any> {
    success: boolean;
    data?: T;
    meta?: PaginationMeta;
    error?: {
        code: string;
        message: string;
        details: any[];
    };
}
export declare function sendSuccess<T>(res: Response, data: T, statusCode?: number, meta?: PaginationMeta): Response;
export declare function sendError(res: Response, statusCode: number, code: string, message: string, details?: any[]): Response;
