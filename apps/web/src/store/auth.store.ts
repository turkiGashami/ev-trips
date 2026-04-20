'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { tokenStorage } from '../lib/api/client';

export interface AuthUser {
  id: string;
  email: string;
  username: string;
  full_name: string;
  avatar_url?: string;
  role: string;
  status: string;
  email_verified_at?: string;
  is_contributor_verified: boolean;
  contributor_points: number;
}

interface AuthState {
  user: AuthUser | null;
  accessToken: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  hasHydrated: boolean;

  setAuth: (user: AuthUser, accessToken: string, refreshToken: string) => void;
  updateUser: (user: Partial<AuthUser>) => void;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setHasHydrated: (v: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      refreshToken: null,
      isAuthenticated: false,
      hasHydrated: false,

      setAuth: (user, accessToken, refreshToken) => {
        tokenStorage.setTokens(accessToken, refreshToken);
        set({ user, accessToken, refreshToken, isAuthenticated: true });
      },

      updateUser: (updates) =>
        set((state) => ({
          user: state.user ? { ...state.user, ...updates } : null,
        })),

      setTokens: (accessToken, refreshToken) => {
        tokenStorage.setTokens(accessToken, refreshToken);
        set({ accessToken, refreshToken });
      },

      setHasHydrated: (v) => set({ hasHydrated: v }),

      logout: () => {
        tokenStorage.clearTokens();
        set({ user: null, accessToken: null, refreshToken: null, isAuthenticated: false });
      },
    }),
    {
      name: 'ev-trips-auth',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user,
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
      onRehydrateStorage: () => (state) => {
        // Mirror tokens into tokenStorage so the axios interceptor can read them
        // even if login happened in a different tab or before this module loaded.
        if (state?.accessToken && state?.refreshToken) {
          tokenStorage.setTokens(state.accessToken, state.refreshToken);
        }
        state?.setHasHydrated(true);
      },
    },
  ),
);
