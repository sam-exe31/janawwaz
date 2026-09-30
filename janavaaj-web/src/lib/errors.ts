import { ApiError } from '../api/client';

/** Extract a human-readable message from any thrown value (ApiError, Error, or unknown). */
export function getErrorMessage(e: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (e instanceof ApiError) return e.message;
  if (e instanceof Error) return e.message;
  if (typeof e === 'string') return e;
  return fallback;
}
