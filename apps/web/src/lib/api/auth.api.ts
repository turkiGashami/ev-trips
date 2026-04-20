import { apiClient } from './client';

export interface RegisterPayload {
  full_name: string;
  username: string;
  email: string;
  password: string;
  confirm_password: string;
  country?: string;
  city_id?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface AuthResponse {
  user: any;
  tokens: AuthTokens;
}

export const authApi = {
  register: (data: RegisterPayload) =>
    apiClient.post<{ data: AuthResponse }>('/auth/register', data),

  login: (data: LoginPayload) =>
    apiClient.post<{ data: AuthResponse }>('/auth/login', data),

  logout: () =>
    apiClient.post('/auth/logout'),

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

  getMe: () =>
    apiClient.get<{ data: any }>('/auth/me'),
};

// Named function exports for pages that import them directly
export const forgotPassword = (email: string) => authApi.forgotPassword(email);
export const resetPassword = (token: string, password: string) => authApi.resetPassword(token, password);
export const verifyEmail = (token: string) => authApi.verifyEmail(token);
export const resendVerification = () => authApi.resendVerification();
