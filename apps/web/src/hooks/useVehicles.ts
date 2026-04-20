'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { vehiclesApi } from '../lib/api/vehicles.api';

export function useMyVehicles() {
  return useQuery({
    queryKey: ['vehicles', 'my'],
    queryFn: () => vehiclesApi.getMyVehicles().then((r) => r.data.data),
  });
}

export function useCreateVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => vehiclesApi.createVehicle(data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });
}

export function useUpdateVehicle(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => vehiclesApi.updateVehicle(id, data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });
}

export function useDeleteVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehiclesApi.deleteVehicle(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });
}

export function useSetDefaultVehicle() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => vehiclesApi.setDefault(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['vehicles'] }),
  });
}
