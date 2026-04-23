'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { Plus, FileText, Clock, CheckCircle, XCircle, Archive, Eye, Pencil, ArrowLeft, ThumbsUp } from 'lucide-react';
import { useMyTrips, useSubmitTrip, useDeleteTrip } from '../../../hooks/useTrips';
import { Button } from '../../../components/ui/Button';
import { TripStatusBadge } from '../../../components/ui/Badge';
import { PageSpinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';
import { useAuthStore } from '../../../store/auth.store';
import { cn, formatNumber, formatDuration } from '../../../lib/utils';

const tabs = [
  { key: 'all', label: 'الكل', icon: FileText },
  { key: 'draft', label: 'مسودات', icon: Clock },
  { key: 'pending_review', label: 'قيد المراجعة', icon: Eye },
  { key: 'published', label: 'منشورة', icon: CheckCircle },
  { key: 'rejected', label: 'مرفوضة', icon: XCircle },
  { key: 'archived', label: 'مؤرشفة', icon: Archive },
];

function arrivalTone(pct: number) {
  if (pct >= 60) return { text: 'text-[var(--forest)]', bar: 'bg-[var(--forest)]' };
  if (pct >= 30) return { text: 'text-[var(--ink)]', bar: 'bg-[var(--ink)]/80' };
  return { text: 'text-[var(--terra)]', bar: 'bg-[var(--terra)]' };
}

/**
 * Resolve the correct destination for a trip card on the my-trips page.
 * - `published` → public view (/trips/[slug])
 * - `draft` / `rejected` → dashboard edit view
 * - `pending_review` / `archived` → not navigable (public 404s, edit is locked by API)
 */
function getTripHref(trip: { status: string; slug?: string }): string | null {
  if (!trip.slug) return null;
  if (trip.status === 'published') return `/trips/${trip.slug}`;
  if (trip.status === 'draft' || trip.status === 'rejected') return `/trips/${trip.slug}/edit`;
  return null;
}

/** My-trips card — doesn't rely on `trip.user` (API omits it on /trips/my). */
function MyTripCard({ trip }: { trip: any }) {
  const authUser = useAuthStore((s) => s.user);
  const href = getTripHref(trip);

  const departure = trip.departure_battery_pct ?? 0;
  const arrival = trip.arrival_battery_pct ?? 0;
  const used = Math.max(0, departure - arrival);
  const tone = arrivalTone(arrival);
  const vehicleLabel = [trip.snap_brand_name, trip.snap_model_name].filter(Boolean).join(' ');
  const name = authUser?.full_name || (authUser?.username ? `@${authUser.username}` : '');
  const initial = name?.[0] ?? 'أ';

  const content = (
    <article className="card-hover p-5 md:p-6 h-full flex flex-col gap-5">
      {/* Top row */}
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="label-sm truncate">
            {vehicleLabel || 'سيارة كهربائية'}
            {trip.snap_year ? ` · ${trip.snap_year}` : ''}
          </div>
          <h3 className="mt-2 flex items-center gap-2 flex-wrap text-[1.125rem] md:text-[1.25rem] tracking-tight text-[var(--ink)] font-medium">
            <span className="truncate">{trip.departure_city?.name_ar ?? trip.departure_city?.name ?? '—'}</span>
            <ArrowLeft className="h-4 w-4 text-[var(--ink-4)] shrink-0 flip-rtl" />
            <span className="truncate">{trip.destination_city?.name_ar ?? trip.destination_city?.name ?? '—'}</span>
          </h3>
        </div>

        <div className="shrink-0 text-start">
          <div className={cn('nums-latin text-2xl md:text-[1.75rem] font-medium leading-none tracking-tight', tone.text)}>
            {arrival}%
          </div>
          <div className="mt-1 text-[10px] text-[var(--ink-3)] tracking-[0.1em] uppercase">وصول</div>
        </div>
      </div>

      {/* Battery bar */}
      <div>
        <div className="relative h-[3px] bg-[var(--line)] overflow-hidden">
          <div className="absolute inset-y-0 start-0 bg-[var(--forest)]/25" style={{ width: `${departure}%` }} />
          <div className={cn('absolute inset-y-0 start-0', tone.bar)} style={{ width: `${arrival}%` }} />
        </div>
        <div className="flex items-center justify-between mt-2 text-[11px] text-[var(--ink-3)] nums-latin tracking-wide">
          <span>انطلاق {departure}%</span>
          <span>استهلاك {used}%</span>
          <span className={cn(tone.text, 'font-medium')}>وصول {arrival}%</span>
        </div>
      </div>

      {/* Data strip */}
      <div className="grid grid-cols-3 gap-4 py-4 border-y border-[var(--line-soft)]">
        <Cell label="المسافة" value={trip.distance_km ? `${trip.distance_km}` : '—'} unit={trip.distance_km ? 'كم' : undefined} />
        <Cell label="المدة" value={formatDuration(trip.duration_minutes)} />
        <Cell
          label="التوقفات"
          value={!trip.stop_count ? '—' : String(trip.stop_count)}
          unit={(trip.stop_count ?? 0) > 0 ? 'محطة' : 'بلا'}
        />
      </div>

      {/* Footer — show current user (not trip.user, which is absent on /trips/my) */}
      <div className="mt-auto flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="h-7 w-7 shrink-0 rounded-full bg-[var(--sand)] text-[var(--ink)] flex items-center justify-center text-xs font-medium">
            {initial}
          </div>
          <span className="text-xs text-[var(--ink-2)] truncate tracking-tight">
            {name || 'أنا'}
          </span>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-[var(--ink-3)]">
          <span className="flex items-center gap-1 text-xs nums-latin">
            <ThumbsUp className="h-3 w-3" />
            {formatNumber(trip.helpful_count ?? 0)}
          </span>
        </div>
      </div>
    </article>
  );

  if (href) {
    return (
      <Link href={href} className="block group">
        {content}
      </Link>
    );
  }
  return <div className="block">{content}</div>;
}

function Cell({ label, value, unit }: { label: string; value: string; unit?: string }) {
  return (
    <div>
      <div className="text-[10px] text-[var(--ink-3)] tracking-[0.1em] uppercase mb-1.5">{label}</div>
      <div className="flex items-baseline gap-1 nums-latin">
        <span className="text-lg md:text-xl font-medium text-[var(--ink)] tracking-tight">{value}</span>
        {unit && <span className="text-xs text-[var(--ink-3)]">{unit}</span>}
      </div>
    </div>
  );
}

export default function MyTripsPage() {
  const [activeTab, setActiveTab] = useState('all');
  // The API `/trips/my` currently ignores `status`, so we always fetch all and
  // filter client-side. Keeping the tab key separate from the fetched list also
  // avoids refetches when switching tabs.
  const { data, isLoading } = useMyTrips();
  const submitTrip = useSubmitTrip();
  useDeleteTrip(); // keep hook import stable; delete not wired here

  const allTrips: any[] = data?.data || [];

  const trips = useMemo(() => {
    if (activeTab === 'all') return allTrips;
    return allTrips.filter((t) => t.status === activeTab);
  }, [allTrips, activeTab]);

  return (
    <ProtectedRoute>
      <div className="max-w-5xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">رحلاتي</h1>
            <p className="text-gray-500 text-sm mt-1">{allTrips.length} رحلة</p>
          </div>
          <Link href="/trips/new">
            <Button leftIcon={<Plus className="w-4 h-4" />}>إضافة رحلة</Button>
          </Link>
        </div>

        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                  activeTab === tab.key
                    ? 'bg-white text-emerald-700 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <PageSpinner />
        ) : trips.length === 0 ? (
          <EmptyState
            icon={<FileText className="w-8 h-8" />}
            title="لا توجد رحلات"
            description={
              activeTab === 'all'
                ? 'ابدأ بتوثيق رحلتك الأولى ومشاركتها مع المجتمع'
                : 'لا توجد رحلات في هذه الحالة'
            }
            action={
              activeTab === 'all'
                ? { label: 'إضافة رحلة', onClick: () => (window.location.href = '/trips/new') }
                : undefined
            }
          />
        ) : (
          <div className="space-y-4">
            {trips.map((trip: any) => (
              <div key={trip.id} className="relative">
                <MyTripCard trip={trip} />

                <div className="absolute top-3 end-3 flex gap-2 items-center z-10">
                  <TripStatusBadge status={trip.status} />
                  {(trip.status === 'draft' || trip.status === 'rejected') && trip.slug && (
                    <Link href={`/trips/${trip.slug}/edit`}>
                      <Button size="xs" variant="outline" leftIcon={<Pencil className="w-3 h-3" />}>
                        تعديل
                      </Button>
                    </Link>
                  )}
                  {trip.status === 'draft' && (
                    <Button
                      size="xs"
                      variant="outline"
                      onClick={() => submitTrip.mutate(trip.id)}
                      loading={submitTrip.isPending}
                    >
                      إرسال للمراجعة
                    </Button>
                  )}
                  {trip.status === 'rejected' && trip.rejection_reason && (
                    <div className="bg-red-50 border border-red-200 rounded-lg px-3 py-1 text-xs text-red-700">
                      {trip.rejection_reason}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </ProtectedRoute>
  );
}
