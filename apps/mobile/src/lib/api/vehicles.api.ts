import { apiClient } from './client';

export const vehiclesApi = {
  getMy: () => apiClient.get('/vehicles/my'),

  getOne: (id: string) => apiClient.get(`/vehicles/${id}`),

  create: (data: {
    brand_id: string;
    model_id: string;
    trim_id?: string;
    year: number;
    custom_name?: string;
    is_default?: boolean;
  }) => apiClient.post('/vehicles', data),

  update: (id: string, data: Partial<{
    trim_id: string;
    year: number;
    custom_name: string;
    is_default: boolean;
  }>) => apiClient.patch(`/vehicles/${id}`, data),

  delete: (id: string) => apiClient.delete(`/vehicles/${id}`),

  setDefault: (id: string) => apiClient.patch(`/vehicles/${id}/default`),
};
