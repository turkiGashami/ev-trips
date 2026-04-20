import { apiClient } from './client';

export const lookupApi = {
  getBrands: () => apiClient.get('/lookup/brands'),
  getModels: (brandId: string) => apiClient.get(`/lookup/models?brand_id=${brandId}`),
  getTrims: (modelId: string) => apiClient.get(`/lookup/trims?model_id=${modelId}`),
  getCities: () => apiClient.get('/lookup/cities'),
  getChargingStations: (params?: { city?: string; lat?: number; lng?: number }) =>
    apiClient.get('/lookup/charging-stations', { params }),
};
