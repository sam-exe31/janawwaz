import { useMutation, useQueryClient } from '@tanstack/react-query';
import { authApi, userApi } from '../api/endpoints';
import { useAuthStore } from '../store/authStore';
import type { AuthResponse } from '../api/types';

export function useRequestOtp() {
  return useMutation({
    mutationFn: (phone: string) => authApi.requestOtp(phone),
  });
}

function useApplyAuth() {
  const setAuth = useAuthStore((s) => s.setAuth);
  const qc = useQueryClient();
  return (data: AuthResponse) => {
    setAuth({ accessToken: data.accessToken, refreshToken: data.refreshToken, user: data.user });
    qc.invalidateQueries();
  };
}

export function useVerifyOtp() {
  const apply = useApplyAuth();
  return useMutation({
    mutationFn: ({ phone, code }: { phone: string; code: string }) =>
      authApi.verifyOtp(phone, code),
    onSuccess: apply,
  });
}

export function useLogin() {
  const apply = useApplyAuth();
  return useMutation({
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: apply,
  });
}

export function useRegisterCitizen() {
  const apply = useApplyAuth();
  return useMutation({
    mutationFn: (data: { name: string; email?: string; phone?: string; password?: string }) =>
      authApi.registerCitizen(data),
    onSuccess: apply,
  });
}

export function useRegisterNgo() {
  const apply = useApplyAuth();
  return useMutation({
    mutationFn: (data: { name: string; email: string; phone?: string; registrationNumber: string; description?: string; password?: string }) =>
      authApi.registerNgo(data),
    onSuccess: apply,
  });
}

export function useLogout() {
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const rt = useAuthStore.getState().refreshToken;
      try {
        await authApi.logout(rt);
      } catch {
        /* ignore network/logout errors */
      }
    },
    onSettled: () => {
      clearAuth();
      qc.clear();
    },
  });
}

export function useRefreshMe() {
  const setUser = useAuthStore((s) => s.setUser);
  return useMutation({
    mutationFn: () => userApi.me(),
    onSuccess: (user) => setUser(user),
  });
}
