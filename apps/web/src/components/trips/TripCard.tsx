'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ThumbsUp } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { cn, formatNumber, formatDuration } from '../../lib/utils';

export interface TripCardData {
  id: string;
  slug: string;
  title: string;
  departure_city: { name: string; name_ar: string };
  destination_city: { name: string; name_ar: string };
  trip_date: string;
  departure_battery_pct: number;
  arrival_battery_pct: number;
  duration_minutes?: number;
  distance_km?: number;
  stop_count: number;
  view_count: number;
  favorite_count: number;
  helpful_count: number;
  status: string;
  snap_brand_name?: string;
  snap_model_name?: string;
  snap_trim_name?: string;
  snap_year?: number;
  user: {
    id: string;
    username: string;
    full_name: string;
    avatar_url?: string | null;
    is_contributor_verified?: boolean;
  };
  has_media?: boolean;
}

interface TripCardProps {
  trip: TripCardData;
  className?: string;
  compact?: boolean;
}

/* ── helpers ─────────────────────────────────────────── */
function arrivalTone(pct: number) {
  if (pct >= 60) return { text: 'text-[var(--forest)]', bar: 'bg-[var(--forest)]' };
  if (pct >= 30) return { text: 'text-[var(--ink)]',    bar: 'bg-[var(--ink)]/80' };
  return             { text: 'text-[var(--terra)]',   bar: 'bg-[var(--terra)]' };
}

/* ── component ───────────────────────────────────────── */
export function TripCard({ trip, className, compact = false }: TripCardProps) {
  const t = useTranslations('tripCard');
  const tCommon = useTranslations('common');
  const departure = trip.departure_battery_pct ?? 0;
  const arrival = trip.arrival_battery_pct ?? 0;
  const used = departure - arrival;
  const tone = arrivalTone(arrival);
  const vehicleLabel = [trip.snap_brand_name, trip.snap_model_name].filter(Boolean).join(' ');
  const initial = trip.user?.full_name?.[0] ?? trip.user?.username?.[0] ?? 'U';
  const dash = tCommon('dash');

  return (
    <Link href={`/trips/${trip.slug}`} className={cn('block group', className)}>
      <article className="card-hover p-5 md:p-6 h-full flex flex-col gap-5">

        {/* Top row: vehicle label + arrival % */}
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0 flex-1">
            <div className="label-sm truncate">
              {vehicleLabel || t('defaultVehicle')}
              {trip.snap_year ? ` · ${trip.snap_year}` : ''}
            </div>
            {/* Route */}
            <h3 className="mt-2 flex items-center gap-2 flex-wrap text-[1.125rem] md:text-[1.25rem] tracking-tight text-[var(--ink)] font-medium">
              <span className="truncate">{trip.departure_city?.name_ar ?? trip.departure_city?.name ?? dash}</span>
              <ArrowLeft className="h-4 w-4 text-[var(--ink-4)] shrink-0 flip-rtl" />
              <span className="truncate">{trip.destination_city?.name_ar ?? trip.destination_city?.name ?? dash}</span>
            </h3>
          </div>

          <div className="shrink-0 text-left">
            <div className={cn('nums-latin text-2xl md:text-[1.75rem] font-medium leading-none tracking-tight', tone.text)}>
              {arrival}%
            </div>
            <div className="mt-1 text-[10px] text-[var(--ink-3)] tracking-[0.1em] uppercase">{t('arrive')}</div>
          </div>
        </div>

        {/* Battery bar */}
        {!compact && (
          <div>
            <div className="relative h-[3px] bg-[var(--line)] overflow-hidden">
              {/* Departure (light forest) */}
              <div className="absolute inset-y-0 start-0 bg-[var(--forest)]/25" style={{ width: `${departure}%` }} />
              {/* Arrival (solid) */}
              <div className={cn('absolute inset-y-0 start-0', tone.bar)} style={{ width: `${arrival}%` }} />
            </div>
            <div className="flex items-center justify-between mt-2 text-[11px] text-[var(--ink-3)] nums-latin tracking-wide">
              <span>{t('depart', { pct: departure })}</span>
              <span>{t('used', { pct: used })}</span>
              <span className={cn(tone.text, 'font-medium')}>{t('arriveWithPct', { pct: arrival })}</span>
            </div>
          </div>
        )}

        {/* Data strip — always visible, high-contrast */}
        <div className="grid grid-cols-3 gap-4 py-4 border-y border-[var(--line-soft)]">
          <DataCell
            label={t('distance')}
            value={trip.distance_km ? formatNumber(trip.distance_km) : dash}
            unit={trip.distance_km ? tCommon('kmUnit') : undefined}
          />
          <DataCell
            label={t('duration')}
            value={formatDuration(trip.duration_minutes)}
          />
          <DataCell
            label={t('stops')}
            value={!trip.stop_count ? dash : String(trip.stop_count)}
            unit={(trip.stop_count ?? 0) > 0 ? t('stopSingular') : t('stopsNone')}
          />
        </div>

        {/* Footer: author + engagement */}
        <div className="mt-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-7 w-7 shrink-0 rounded-full bg-[var(--sand)] text-[var(--ink)] flex items-center justify-center text-xs font-medium">
              {initial}
            </div>
            <span className="text-xs text-[var(--ink-2)] truncate tracking-tight">
              {trip.user?.full_name || (trip.user?.username ? `@${trip.user.username}` : dash)}
            </span>
          </div>
          <div className="flex items-center gap-3 shrink-0 text-[var(--ink-3)]">
            <span className="flex items-center gap-1 text-xs nums-latin">
              <ThumbsUp className="h-3 w-3" />
              {formatNumber(trip.helpful_count)}
            </span>
          </div>
        </div>

      </article>
    </Link>
  );
}

function DataCell({ label, value, unit }: { label: string; value: string; unit?: string }) {
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

export default TripCard;
