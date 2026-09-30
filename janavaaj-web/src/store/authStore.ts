import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser, UserRole } from '../lib/roles';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: AuthUser | null;
  isAuthenticated: boolean;
  setAuth: (payload: { accessToken: string; refreshToken: string; user: AuthUser }) => void;
  setAccessToken: (accessToken: string) => void;
  setUser: (user: AuthUser) => void;
  switchRole: (role: UserRole) => void;
  clearAuth: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: {
        id: 1,
        name: 'Vedant Kulkarni',
        email: 'vedant@janavaaj.org',
        phone: '+91 98220 12345',
        role: 'CITIZEN',
        status: 'ACTIVE',
        verificationStatus: 'VERIFIED',
        rewardsBalance: 450,
      },
      isAuthenticated: true,
      setAuth: ({ accessToken, refreshToken, user }) =>
        set({ accessToken, refreshToken, user, isAuthenticated: true }),
      setAccessToken: (accessToken) => set({ accessToken }),
      setUser: (user) => set({ user }),
      switchRole: (role) =>
        set((state) => ({
          user: {
            id: state.user?.id || 1,
            name:
              role === 'CITIZEN'
                ? 'Vedant Kulkarni'
                : role === 'NGO'
                ? 'Swachh Pune Foundation'
                : 'District Magistrate / Collector (Pune)',
            email: `${role.toLowerCase()}@janavaaj.org`,
            phone: state.user?.phone || '+91 98220 12345',
            role,
            status: 'ACTIVE',
            verificationStatus: 'VERIFIED',
            rewardsBalance: 450,
          },
          isAuthenticated: true,
        })),
      clearAuth: () =>
        set({ accessToken: null, refreshToken: null, user: null, isAuthenticated: false }),
    }),
    {
      name: 'janavaaj-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

