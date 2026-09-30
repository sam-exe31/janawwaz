import axios from 'axios';
import type { AxiosError, AxiosInstance, AxiosRequestConfig, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../store/authStore';
import type { ApiEnvelope, ApiErrorBody, PaginationMeta, RefreshResponse } from './types';

export const API_BASE = import.meta.env.VITE_API_BASE_URL || '/api/v1';

/** Normalized error thrown by all api helpers. */
export class ApiError extends Error {
  code: string;
  status: number;
  details: unknown[];
  constructor(message: string, code: string, status: number, details: unknown[] = []) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.status = status;
    this.details = details;
  }
}

export const http: AxiosInstance = axios.create({
  baseURL: API_BASE,
  // No default Content-Type: axios sets application/json for object bodies and
  // multipart/form-data (with boundary) for FormData bodies automatically.
});

/* Attach access token to every request. */
http.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.set('Authorization', `Bearer ${token}`);
  }
  return config;
});

/* ---- Single-flight token refresh ---- */
let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = useAuthStore.getState().refreshToken;
  if (!refreshToken) return null;
  try {
    const resp = await axios.post<ApiEnvelope<RefreshResponse>>(`${API_BASE}/auth/refresh`, {
      refreshToken,
    });
    const newToken = resp.data.data?.accessToken ?? null;
    if (newToken) {
      useAuthStore.getState().setAccessToken(newToken);
    }
    return newToken;
  } catch {
    return null;
  }
}

interface RetriableConfig extends AxiosRequestConfig {
  _retry?: boolean;
}

http.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiEnvelope<unknown>>) => {
    const original = error.config as (RetriableConfig & InternalAxiosRequestConfig) | undefined;
    const status = error.response?.status;
    const isAuthCall = original?.url?.includes('/auth/');

    // Attempt one refresh on 401 for non-auth endpoints.
    if (status === 401 && original && !original._retry && !isAuthCall) {
      original._retry = true;
      if (!refreshPromise) {
        refreshPromise = refreshAccessToken().finally(() => {
          refreshPromise = null;
        });
      }
      const newToken = await refreshPromise;
      if (newToken) {
        original.headers.set('Authorization', `Bearer ${newToken}`);
        return http(original);
      }
      // Refresh failed -> force logout.
      useAuthStore.getState().clearAuth();
    }

    return Promise.reject(normalizeError(error));
  }
);

function normalizeError(error: AxiosError<ApiEnvelope<unknown>>): ApiError {
  const body = error.response?.data?.error as ApiErrorBody | undefined;
  if (body) {
    return new ApiError(body.message, body.code, error.response?.status ?? 0, body.details ?? []);
  }
  if (error.code === 'ERR_NETWORK') {
    return new ApiError(
      'Cannot reach the server. Is the backend running on http://localhost:8080?',
      'NETWORK_ERROR',
      0
    );
  }
  return new ApiError(error.message || 'Unexpected error', 'UNKNOWN', error.response?.status ?? 0);
}

/* ---- Typed helpers that unwrap the envelope ---- */

export async function apiGet<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await http.get<ApiEnvelope<T>>(url, config);
  return res.data.data as T;
}

/** GET that also returns pagination meta. */
export async function apiGetPaged<T>(
  url: string,
  config?: AxiosRequestConfig
): Promise<{ items: T; meta: PaginationMeta | undefined }> {
  const res = await http.get<ApiEnvelope<T>>(url, config);
  return { items: res.data.data as T, meta: res.data.meta };
}

export async function apiPost<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await http.post<ApiEnvelope<T>>(url, body, config);
  return res.data.data as T;
}

export async function apiPut<T>(url: string, body?: unknown, config?: AxiosRequestConfig): Promise<T> {
  const res = await http.put<ApiEnvelope<T>>(url, body, config);
  return res.data.data as T;
}

export async function apiDelete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
  const res = await http.delete<ApiEnvelope<T>>(url, config);
  return res.data.data as T;
}
