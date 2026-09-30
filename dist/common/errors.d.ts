export type ErrorCode = 'VALIDATION_FAILED' | 'UNAUTHENTICATED' | 'FORBIDDEN' | 'NOT_FOUND' | 'PHONE_NOT_ALLOWED' | 'ILLEGAL_TRANSITION' | 'DAILY_CLAIM_LIMIT_REACHED' | 'CONCURRENT_CLAIM_LIMIT_REACHED' | 'ALREADY_CLAIMED' | 'PROOF_PHOTOS_REQUIRED' | 'BUDGET_EXCEEDED' | 'RATE_LIMIT_EXCEEDED' | 'INTERNAL_SERVER_ERROR' | 'CONFLICT' | 'SEMANTIC_FAILURE' | 'INVALID_OTP' | 'OTP_EXPIRED' | 'USER_SUSPENDED' | 'INVALID_CREDENTIALS';
export declare class AppError extends Error {
    readonly statusCode: number;
    readonly code: ErrorCode;
    readonly details: any[];
    constructor(statusCode: number, code: ErrorCode, message: string, details?: any[]);
    static badRequest(message: string, code?: ErrorCode, details?: any[]): AppError;
    static unauthenticated(message?: string, code?: ErrorCode): AppError;
    static forbidden(message?: string, code?: ErrorCode): AppError;
    static notFound(message?: string, code?: ErrorCode): AppError;
    static conflict(message: string, code?: ErrorCode): AppError;
    static unprocessable(message: string, code?: ErrorCode): AppError;
    static rateLimit(message?: string, code?: ErrorCode): AppError;
    static internal(message?: string, code?: ErrorCode): AppError;
}
