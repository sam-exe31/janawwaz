export type ErrorCode =
  | 'VALIDATION_FAILED'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'NOT_FOUND'
  | 'PHONE_NOT_ALLOWED'
  | 'ILLEGAL_TRANSITION'
  | 'DAILY_CLAIM_LIMIT_REACHED'
  | 'CONCURRENT_CLAIM_LIMIT_REACHED'
  | 'ALREADY_CLAIMED'
  | 'PROOF_PHOTOS_REQUIRED'
  | 'BUDGET_EXCEEDED'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_SERVER_ERROR'
  | 'CONFLICT'
  | 'SEMANTIC_FAILURE'
  | 'INVALID_OTP'
  | 'OTP_EXPIRED'
  | 'USER_SUSPENDED'
  | 'INVALID_CREDENTIALS';

export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: ErrorCode;
  public readonly details: any[];

  constructor(statusCode: number, code: ErrorCode, message: string, details: any[] = []) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    Object.setPrototypeOf(this, new.target.prototype);
  }

  static badRequest(message: string, code: ErrorCode = 'VALIDATION_FAILED', details: any[] = []) {
    return new AppError(400, code, message, details);
  }

  static unauthenticated(message: string = 'Authentication required', code: ErrorCode = 'UNAUTHENTICATED') {
    return new AppError(401, code, message);
  }

  static forbidden(message: string = 'Access denied', code: ErrorCode = 'FORBIDDEN') {
    return new AppError(403, code, message);
  }

  static notFound(message: string = 'Resource not found', code: ErrorCode = 'NOT_FOUND') {
    return new AppError(404, code, message);
  }

  static conflict(message: string, code: ErrorCode = 'CONFLICT') {
    return new AppError(409, code, message);
  }

  static unprocessable(message: string, code: ErrorCode = 'SEMANTIC_FAILURE') {
    return new AppError(422, code, message);
  }

  static rateLimit(message: string = 'Rate limit exceeded', code: ErrorCode = 'RATE_LIMIT_EXCEEDED') {
    return new AppError(429, code, message);
  }

  static internal(message: string = 'Internal server error', code: ErrorCode = 'INTERNAL_SERVER_ERROR') {
    return new AppError(500, code, message);
  }
}
