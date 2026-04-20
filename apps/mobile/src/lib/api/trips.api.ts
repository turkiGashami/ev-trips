import { apiClient } from './client';
import { Trip, PaginatedResponse, RouteInsights } from '../../types';

export const tripsApi = {
  search: (params: Record<string, any>) =>
    apiClient.get<PaginatedResponse<Trip>>('/trips', { params }),

  getMyTrips: (params?: Record<string, any>) =>
    apiClient.get<PaginatedResponse<Trip>>('/trips/my', { params }),

  getTrip: (slug: string) =>
    apiClient.get<{ data: Trip }>(`/trips/${slug}`),

  getRouteInsights: (from: string, to: string) =>
    apiClient.get<{ data: RouteInsights }>('/trips/route-insights', {
      params: { from, to },
    }),

  createTrip: (data: Partial<Trip>) =>
    apiClient.post<{ data: Trip }>('/trips', data),

  updateTrip: (id: string, data: Partial<Trip>) =>
    apiClient.patch<{ data: Trip }>(`/trips/${id}`, data),

  submitTrip: (id: string) =>
    apiClient.post<{ data: Trip }>(`/trips/${id}/submit`),

  deleteTrip: (id: string) => apiClient.delete(`/trips/${id}`),

  addFavorite: (tripId: string) => apiClient.post(`/trips/${tripId}/favorite`),
  removeFavorite: (tripId: string) => apiClient.delete(`/trips/${tripId}/favorite`),
  react: (tripId: string, type: 'helpful' | 'not_helpful') =>
    apiClient.post(`/trips/${tripId}/react`, { reactionType: type }),

  incrementView: (tripId: string) => apiClient.post(`/trips/${tripId}/view`),

  addStop: (tripId: string, data: any) =>
    apiClient.post(`/trips/${tripId}/stops`, data),

  uploadMedia: (tripId: string, formData: FormData) =>
    apiClient.post(`/trips/${tripId}/media`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),
};
