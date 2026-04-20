import { apiClient } from './client';

export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number; unread_only?: boolean }) =>
    apiClient.get('/notifications', { params }),

  markRead: (id: string) =>
    apiClient.patch(`/notifications/${id}/read`),

  markAllRead: () =>
    apiClient.patch('/notifications/read-all'),

  getSettings: () =>
    apiClient.get('/notifications/settings'),

  updateSettings: (data: Record<string, boolean>) =>
    apiClient.put('/notifications/settings', data),
};
