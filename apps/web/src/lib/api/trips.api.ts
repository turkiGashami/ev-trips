import { apiClient } from './client';

export interface SearchTripsParams {
  q?: string;
  from_city_id?: string;
  to_city_id?: string;
  brand_id?: string;
  model_id?: string;
  trim_id?: string;
  year?: number;
  date_from?: string;
  date_to?: string;
  min_departure_battery?: number;
  max_departure_battery?: number;
  min_arrival_battery?: number;
  weather_condition?: string;
  ac_usage?: string;
  luggage_level?: string;
  driving_style?: string;
  passengers_count?: number;
  is_featured?: boolean;
  sort_by?: string;
  sort_order?: 'ASC' | 'DESC';
  page?: number;
  limit?: number;
}

export const tripsApi = {
  search: (params: SearchTripsParams) =>
    apiClient.get('/trips', { params }),

  getRouteInsights: (from: string, to: string, extra?: Record<string, any>) =>
    apiClient.get('/trips/route-insights', { params: { from, to, ...extra } }),

  getMyTrips: (params?: any) =>
    apiClient.get('/trips/my', { params }),

  getTrip: (slug: string) =>
    apiClient.get(`/trips/${slug}`),

  createTrip: (data: any) =>
    apiClient.post('/trips', data),

  updateTrip: (id: string, data: any) =>
    apiClient.patch(`/trips/${id}`, data),

  deleteTrip: (id: string) =>
    apiClient.delete(`/trips/${id}`),

  submitTrip: (id: string) =>
    apiClient.post(`/trips/${id}/submit`),

  archiveTrip: (id: string) =>
    apiClient.post(`/trips/${id}/archive`),

  duplicateTrip: (id: string) =>
    apiClient.post(`/trips/${id}/duplicate`),

  incrementView: (id: string) =>
    apiClient.post(`/trips/${id}/view`),

  // Stops
  addStop: (tripId: string, data: any) =>
    apiClient.post(`/trips/${tripId}/stops`, data),

  updateStop: (tripId: string, stopId: string, data: any) =>
    apiClient.patch(`/trips/${tripId}/stops/${stopId}`, data),

  deleteStop: (tripId: string, stopId: string) =>
    apiClient.delete(`/trips/${tripId}/stops/${stopId}`),

  // Media
  uploadMedia: (tripId: string, formData: FormData) =>
    apiClient.post(`/trips/${tripId}/media`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  deleteMedia: (tripId: string, mediaId: string) =>
    apiClient.delete(`/trips/${tripId}/media/${mediaId}`),

  // Reactions & favorites
  getMyState: (tripId: string) =>
    apiClient.get(`/trips/${tripId}/me`),

  react: (tripId: string, reactionType: 'helpful' | 'not_helpful') =>
    apiClient.post(`/trips/${tripId}/react`, { reaction_type: reactionType }),

  removeReaction: (tripId: string) =>
    apiClient.delete(`/trips/${tripId}/react`),

  addFavorite: (tripId: string) =>
    apiClient.post(`/trips/${tripId}/favorite`),

  removeFavorite: (tripId: string) =>
    apiClient.delete(`/trips/${tripId}/favorite`),

  // Report
  reportTrip: (tripId: string, data: { type: string; reason?: string }) =>
    apiClient.post(`/trips/${tripId}/report`, data),
};
