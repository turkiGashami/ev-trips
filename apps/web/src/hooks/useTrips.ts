'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tripsApi, SearchTripsParams } from '../lib/api/trips.api';

export const tripKeys = {
  all: ['trips'] as const,
  list: (params: SearchTripsParams) => ['trips', 'list', params] as const,
  detail: (slug: string) => ['trips', 'detail', slug] as const,
  my: (params?: any) => ['trips', 'my', params] as const,
  insights: (from: string, to: string) => ['trips', 'insights', from, to] as const,
};

export function useTrips(params: SearchTripsParams) {
  return useQuery({
    queryKey: tripKeys.list(params),
    queryFn: () => tripsApi.search(params).then((r) => r.data.data),
  });
}

export function useTrip(slug: string) {
  return useQuery({
    queryKey: tripKeys.detail(slug),
    queryFn: () => tripsApi.getTrip(slug).then((r) => r.data.data),
    enabled: !!slug,
  });
}

export function useMyTrips(params?: any) {
  return useQuery({
    queryKey: tripKeys.my(params),
    queryFn: () => tripsApi.getMyTrips(params).then((r) => r.data),
  });
}

export function useRouteInsights(from: string, to: string) {
  return useQuery({
    queryKey: tripKeys.insights(from, to),
    queryFn: () => tripsApi.getRouteInsights(from, to).then((r) => r.data.data),
    enabled: !!from && !!to,
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => tripsApi.createTrip(data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: tripKeys.all }),
  });
}

export function useUpdateTrip(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => tripsApi.updateTrip(id, data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: tripKeys.all }),
  });
}

export function useDeleteTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tripsApi.deleteTrip(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: tripKeys.all }),
  });
}

export function useSubmitTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => tripsApi.submitTrip(id).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: tripKeys.all }),
  });
}

export function useAddFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tripId: string) => tripsApi.addFavorite(tripId),
    onSuccess: () => qc.invalidateQueries({ queryKey: tripKeys.all }),
  });
}

export function useRemoveFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (tripId: string) => tripsApi.removeFavorite(tripId),
    onSuccess: () => qc.invalidateQueries({ queryKey: tripKeys.all }),
  });
}

export function useReactToTrip() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ tripId, type }: { tripId: string; type: 'helpful' | 'not_helpful' }) =>
      tripsApi.react(tripId, type),
    onSuccess: () => qc.invalidateQueries({ queryKey: tripKeys.all }),
  });
}
