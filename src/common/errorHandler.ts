import { Request, Response, NextFunction } from 'express';
import { AppError } from './errors';
import { sendError } from './response';
import { ZodError } from 'zod';

export function errorHandler(err: any, req: Request, res: Response, next: NextFunction) {
  // Check if headers already sent
  if (res.headersSent) {
    return next(err);
  }

  // Handle known AppError
  if (err instanceof AppError) {
    return sendError(res, err.statusCode, err.code, err.message, err.details);
  }

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    const details = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    return sendError(res, 400, 'VALIDATION_FAILED', 'Validation failed on input', details);
  }

  // Handle MySQL duplicate entry error
  if (err.code === 'ER_DUP_ENTRY') {
    return sendError(res, 409, 'CONFLICT', 'A record with duplicate unique fields already exists.');
  }

  // Handle SyntaxError (JSON parse failure)
  if (err instanceof SyntaxError && 'body' in err) {
    return sendError(res, 400, 'VALIDATION_FAILED', 'Malformed JSON in request body');
  }

  // Fallback for unexpected errors: Log internally, never leak stack trace to client
  console.error('[Unhandled Error]', err);
  return sendError(res, 500, 'INTERNAL_SERVER_ERROR', 'An unexpected internal server error occurred.');
}
