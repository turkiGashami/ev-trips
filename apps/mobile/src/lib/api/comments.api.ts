import { apiClient } from './client';

export const commentsApi = {
  getTripComments: (tripId: string, params?: { page?: number; limit?: number }) =>
    apiClient.get(`/trips/${tripId}/comments`, { params }),

  create: (tripId: string, body: string, parent_id?: string) =>
    apiClient.post(`/trips/${tripId}/comments`, { body, parent_id }),

  delete: (tripId: string, commentId: string) =>
    apiClient.delete(`/trips/${tripId}/comments/${commentId}`),

  report: (tripId: string, commentId: string, reason: string) =>
    apiClient.post(`/trips/${tripId}/comments/${commentId}/report`, { reason }),
};
