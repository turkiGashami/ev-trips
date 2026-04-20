import { apiClient } from './client';

export const usersApi = {
  getPublicProfile: (username: string) =>
    apiClient.get(`/users/${username}/profile`),

  updateProfile: (data: any) =>
    apiClient.patch('/users/me', data),

  uploadAvatar: (formData: FormData) =>
    apiClient.post('/users/me/avatar', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteAccount: () =>
    apiClient.delete('/users/me'),

  getMyStats: () =>
    apiClient.get('/users/me/stats'),

  getMySavedTrips: (params?: any) =>
    apiClient.get('/users/me/saved-trips', { params }),

  followUser: (userId: string) =>
    apiClient.post(`/users/${userId}/follow`),

  unfollowUser: (userId: string) =>
    apiClient.delete(`/users/${userId}/follow`),

  getFollowers: (userId: string, params?: any) =>
    apiClient.get(`/users/${userId}/followers`, { params }),

  getFollowing: (userId: string, params?: any) =>
    apiClient.get(`/users/${userId}/following`, { params }),

  getUserTrips: (username: string, params?: any) =>
    apiClient.get(`/users/${username}/trips`, { params }),
};
