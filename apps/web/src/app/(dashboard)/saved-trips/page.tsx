'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Bookmark } from 'lucide-react';
import { usersApi } from '../../../lib/api/users.api';
import { TripCard } from '../../../components/trips/TripCard';
import { PageSpinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';

// ─── Hook ────────────────────────────────────────────────────────────────────

function useSavedTrips(params?: { page?: number; limit?: number }) {
  return useQuery({
    queryKey: ['trips', 'saved', params],
    queryFn: () => usersApi.getMySavedTrips(params).then((r) => r.data),
  });
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function SavedTripsPage() {
  const { data, isLoading, isError } = useSavedTrips({ limit: 20 });

  const trips: any[] = data?.data ?? [];
  const total: number = data?.meta?.total ?? trips.length;

  return (
    <ProtectedRoute>
      <div className="max-w-4xl mx-auto">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center">
            <Bookmark className="w-5 h-5 text-emerald-600" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">الرحلات المحفوظة</h1>
            {!isLoading && !isError && (
              <p className="text-gray-500 text-sm mt-0.5">
                {total > 0 ? `${total} رحلة محفوظة` : 'لا توجد رحلات محفوظة'}
              </p>
            )}
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <PageSpinner />
        ) : isError ? (
          <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-center">
            <p className="text-red-700 text-sm">حدث خطأ أثناء تحميل الرحلات. يرجى المحاولة مجدداً.</p>
          </div>
        ) : trips.length === 0 ? (
          <EmptyState
            icon={<Bookmark className="w-8 h-8" />}
            title="لا توجد رحلات محفوظة"
            description="احفظ الرحلات التي تثير اهتمامك للرجوع إليها لاحقاً. استعرض الرحلات واضغط على أيقونة الحفظ."
            action={{
              label: 'استعرض الرحلات',
              onClick: () => (window.location.href = '/search'),
            }}
          />
        ) : (
          <div className="space-y-4">
            {trips.map((trip: any) => (
              <TripCard key={trip.id} trip={trip} />
            ))}

            {/* Load more hint */}
            {data?.meta?.hasNextPage && (
              <div className="text-center pt-4">
                <p className="text-sm text-gray-400">
                  عرض {trips.length} من أصل {total} رحلة
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
