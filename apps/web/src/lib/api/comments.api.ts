import { apiClient } from './client';

// Matches apps/api/src/modules/comments/comments.controller.ts:
//   GET    /comments/trip/:tripId
//   POST   /comments               body: { trip_id, content, parent_id? }
//   DELETE /comments/:id
export const commentsApi = {
  getTripComments: (tripId: string, params?: any) =>
    apiClient.get(`/comments/trip/${tripId}`, { params }),

  createComment: (tripId: string, data: { content: string }) =>
    apiClient.post(`/comments`, { trip_id: tripId, content: data.content }),

  replyToComment: (commentId: string, tripId: string, data: { content: string }) =>
    apiClient.post(`/comments`, {
      trip_id: tripId,
      parent_id: commentId,
      content: data.content,
    }),

  deleteComment: (commentId: string) => apiClient.delete(`/comments/${commentId}`),

  reportComment: (commentId: string, data: { type: string; reason?: string }) =>
    apiClient.post(`/reports`, {
      target_type: 'comment',
      target_id: commentId,
      ...data,
    }),
};
