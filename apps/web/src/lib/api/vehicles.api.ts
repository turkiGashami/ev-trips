import { apiClient } from './client';

export const vehiclesApi = {
  getMyVehicles: () =>
    apiClient.get('/vehicles'),

  createVehicle: (data: any) =>
    apiClient.post('/vehicles', data),

  updateVehicle: (id: string, data: any) =>
    apiClient.patch(`/vehicles/${id}`, data),

  deleteVehicle: (id: string) =>
    apiClient.delete(`/vehicles/${id}`),

  setDefault: (id: string) =>
    apiClient.patch(`/vehicles/${id}/default`),
};
