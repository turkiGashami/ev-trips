'use client';
export const dynamic = 'force-dynamic';

import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useCallback, Suspense } from 'react';
import { SlidersHorizontal, X, Search as SearchIcon, ChevronDown } from 'lucide-react';
import { useTranslations } from 'next-intl';
import TripCard from '@/components/trips/TripCard';
import TripFilters, { FilterValues } from '@/components/trips/TripFilters';
import Pagination from '@/components/ui/Pagination';
import { useTrips } from '@/hooks/useTrips';
import type { SearchTripsParams } from '@/lib/api/trips.api';
import { formatNumber } from '@/lib/utils';

const SORT_MAP: Record<string, { sort_by: string; sort_order: 'ASC' | 'DESC' }> = {
  newest:    { sort_by: 'published_at',   sort_order: 'DESC' },
  helpful:   { sort_by: 'helpful_count',  sort_order: 'DESC' },
  views:     { sort_by: 'view_count',     sort_order: 'DESC' },
  favorites: { sort_by: 'favorite_count', sort_order: 'DESC' },
  date_asc:  { sort_by: 'trip_date',      sort_order: 'ASC' },
  date_desc: { sort_by: 'trip_date',      sort_order: 'DESC' },
};

function SearchPage() {
  const t = useTranslations('search');
  const tCommon = useTranslations('common');
  const searchParams = useSearchParams();
  const router = useRouter();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const SORT_OPTIONS = [
    { value: 'newest',    label: t('sort.newest') },
    { value: 'helpful',   label: t('sort.helpful') },
    { value: 'views',     label: t('sort.views') },
    { value: 'favorites', label: t('sort.favorites') },
    { value: 'date_asc',  label: t('sort.dateAsc') },
    { value: 'date_desc', label: t('sort.dateDesc') },
  ];

  const currentPage = Number(searchParams.get('page') ?? '1');
  const q = searchParams.get('q') ?? '';
  const sortBy = searchParams.get('sortBy') ?? 'newest';

  const urlFilters: FilterValues = {
    q: q || undefined,
    from_city_id: searchParams.get('from_city_id') ?? undefined,
    from_city_name: searchParams.get('from_city_name') ?? undefined,
    to_city_id: searchParams.get('to_city_id') ?? undefined,
    to_city_name: searchParams.get('to_city_name') ?? undefined,
    brand_id: searchParams.get('brand_id') ?? undefined,
    model_id: searchParams.get('model_id') ?? undefined,
    trim_id: searchParams.get('trim_id') ?? undefined,
    year: (() => { const n = Number(searchParams.get('year')); return Number.isFinite(n) && n > 0 ? n : undefined; })(),
    min_departure_battery: (() => { const n = Number(searchParams.get('min_departure_battery')); return Number.isFinite(n) ? n : undefined; })(),
    min_arrival_battery: (() => { const n = Number(searchParams.get('min_arrival_battery')); return Number.isFinite(n) ? n : undefined; })(),
    weather_condition: searchParams.get('weather_condition') ?? undefined,
    ac_usage: searchParams.get('ac_usage') ?? undefined,
    luggage_level: searchParams.get('luggage_level') ?? undefined,
    passengers_count: (() => { const n = Number(searchParams.get('passengers_count')); return Number.isFinite(n) && n > 0 ? n : undefined; })(),
    sortBy,
  };

  const apiParams: SearchTripsParams = {
    q: urlFilters.q,
    from_city_id: urlFilters.from_city_id,
    to_city_id: urlFilters.to_city_id,
    brand_id: urlFilters.brand_id,
    model_id: urlFilters.model_id,
    trim_id: urlFilters.trim_id,
    year: urlFilters.year,
    min_departure_battery: urlFilters.min_departure_battery,
    min_arrival_battery: urlFilters.min_arrival_battery,
    weather_condition: urlFilters.weather_condition,
    ac_usage: urlFilters.ac_usage,
    luggage_level: urlFilters.luggage_level,
    passengers_count: urlFilters.passengers_count,
    ...(SORT_MAP[sortBy] ?? SORT_MAP.newest),
    page: currentPage,
    limit: 12,
  };

  const cleanParams = Object.fromEntries(
    Object.entries(apiParams).filter(([, v]) =>
      v !== undefined && v !== null && v !== '' && !(typeof v === 'number' && !Number.isFinite(v))
    )
  ) as SearchTripsParams;

  const { data, isLoading, isError } = useTrips(cleanParams);

  const updateParams = useCallback(
    (updates: Record<string, string | null>) => {
      const params = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (value === null || value === '') params.delete(key);
        else params.set(key, value);
      });
      params.set('page', '1');
      router.push(`/search?${params.toString()}`);
    },
    [searchParams, router],
  );

  const handleFiltersChange = (newFilters: FilterValues) => {
    const updates: Record<string, string | null> = {};
    Object.entries(newFilters).forEach(([key, value]) => {
      const isInvalidNum = typeof value === 'number' && !Number.isFinite(value);
      updates[key] = value != null && value !== '' && !isInvalidNum ? String(value) : null;
    });
    updateParams(updates);
  };

  const handlePageChange = (page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', String(page));
    router.push(`/search?${params.toString()}`);
  };

  const trips = Array.isArray((data as any)?.data)
    ? (data as any).data
    : (data as any)?.trips ?? (Array.isArray(data) ? data : []);
  const total = (data as any)?.meta?.total ?? (data as any)?.total ?? 0;
  const totalPages = (data as any)?.meta?.totalPages ?? (data as any)?.totalPages ?? 1;

  const activeChips: { key: string; label: string }[] = [];
  if (urlFilters.from_city_name) activeChips.push({ key: 'from_city_id', label: t('fromChip', { name: urlFilters.from_city_name }) });
  if (urlFilters.to_city_name)   activeChips.push({ key: 'to_city_id',   label: t('toChip', { name: urlFilters.to_city_name }) });
  if (urlFilters.weather_condition) activeChips.push({ key: 'weather_condition', label: t('weatherChip', { value: urlFilters.weather_condition }) });
  if (urlFilters.ac_usage)       activeChips.push({ key: 'ac_usage',       label: t('acChip', { value: urlFilters.ac_usage }) });
  if (urlFilters.passengers_count) activeChips.push({ key: 'passengers_count', label: t('passengersChip', { count: urlFilters.passengers_count }) });
  if (urlFilters.min_arrival_battery) activeChips.push({ key: 'min_arrival_battery', label: t('minArrivalChip', { value: urlFilters.min_arrival_battery }) });

  const removeChip = (key: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (key === 'from_city_id') { params.delete('from_city_id'); params.delete('from_city_name'); }
    else if (key === 'to_city_id') { params.delete('to_city_id'); params.delete('to_city_name'); }
    else params.delete(key);
    params.set('page', '1');
    router.push(`/search?${params.toString()}`);
  };

  const SkeletonCard = () => (
    <div className="card p-6 h-[260px] space-y-4">
      <div className="skeleton h-3 w-24" />
      <div className="skeleton h-6 w-3/4" />
      <div className="skeleton h-px w-full" />
      <div className="grid grid-cols-3 gap-4">
        <div className="skeleton h-10" />
        <div className="skeleton h-10" />
        <div className="skeleton h-10" />
      </div>
      <div className="skeleton h-4 w-1/3 mt-auto" />
    </div>
  );

  return (
    <div className="min-h-screen bg-[var(--cream)]">

      <div className="border-b border-[var(--line)] bg-[var(--cream)]">
        <div className="container-app pt-10 md:pt-14 pb-6 md:pb-8">
          <span className="eyebrow">{t('eyebrow')}</span>
          <div className="mt-3 flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <h1 className="heading-1">
                {q ? <>{t('resultsFor')} <span className="italic font-light text-[var(--ink-2)]">&quot;{q}&quot;</span></> : t('allTrips')}
              </h1>
              <p className="body-md mt-2">
                {isLoading
                  ? <span className="skeleton inline-block h-4 w-24" />
                  : t('totalTripsSummary', { count: formatNumber(total) })
                }
              </p>
            </div>

            <div className="flex items-center gap-3">
              <div className="relative">
                <select
                  value={sortBy}
                  onChange={(e) => updateParams({ sortBy: e.target.value })}
                  className="h-11 ps-4 pe-10 text-sm appearance-none bg-transparent border border-[var(--line)] rounded-[2px] text-[var(--ink)] focus:border-[var(--ink)] outline-none"
                >
                  {SORT_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
                <ChevronDown className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-3)]" />
              </div>
              <button
                onClick={() => setFiltersOpen(true)}
                className="h-11 px-4 text-sm font-medium border border-[var(--ink)] text-[var(--ink)] rounded-[2px] lg:hidden flex items-center gap-2"
              >
                <SlidersHorizontal className="h-4 w-4" />
                {t('filterButton')}
              </button>
            </div>
          </div>

          {activeChips.length > 0 && (
            <div className="mt-5 flex items-center flex-wrap gap-2">
              <span className="label-sm text-[11px]">{t('applied')}</span>
              {activeChips.map((c) => (
                <button
                  key={c.key}
                  onClick={() => removeChip(c.key)}
                  className="inline-flex items-center gap-2 px-3 py-1.5 bg-[var(--sand)] text-[var(--ink-2)] text-xs rounded-[2px] hover:bg-[var(--bone)]"
                >
                  {c.label}
                  <X className="h-3 w-3" />
                </button>
              ))}
              <button
                onClick={() => router.push('/search')}
                className="text-xs text-[var(--ink-3)] hover:text-[var(--ink)] underline underline-offset-4"
              >
                {t('clearAll')}
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="container-app py-8 md:py-10">
        <div className="flex gap-10">

          <aside className="hidden lg:block w-72 flex-shrink-0">
            <div className="sticky top-24 border border-[var(--line)] bg-[var(--cream)] p-6 rounded-[2px]">
              <TripFilters defaultValues={urlFilters} onFilter={handleFiltersChange} />
            </div>
          </aside>

          {filtersOpen && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-[var(--ink)]/60" onClick={() => setFiltersOpen(false)} />
              <div className="absolute end-0 top-0 h-full w-[88vw] max-w-sm bg-[var(--cream)] overflow-y-auto">
                <div className="flex items-center justify-between p-5 border-b border-[var(--line)]">
                  <h3 className="heading-3">{t('filterTitle')}</h3>
                  <button onClick={() => setFiltersOpen(false)} className="btn-icon-sm">
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="p-5">
                  <TripFilters defaultValues={urlFilters} onFilter={(v) => { handleFiltersChange(v); setFiltersOpen(false); }} />
                </div>
              </div>
            </div>
          )}

          <div className="flex-1 min-w-0">
            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
              </div>
            ) : isError ? (
              <EmptyBlock
                title={t('loadError')}
                body={t('loadErrorDesc')}
                action={<button onClick={() => router.refresh()} className="btn-primary">{tCommon('retry')}</button>}
              />
            ) : trips.length === 0 ? (
              <EmptyBlock
                title={t('noResultsTitle')}
                body={t('noResultsDesc')}
                action={<button onClick={() => router.push('/search')} className="btn-secondary">{t('clearAllFilters')}</button>}
              />
            ) : (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                  {trips.map((trip: any) => <TripCard key={trip.id} trip={trip} />)}
                </div>

                {totalPages > 1 && (
                  <div className="mt-14 pt-10 border-t border-[var(--line)] flex justify-center">
                    <Pagination page={currentPage} totalPages={totalPages} onPageChange={handlePageChange} />
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function EmptyBlock({ title, body, action }: { title: string; body: string; action: React.ReactNode }) {
  return (
    <div className="border border-[var(--line)] bg-[var(--cream)] py-20 px-8 text-center rounded-[2px]">
      <div className="w-12 h-12 mx-auto mb-6 flex items-center justify-center border border-[var(--line)] rounded-full">
        <SearchIcon className="h-5 w-5 text-[var(--ink-3)]" />
      </div>
      <h3 className="heading-3 mb-2">{title}</h3>
      <p className="body-md max-w-sm mx-auto mb-8">{body}</p>
      <div className="flex justify-center">{action}</div>
    </div>
  );
}

export default function SearchPageWrapper() {
  return <Suspense><SearchPage /></Suspense>;
}
