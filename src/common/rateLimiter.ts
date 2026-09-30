import { Request, Response, NextFunction } from 'express';
import { AppError } from './errors';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

export function createRateLimiter(options: {
  windowMs: number;
  maxRequests: number;
  message?: string;
  keyGenerator?: (req: Request) => string;
}) {
  const store: RateLimitStore = {};

  // Clean expired buckets every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const key in store) {
      if (store[key].resetTime <= now) {
        delete store[key];
      }
    }
  }, 5 * 60 * 1000).unref();

  return (req: Request, res: Response, next: NextFunction) => {
    const now = Date.now();
    const key = options.keyGenerator ? options.keyGenerator(req) : (req.ip || 'anonymous');

    if (!store[key] || store[key].resetTime <= now) {
      store[key] = {
        count: 1,
        resetTime: now + options.windowMs,
      };
      return next();
    }

    store[key].count++;

    if (store[key].count > options.maxRequests) {
      const retryAfterSeconds = Math.ceil((store[key].resetTime - now) / 1000);
      res.setHeader('Retry-After', retryAfterSeconds);
      return next(
        AppError.rateLimit(
          options.message || `Rate limit exceeded. Please retry in ${retryAfterSeconds} seconds.`
        )
      );
    }

    next();
  };
}
