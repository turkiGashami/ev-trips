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

  createCity: (name_ar: string, name?: string) =>
    apiClient.post('/lookup/cities', { name_ar, ...(name ? { name } : {}) }),

  createBrand: (name: string) =>
    apiClient.post('/lookup/brands', { name }),
  createModel: (brandId: string, name: string) =>
    apiClient.post(`/lookup/brands/${brandId}/models`, { name }),
  createTrim: (modelId: string, name: string) =>
    apiClient.post(`/lookup/models/${modelId}/trims`, { name }),

  getChargingStations: (params?: any) =>
    apiClient.get('/lookup/charging-stations', { params }),

  getProviders: () =>
    apiClient.get('/lookup/providers'),

  getEnums: () =>
    apiClient.get('/lookup/enums'),
};
