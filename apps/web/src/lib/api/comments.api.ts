import { apiClient } from './client';

export const commentsApi = {
  getTripComments: (tripId: string, params?: any) =>
    apiClient.get(`/trips/${tripId}/comments`, { params }),

  createComment: (tripId: string, data: { content: string }) =>
    apiClient.post(`/trips/${tripId}/comments`, data),

  replyToComment: (commentId: string, data: { content: string }) =>
    apiClient.post(`/comments/${commentId}/replies`, data),

  deleteComment: (commentId: string) =>
    apiClient.delete(`/comments/${commentId}`),

  reportComment: (commentId: string, data: { type: string; reason?: string }) =>
    apiClient.post(`/reports`, { target_type: 'comment', target_id: commentId, ...data }),
};
