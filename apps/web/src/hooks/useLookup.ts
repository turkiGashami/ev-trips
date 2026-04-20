'use client';

import { useQuery } from '@tanstack/react-query';
import { lookupApi } from '../lib/api/lookup.api';

export function useBrands() {
  return useQuery({
    queryKey: ['lookup', 'brands'],
    queryFn: () => lookupApi.getBrands().then((r) => r.data.data),
    staleTime: 10 * 60 * 1000,
  });
}

export function useModels(brandId?: string) {
  return useQuery({
    queryKey: ['lookup', 'models', brandId],
    queryFn: () => lookupApi.getModels(brandId!).then((r) => r.data.data),
    enabled: !!brandId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useTrims(modelId?: string) {
  return useQuery({
    queryKey: ['lookup', 'trims', modelId],
    queryFn: () => lookupApi.getTrims(modelId!).then((r) => r.data.data),
    enabled: !!modelId,
    staleTime: 10 * 60 * 1000,
  });
}

export function useCities() {
  return useQuery({
    queryKey: ['lookup', 'cities'],
    queryFn: () => lookupApi.getCities().then((r) => r.data.data),
    staleTime: 30 * 60 * 1000,
  });
}

export function useSearchCities(q: string) {
  return useQuery({
    queryKey: ['lookup', 'cities', 'search', q],
    queryFn: () => lookupApi.getCities(q).then((r) => r.data.data ?? r.data),
    enabled: q.length >= 1,
    staleTime: 60 * 1000,
  });
}

export function useChargingStations(params?: any) {
  return useQuery({
    queryKey: ['lookup', 'charging-stations', params],
    queryFn: () => lookupApi.getChargingStations(params).then((r) => r.data.data),
    staleTime: 5 * 60 * 1000,
  });
}
