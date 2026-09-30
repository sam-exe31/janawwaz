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

export function sendSuccess<T>(res: Response, data: T, statusCode: number = 200, meta?: PaginationMeta): Response {
  const payload: ApiResponse<T> = {
    success: true,
    data,
    ...(meta ? { meta } : {}),
  };
  return res.status(statusCode).json(payload);
}

export function sendError(res: Response, statusCode: number, code: string, message: string, details: any[] = []): Response {
  const payload: ApiResponse = {
    success: false,
    error: {
      code,
      message,
      details,
    },
  };
  return res.status(statusCode).json(payload);
}
