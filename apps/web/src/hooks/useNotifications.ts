'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { notificationsApi } from '../lib/api/notifications.api';
import { useAuthStore } from '../store/auth.store';

export function useNotifications(params?: any) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['notifications', params],
    queryFn: () => notificationsApi.getAll(params).then((r) => r.data),
    enabled: isAuthenticated,
    refetchInterval: 30_000, // poll every 30s
  });
}

export function useUnreadNotificationsCount() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  return useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => notificationsApi.getUnreadCount().then((r) => {
      const body = r.data?.data ?? r.data;
      return Number(body?.count ?? body ?? 0) || 0;
    }),
    enabled: isAuthenticated,
    refetchInterval: 30_000,
    staleTime: 15_000,
  });
}

export function useMarkRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notificationsApi.markRead(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

export function useMarkAllRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => notificationsApi.markAllRead(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['notifications', 'unread-count'] });
    },
  });
}

export function useNotificationSettings() {
  return useQuery({
    queryKey: ['notifications', 'settings'],
    queryFn: () => notificationsApi.getSettings().then((r) => r.data.data),
  });
}

export function useUpdateNotificationSettings() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => notificationsApi.updateSettings(data).then((r) => r.data.data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications', 'settings'] }),
  });
}
