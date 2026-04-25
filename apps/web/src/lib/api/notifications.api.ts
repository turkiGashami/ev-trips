import { apiClient } from './client';

export const notificationsApi = {
  getAll: (params?: { page?: number; limit?: number }) =>
    apiClient.get('/notifications', { params }),

  getUnreadCount: () => apiClient.get('/notifications/unread-count'),

  markRead: (id: string) =>
    apiClient.post(`/notifications/${id}/read`),

  markAllRead: () =>
    apiClient.post('/notifications/read-all'),

  getSettings: () =>
    apiClient.get('/notifications/settings'),

  updateSettings: (data: any) =>
    apiClient.patch('/notifications/settings', data),
};
