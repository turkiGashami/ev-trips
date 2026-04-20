import { apiClient } from './client';

export const lookupApi = {
  getBrands: () =>
    apiClient.get('/lookup/brands'),

  getModels: (brandId: string) =>
    apiClient.get(`/lookup/brands/${brandId}/models`),

  getTrims: (modelId: string) =>
    apiClient.get(`/lookup/models/${modelId}/trims`),

  getCities: (q?: string) =>
    apiClient.get('/lookup/cities', { params: q ? { q } : undefined }),

  getChargingStations: (params?: any) =>
    apiClient.get('/lookup/charging-stations', { params }),

  getProviders: () =>
    apiClient.get('/lookup/providers'),

  getEnums: () =>
    apiClient.get('/lookup/enums'),
};
