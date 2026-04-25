import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, Eye, ChevronLeft, Wind, Thermometer, Users, Briefcase, Gauge, CloudSun } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import TripTimeline from '@/components/trips/TripTimeline';
import CommentSection from '@/components/comments/CommentSection';
import TripCard from '@/components/trips/TripCard';
import TripActionBar from '@/components/trips/TripActionBar';
import TripViewTracker from '@/components/trips/TripViewTracker';
import { formatDate, formatNumber, getApiBaseUrl } from '@/lib/utils';

const API_BASE = getApiBaseUrl();

interface PageProps {
  params: { slug: string };
}

async function getTripBySlug(slug: string): Promise<any | null> {
  try {
    const res = await fetch(`${API_BASE}/api/v1/trips/${encodeURIComponent(slug)}`, {
      next: { revalidate: 60 },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? json ?? null;
  } catch {
    return null;
  }
}

async function getRelatedTrips(fromCityId?: string, toCityId?: string): Promise<any[]> {
  if (!fromCityId || !toCityId) return [];
  try {
    const params = new URLSearchParams({
      from_city_id: fromCityId,
      to_city_id: toCityId,
      limit: '3',
      sort_by: 'helpful_count',
      sort_order: 'DESC',
    });
    const res = await fetch(`${API_BASE}/api/v1/trips?${params}`, { next: { revalidate: 120 } });
    if (!res.ok) return [];
    const json = await res.json();
    const trips = json?.data ?? [];
    return Array.isArray(trips) ? trips : [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps) {
  const t = await getTranslations('tripDetail');
  const trip = await getTripBySlug(params.slug);
  if (!trip) return { title: t('notFoundTitle') };
  return {
    title: t('metaTitle', { title: trip.title }),
    description: (trip.trip_notes ?? trip.route_notes ?? '').slice(0, 160),
  };
}

const weatherIcon: Record<string, string> = {
  sunny: '☀️',
  cloudy: '☁️',
  extreme_heat: '🌡️',
  cold: '❄️',
  rainy: '🌧️',
  windy: '💨',
  foggy: '🌫️',
  sandstorm: '🌪️',
};

function arrivalTone(pct: number) {
  if (pct >= 50) return 'text-[var(--forest)]';
  if (pct >= 25) return 'text-[var(--ink)]';
  return 'text-[var(--terra)]';
}

function arrivalBar(pct: number) {
  if (pct >= 50) return 'bg-[var(--forest)]';
  if (pct >= 25) return 'bg-[var(--ink)]/80';
  return 'bg-[var(--terra)]';
}

export default async function TripDetailPage({ params }: PageProps) {
  const t = await getTranslations('tripDetail');
  const tCommon = await getTranslations('common');
  const tTrips = await getTranslations('trips');
  const trip = await getTripBySlug(params.slug);
  if (!trip) notFound();

  const relatedTrips = await getRelatedTrips(trip.departure_city_id, trip.destination_city_id);

  // Sort stops by order so we can compute the per-leg distance from the
  // cumulative `distance_from_start_km` saved on each row.
  const sortedRawStops = [...(trip.stops ?? [])].sort(
    (a: any, b: any) => (a.stop_order ?? 0) - (b.stop_order ?? 0),
  );
  let prevCumulative = 0;
  const stops = sortedRawStops.map((s: any) => {
    const cumulative = Number(s.distance_from_start_km ?? NaN);
    const segment = Number.isFinite(cumulative)
      ? Math.max(cumulative - prevCumulative, 0)
      : (s.distance_from_prev_km ?? undefined);
    if (Number.isFinite(cumulative)) prevCumulative = cumulative;
    return {
      ...s,
      battery_before: s.battery_before ?? s.battery_before_pct,
      battery_after:  s.battery_after  ?? s.battery_after_pct,
      order: s.order ?? s.stop_order,
      cost_sar: s.cost_sar ?? s.charging_cost,
      distance_from_prev_km: segment,
      distance_from_start_km: Number.isFinite(cumulative) ? cumulative : undefined,
    };
  });

  const stopCount = stops.length;
  const used = trip.departure_battery_pct - trip.arrival_battery_pct;
  const vehicleLabel = [trip.snap_brand_name, trip.snap_model_name, trip.snap_trim_name].filter(Boolean).join(' ');
  const arrivalTextColor = arrivalTone(trip.arrival_battery_pct);
  const arrivalBarColor = arrivalBar(trip.arrival_battery_pct);
  const initial = trip.user?.full_name?.[0] ?? 'U';
  const weatherKey = trip.weather_condition as string | undefined;
  const weatherLbl = weatherKey ? tTrips(`weatherLabels.${weatherKey}` as any) : null;
  const weatherIco = weatherKey ? weatherIcon[weatherKey] : null;
  const dash = tCommon('dash');
  const departureCity = trip.departure_city?.name_ar ?? trip.departure_city?.name ?? dash;
  const destinationCity = trip.destination_city?.name_ar ?? trip.destination_city?.name ?? dash;

  const formatDuration = (min: number) => {
    const h = Math.floor(min / 60);
    const m = min % 60;
    return h > 0 ? `${h}${t('hoursShort')}${m ? ` ${m}${t('minutesShort')}` : ''}` : `${m}${t('minutesShort')}`;
  };

  const conditions: { icon: React.ReactNode; label: string; value: string }[] = [];
  if (weatherLbl && weatherIco) conditions.push({ icon: <span>{weatherIco}</span>, label: t('cond.weather'), value: weatherLbl });
  if (trip.outside_temperature_c != null) conditions.push({ icon: <Thermometer className="h-4 w-4" />, label: t('cond.temperature'), value: `${trip.outside_temperature_c}${t('tempUnit')}` });
  if (trip.wind_speed_kmh != null) conditions.push({ icon: <Wind className="h-4 w-4" />, label: t('cond.wind'), value: `${trip.wind_speed_kmh} ${t('windUnit')}` });
  if (trip.ac_usage) conditions.push({ icon: <CloudSun className="h-4 w-4" />, label: t('cond.ac'), value: tTrips(`acUsageLabels.${trip.ac_usage}` as any) || trip.ac_usage });
  if (trip.passengers_count) conditions.push({ icon: <Users className="h-4 w-4" />, label: t('cond.passengers'), value: `${trip.passengers_count} ${trip.passengers_count === 1 ? t('passengerSingular') : t('passengerPlural')}` });
  if (trip.luggage_level) conditions.push({ icon: <Briefcase className="h-4 w-4" />, label: t('cond.luggage'), value: tTrips(`luggageLabels.${trip.luggage_level}` as any) || trip.luggage_level });
  if (trip.average_speed_kmh) conditions.push({ icon: <Gauge className="h-4 w-4" />, label: t('cond.avgSpeed'), value: `${trip.average_speed_kmh} ${t('windUnit')}` });
  if (trip.driving_style) conditions.push({ icon: <span className="text-xs font-bold">M</span>, label: t('cond.drivingStyle'), value: tTrips(`drivingModeLabels.${trip.driving_style}` as any) || trip.driving_style });
  if (trip.road_condition) conditions.push({ icon: <MapPin className="h-4 w-4" />, label: t('cond.roadCondition'), value: trip.road_condition });

  const notes = trip.trip_notes ?? trip.route_notes;

  return (
    <div className="min-h-screen bg-[var(--cream)]">

      {/* Breadcrumb */}
      <div className="border-b border-[var(--line)]">
        <div className="container-app py-4">
          <nav className="flex items-center gap-2 text-xs text-[var(--ink-3)]">
            <Link href="/" className="hover:text-[var(--ink)] transition-colors">{t('breadcrumbHome')}</Link>
            <ChevronLeft className="h-3 w-3 flip-rtl" />
            <Link href="/search" className="hover:text-[var(--ink)] transition-colors">{t('breadcrumbTrips')}</Link>
            <ChevronLeft className="h-3 w-3 flip-rtl" />
            <span className="text-[var(--ink-2)] truncate max-w-[220px]">{trip.title}</span>
          </nav>
        </div>
      </div>

      {/* Header */}
      <div className="border-b border-[var(--line)]">
        <div className="container-app py-10 md:py-14">
          <span className="eyebrow">— {vehicleLabel}{trip.snap_year ? ` · ${trip.snap_year}` : ''}</span>
          <h1 className="mt-4 max-w-4xl"
              style={{ fontSize: 'clamp(1.75rem, 4.5vw, 3.25rem)', lineHeight: 1.1, fontWeight: 500, letterSpacing: '-0.02em' }}>
            {trip.title}
          </h1>

          <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm text-[var(--ink-3)]">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-full bg-[var(--ink)] text-[var(--cream)] flex items-center justify-center text-xs font-medium">
                {initial}
              </div>
              <Link href={`/users/${trip.user?.username}`} className="text-[var(--ink)] hover:text-[var(--forest)] transition-colors font-medium tracking-tight">
                {trip.user?.full_name}
              </Link>
              {trip.user?.is_contributor_verified && (
                <span className="badge-green">{t('verified')}</span>
              )}
            </div>
            <span className="text-[var(--ink-4)]">·</span>
            <span className="nums-latin">
              {formatDate(trip.trip_date)}
            </span>
            {weatherLbl && weatherIco && (
              <>
                <span className="text-[var(--ink-4)]">·</span>
                <span>{weatherIco} {weatherLbl}</span>
              </>
            )}
            <span className="text-[var(--ink-4)]">·</span>
            <span className="flex items-center gap-1 nums-latin">
              <Eye className="h-3.5 w-3.5" />
              {formatNumber(trip.view_count ?? 0)}
            </span>
          </div>
        </div>
      </div>

      {/* BIG DATA STRIP */}
      <div className="bg-[var(--sand)] border-b border-[var(--line)]">
        <div className="container-app py-8 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
            <HeadlineStat
              eyebrow={t('stat.arrivalBattery')}
              value={`${trip.arrival_battery_pct}`}
              unit="%"
              accent={arrivalTextColor}
              emphasis
            />
            <HeadlineStat eyebrow={t('stat.distance')} value={trip.distance_km ? `${trip.distance_km}` : dash} unit={trip.distance_km ? tCommon('kmUnit') : ''} />
            <HeadlineStat eyebrow={t('stat.duration')} value={trip.duration_minutes ? formatDuration(trip.duration_minutes) : dash} />
            <HeadlineStat
              eyebrow={t('stat.stops')}
              value={stopCount === 0 ? tTrips('stopsNone') : `${stopCount}`}
              unit={stopCount > 0 ? tTrips('stopSingular') : ''}
            />
          </div>
        </div>
      </div>

      <div className="container-app py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">

          <div className="lg:col-span-8 space-y-12">

            {/* BATTERY PROFILE */}
            <section>
              <SectionHead eyebrow={t('batteryEyebrow')} title={t('batteryTitle')} />
              <div className="flex items-end justify-between mb-4">
                <div>
                  <div className="label-sm">{t('depart')}</div>
                  <div className="nums-latin text-3xl font-medium text-[var(--forest)] mt-1">{trip.departure_battery_pct}%</div>
                </div>
                <div className="text-center">
                  <div className="label-sm">{t('used')}</div>
                  <div className="nums-latin text-xl text-[var(--ink-2)] mt-1">{used}%</div>
                </div>
                <div className="text-end">
                  <div className="label-sm">{t('arrive')}</div>
                  <div className={`nums-latin text-3xl font-medium mt-1 ${arrivalTextColor}`}>{trip.arrival_battery_pct}%</div>
                </div>
              </div>
              <div className="relative h-1 bg-[var(--line)]">
                <div className="absolute inset-y-0 start-0 bg-[var(--forest)]/25" style={{ width: `${trip.departure_battery_pct}%` }} />
                <div className={`absolute inset-y-0 start-0 ${arrivalBarColor}`} style={{ width: `${trip.arrival_battery_pct}%` }} />
              </div>

              {trip.estimated_range_at_departure_km && (
                <div className="mt-6 grid grid-cols-2 gap-6 border-t border-[var(--line)] pt-6">
                  <div>
                    <div className="label-sm">{t('rangeAtDeparture')}</div>
                    <div className="mt-1 nums-latin text-lg text-[var(--ink)]">{trip.estimated_range_at_departure_km} {tCommon('kmUnit')}</div>
                  </div>
                  {trip.remaining_range_at_arrival_km != null && (
                    <div>
                      <div className="label-sm">{t('rangeAtArrival')}</div>
                      <div className="mt-1 nums-latin text-lg text-[var(--ink)]">
                        {trip.remaining_range_at_arrival_km} {tCommon('kmUnit')}
                      </div>
                    </div>
                  )}
                  {trip.consumption_rate && (
                    <div>
                      <div className="label-sm">{t('consumptionRate')}</div>
                      <div className="mt-1 nums-latin text-lg text-[var(--ink)]">{trip.consumption_rate} kWh/100km</div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* TRIP CONDITIONS */}
            {conditions.length > 0 && (
              <section>
                <SectionHead eyebrow={t('conditionsEyebrow')} title={t('conditionsTitle')} />
                <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-[var(--line)] border border-[var(--line)]">
                  {conditions.map(({ icon, label, value }) => (
                    <div key={label} className="bg-[var(--cream)] px-4 py-4 flex items-start gap-3">
                      <span className="text-[var(--ink-3)] mt-0.5 shrink-0">{icon}</span>
                      <div className="min-w-0">
                        <p className="text-[10px] text-[var(--ink-3)] leading-none mb-1">{label}</p>
                        <p className="text-sm font-medium text-[var(--ink)] nums-latin">{value}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* TIMELINE */}
            <section>
              <SectionHead eyebrow={t('timelineEyebrow')} title={t('timelineTitle')} />
              <TripTimeline
                departureBattery={trip.departure_battery_pct}
                arrivalBattery={trip.arrival_battery_pct}
                departureCity={departureCity}
                destinationCity={destinationCity}
                stops={stops}
                distanceKm={trip.distance_km}
                durationMinutes={trip.duration_minutes}
              />
            </section>

            {/* NOTES */}
            {notes && (
              <section>
                <SectionHead eyebrow={t('notesEyebrow')} title={t('notesTitle')} />
                <p className="mt-4 body-lg max-w-prose text-[var(--ink-2)]">{notes}</p>
              </section>
            )}
            {trip.route_notes && trip.trip_notes && trip.route_notes !== notes && (
              <section>
                <SectionHead eyebrow={t('routeNotesEyebrow')} title={t('routeNotesTitle')} />
                <p className="mt-4 body-lg max-w-prose text-[var(--ink-2)]">{trip.route_notes}</p>
              </section>
            )}

            {/* MEDIA */}
            {trip.media && trip.media.length > 0 && (
              <section>
                <SectionHead eyebrow={t('mediaEyebrow')} title={t('mediaTitle')} />
                <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2">
                  {trip.media.map((m: any) => (
                    <img key={m.id} src={m.url} alt={m.caption ?? ''} className="object-cover w-full h-40 rounded-[2px]" />
                  ))}
                </div>
              </section>
            )}

            {/* COMMENTS */}
            <section className="pt-4 border-t border-[var(--line)]">
              <CommentSection tripId={trip.id} tripSlug={trip.slug} />
            </section>
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-4 space-y-6">

            <TripViewTracker tripId={trip.id} />
            <TripActionBar
              tripId={trip.id}
              tripSlug={trip.slug}
              tripTitle={trip.title}
              initialHelpfulCount={trip.helpful_count ?? 0}
            />

            <div className="border border-[var(--line)]">
              <div className="px-5 py-4 border-b border-[var(--line)]">
                <span className="eyebrow">{t('vehicleEyebrow')}</span>
                <h3 className="mt-2 text-lg font-medium text-[var(--ink)] tracking-tight">
                  {trip.snap_brand_name} {trip.snap_model_name}
                </h3>
              </div>
              <dl className="divide-y divide-[var(--line-soft)]">
                {[
                  { label: t('vehicle.trim'), value: trip.snap_trim_name },
                  { label: t('vehicle.year'), value: trip.snap_year },
                  { label: t('vehicle.battery'), value: trip.snap_battery_capacity_kwh ? `${trip.snap_battery_capacity_kwh} kWh` : undefined },
                  { label: t('vehicle.drivetrain'), value: trip.snap_drivetrain },
                ].filter((r) => r.value).map(({ label, value }) => (
                  <div key={label} className="px-5 py-3 flex justify-between items-center">
                    <dt className="text-xs text-[var(--ink-3)]">{label}</dt>
                    <dd className="text-sm text-[var(--ink)] nums-latin">{value}</dd>
                  </div>
                ))}
              </dl>
              {trip.snap_brand_name && (
                <div className="p-5 border-t border-[var(--line)]">
                  <Link href={`/search?q=${encodeURIComponent(trip.snap_brand_name + ' ' + (trip.snap_model_name ?? ''))}`} className="link-editorial text-xs">
                    {t('allVehicleTrips', { brand: trip.snap_brand_name, model: trip.snap_model_name ?? '' })}
                  </Link>
                </div>
              )}
            </div>

            <div className="border border-[var(--line)] p-5">
              <span className="eyebrow">{t('authorEyebrow')}</span>
              <div className="mt-4 flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-[var(--ink)] text-[var(--cream)] flex items-center justify-center text-base font-medium">
                  {initial}
                </div>
                <div className="min-w-0">
                  <div className="font-medium text-[var(--ink)] truncate">{trip.user?.full_name}</div>
                  <div className="text-xs text-[var(--ink-3)]">@{trip.user?.username}</div>
                </div>
              </div>
              <Link href={`/users/${trip.user?.username}`} className="btn-secondary w-full mt-5 text-sm">
                {t('viewProfile')}
              </Link>
            </div>

            {(trip.outside_temperature_c != null || trip.wind_speed_kmh != null || weatherLbl) && (
              <div className="border border-[var(--line)] p-5">
                <span className="eyebrow">{t('conditionsSidebarEyebrow')}</span>
                <div className="mt-4 space-y-3">
                  {weatherLbl && weatherIco && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--ink-3)]">{t('cond.weather')}</span>
                      <span className="text-[var(--ink)]">{weatherIco} {weatherLbl}</span>
                    </div>
                  )}
                  {trip.outside_temperature_c != null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--ink-3)]">{t('cond.temperatureShort')}</span>
                      <span className="text-[var(--ink)] nums-latin">{trip.outside_temperature_c}{t('tempUnit')}</span>
                    </div>
                  )}
                  {trip.wind_speed_kmh != null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--ink-3)]">{t('cond.windShort')}</span>
                      <span className="text-[var(--ink)] nums-latin">{trip.wind_speed_kmh} {t('windUnit')}</span>
                    </div>
                  )}
                  {trip.average_speed_kmh && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--ink-3)]">{t('cond.avgSpeed')}</span>
                      <span className="text-[var(--ink)] nums-latin">{trip.average_speed_kmh} {t('windUnit')}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>

        {/* Related trips */}
        {relatedTrips.length > 0 && (
          <section className="mt-20 md:mt-28 pt-12 md:pt-16 border-t border-[var(--line)]">
            <div className="flex items-end justify-between mb-10">
              <div>
                <span className="eyebrow">{t('relatedEyebrow')}</span>
                <h2 className="mt-3 heading-1">{t('relatedTitle')}</h2>
              </div>
              <Link href={`/search?from_city_id=${trip.departure_city_id}&to_city_id=${trip.destination_city_id}`} className="link-editorial text-sm hidden md:inline-block">
                {t('seeMore')}
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedTrips.filter((r: any) => r.id !== trip.id).slice(0, 3).map((r: any) => (
                <TripCard key={r.id} trip={r} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

function HeadlineStat({
  eyebrow, value, unit, accent, emphasis,
}: { eyebrow: string; value: string; unit?: string; accent?: string; emphasis?: boolean }) {
  return (
    <div>
      <div className="label-sm text-[10px]">{eyebrow}</div>
      <div className="mt-2 flex items-baseline gap-1.5 nums-latin">
        <span className={`${accent ?? 'text-[var(--ink)]'} font-medium tracking-tight`}
              style={{ fontSize: emphasis ? 'clamp(2.5rem, 5vw, 3.75rem)' : 'clamp(1.75rem, 3.5vw, 2.5rem)', lineHeight: 1 }}>
          {value}
        </span>
        {unit && <span className="text-sm text-[var(--ink-3)]">{unit}</span>}
      </div>
    </div>
  );
}

function SectionHead({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="border-b border-[var(--line)] pb-4 mb-6">
      <span className="eyebrow">{eyebrow}</span>
      <h2 className="mt-2 heading-2">{title}</h2>
    </div>
  );
}
