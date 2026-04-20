import { apiClient } from './client';
import { User, AuthTokens } from '../../types';

interface AuthResponse {
  user: User;
  tokens: AuthTokens;
}

export const authApi = {
  register: (data: {
    full_name: string;
    username: string;
    email: string;
    password: string;
    confirm_password: string;
    country: string;
  }) => apiClient.post<{ data: AuthResponse }>('/auth/register', data),

  login: (email: string, password: string) =>
    apiClient.post<{ data: AuthResponse }>('/auth/login', { email, password }),

  logout: () => apiClient.post('/auth/logout'),

  refresh: (refreshToken: string) =>
    apiClient.post<{ data: AuthTokens }>('/auth/refresh', { refreshToken }),

  verifyEmail: (token: string) =>
    apiClient.post('/auth/verify-email', { token }),

  resendVerification: () =>
    apiClient.post('/auth/resend-verification'),

  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),

  resetPassword: (token: string, password: string) =>
    apiClient.post('/auth/reset-password', { token, password }),

  changePassword: (currentPassword: string, newPassword: string) =>
    apiClient.patch('/auth/change-password', { currentPassword, newPassword }),

  getMe: () => apiClient.get<{ data: User }>('/auth/me'),
};
