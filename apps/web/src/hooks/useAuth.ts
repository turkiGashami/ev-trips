'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/auth.store';
import { authApi, LoginPayload, RegisterPayload } from '../lib/api/auth.api';

export function useAuth() {
  const router = useRouter();
  const { user, accessToken, isAuthenticated, setAuth, logout: clearAuth, updateUser } = useAuthStore();

  const login = useCallback(async (data: LoginPayload) => {
    const response = await authApi.login(data);
    const { user, tokens } = response.data.data;
    setAuth(user, tokens.accessToken, tokens.refreshToken);
    router.push('/dashboard');
    return user;
  }, [setAuth, router]);

  const register = useCallback(async (data: RegisterPayload) => {
    const response = await authApi.register(data);
    const { user, tokens } = response.data.data;
    setAuth(user, tokens.accessToken, tokens.refreshToken);
    router.push('/verify-email');
    return user;
  }, [setAuth, router]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // ignore
    } finally {
      clearAuth();
      router.push('/login');
    }
  }, [clearAuth, router]);

  const refreshUser = useCallback(async () => {
    const response = await authApi.getMe();
    updateUser(response.data.data);
  }, [updateUser]);

  return {
    user,
    accessToken,
    isAuthenticated,
    isEmailVerified: !!user?.email_verified_at,
    isAdmin: user?.role === 'admin' || user?.role === 'super_admin',
    isModerator: ['moderator', 'admin', 'super_admin'].includes(user?.role ?? ''),
    login,
    register,
    logout,
    refreshUser,
  };
}
