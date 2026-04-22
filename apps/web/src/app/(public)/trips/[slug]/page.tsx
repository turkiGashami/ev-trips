import { notFound } from 'next/navigation';
import Link from 'next/link';
import { MapPin, ThumbsUp, Eye, Bookmark, Share2, ChevronLeft, Wind, Thermometer, Users, Briefcase, Gauge, CloudSun } from 'lucide-react';
import TripTimeline from '@/components/trips/TripTimeline';
import CommentSection from '@/components/comments/CommentSection';
import TripCard from '@/components/trips/TripCard';
import { formatDate, formatNumber } from '@/lib/utils';

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

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
  const trip = await getTripBySlug(params.slug);
  if (!trip) return { title: 'رحلة غير موجودة' };
  return {
    title: `${trip.title} | رحلات EV`,
    description: (trip.trip_notes ?? trip.route_notes ?? '').slice(0, 160),
  };
}

const weatherLabel: Record<string, { label: string; icon: string }> = {
  sunny:        { label: 'مشمس',    icon: '☀️' },
  cloudy:       { label: 'غائم',    icon: '☁️' },
  extreme_heat: { label: 'حر شديد', icon: '🌡️' },
  cold:         { label: 'بارد',    icon: '❄️' },
  rainy:        { label: 'ممطر',    icon: '🌧️' },
  windy:        { label: 'رياح',    icon: '💨' },
  foggy:        { label: 'ضبابي',   icon: '🌫️' },
  sandstorm:    { label: 'غبار',    icon: '🌪️' },
};

const acUsageLabel: Record<string, string> = {
  off: 'مطفأ', partial: 'جزئي', full: 'كامل',
};

const luggageLabel: Record<string, string> = {
  none: 'بدون أمتعة', light: 'خفيفة', medium: 'متوسطة', heavy: 'ثقيلة', full: 'كاملة',
};

const drivingStyleLabel: Record<string, string> = {
  eco: 'Eco', calm: 'هادئ', normal: 'Normal', sporty: 'Sport', aggressive: 'Aggressive',
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

function formatDuration(min: number) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return h > 0 ? `${h}س${m ? ` ${m}د` : ''}` : `${m}د`;
}

export default async function TripDetailPage({ params }: PageProps) {
  const trip = await getTripBySlug(params.slug);
  if (!trip) notFound();

  const relatedTrips = await getRelatedTrips(trip.departure_city_id, trip.destination_city_id);

  // Normalize stop fields (entity uses battery_before_pct / battery_after_pct)
  const stops = (trip.stops ?? []).map((s: any) => ({
    ...s,
    battery_before: s.battery_before ?? s.battery_before_pct,
    battery_after:  s.battery_after  ?? s.battery_after_pct,
    order: s.order ?? s.stop_order,
    cost_sar: s.cost_sar ?? s.charging_cost,
  }));

  const stopCount = stops.length;
  const used = trip.departure_battery_pct - trip.arrival_battery_pct;
  const vehicleLabel = [trip.snap_brand_name, trip.snap_model_name, trip.snap_trim_name].filter(Boolean).join(' ');
  const arrivalTextColor = arrivalTone(trip.arrival_battery_pct);
  const arrivalBarColor = arrivalBar(trip.arrival_battery_pct);
  const initial = trip.user?.full_name?.[0] ?? 'U';
  const weather = trip.weather_condition ? weatherLabel[trip.weather_condition] : null;
  const departureCity = trip.departure_city?.name_ar ?? trip.departure_city?.name ?? '—';
  const destinationCity = trip.destination_city?.name_ar ?? trip.destination_city?.name ?? '—';

  const conditions: { icon: React.ReactNode; label: string; value: string }[] = [];
  if (weather) conditions.push({ icon: <span>{weather.icon}</span>, label: 'الطقس', value: weather.label });
  if (trip.outside_temperature_c != null) conditions.push({ icon: <Thermometer className="h-4 w-4" />, label: 'درجة الحرارة', value: `${trip.outside_temperature_c}°م` });
  if (trip.wind_speed_kmh != null) conditions.push({ icon: <Wind className="h-4 w-4" />, label: 'سرعة الرياح', value: `${trip.wind_speed_kmh} كم/س` });
  if (trip.ac_usage) conditions.push({ icon: <CloudSun className="h-4 w-4" />, label: 'التكييف', value: acUsageLabel[trip.ac_usage] ?? trip.ac_usage });
  if (trip.passengers_count) conditions.push({ icon: <Users className="h-4 w-4" />, label: 'الركاب', value: `${trip.passengers_count} ${trip.passengers_count === 1 ? 'راكب' : 'ركاب'}` });
  if (trip.luggage_level) conditions.push({ icon: <Briefcase className="h-4 w-4" />, label: 'الأمتعة', value: luggageLabel[trip.luggage_level] ?? trip.luggage_level });
  if (trip.average_speed_kmh) conditions.push({ icon: <Gauge className="h-4 w-4" />, label: 'متوسط السرعة', value: `${trip.average_speed_kmh} كم/س` });
  if (trip.driving_style) conditions.push({ icon: <span className="text-xs font-bold">M</span>, label: 'أسلوب القيادة', value: drivingStyleLabel[trip.driving_style] ?? trip.driving_style });
  if (trip.road_condition) conditions.push({ icon: <MapPin className="h-4 w-4" />, label: 'حالة الطريق', value: trip.road_condition });

  const notes = trip.trip_notes ?? trip.route_notes;

  return (
    <div className="min-h-screen bg-[var(--cream)]">

      {/* ── Breadcrumb ── */}
      <div className="border-b border-[var(--line)]">
        <div className="container-app py-4">
          <nav className="flex items-center gap-2 text-xs text-[var(--ink-3)]">
            <Link href="/" className="hover:text-[var(--ink)] transition-colors">الرئيسية</Link>
            <ChevronLeft className="h-3 w-3 flip-rtl" />
            <Link href="/search" className="hover:text-[var(--ink)] transition-colors">الرحلات</Link>
            <ChevronLeft className="h-3 w-3 flip-rtl" />
            <span className="text-[var(--ink-2)] truncate max-w-[220px]">{trip.title}</span>
          </nav>
        </div>
      </div>

      {/* ── Header ── */}
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
                <span className="badge-green">موثّق</span>
              )}
            </div>
            <span className="text-[var(--ink-4)]">·</span>
            <span className="nums-latin">
              {formatDate(trip.trip_date)}
            </span>
            {weather && (
              <>
                <span className="text-[var(--ink-4)]">·</span>
                <span>{weather.icon} {weather.label}</span>
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

      {/* ── BIG DATA STRIP ── */}
      <div className="bg-[var(--sand)] border-b border-[var(--line)]">
        <div className="container-app py-8 md:py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-4">
            <HeadlineStat
              eyebrow="البطارية عند الوصول"
              value={`${trip.arrival_battery_pct}`}
              unit="%"
              accent={arrivalTextColor}
              emphasis
            />
            <HeadlineStat eyebrow="المسافة" value={trip.distance_km ? `${trip.distance_km}` : '—'} unit={trip.distance_km ? 'كم' : ''} />
            <HeadlineStat eyebrow="المدة" value={trip.duration_minutes ? formatDuration(trip.duration_minutes) : '—'} />
            <HeadlineStat
              eyebrow="التوقفات"
              value={stopCount === 0 ? 'بلا' : `${stopCount}`}
              unit={stopCount > 0 ? 'محطة' : 'توقف'}
            />
          </div>
        </div>
      </div>

      <div className="container-app py-10 md:py-14">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14">

          {/* ── Main content (8 cols) ── */}
          <div className="lg:col-span-8 space-y-12">

            {/* BATTERY PROFILE */}
            <section>
              <SectionHead eyebrow="— ملف البطارية" title="على الطريق" />
              <div className="flex items-end justify-between mb-4">
                <div>
                  <div className="label-sm">انطلاق</div>
                  <div className="nums-latin text-3xl font-medium text-[var(--forest)] mt-1">{trip.departure_battery_pct}%</div>
                </div>
                <div className="text-center">
                  <div className="label-sm">استُهلك</div>
                  <div className="nums-latin text-xl text-[var(--ink-2)] mt-1">{used}%</div>
                </div>
                <div className="text-end">
                  <div className="label-sm">وصول</div>
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
                    <div className="label-sm">المدى عند الانطلاق</div>
                    <div className="mt-1 nums-latin text-lg text-[var(--ink)]">{trip.estimated_range_at_departure_km} كم</div>
                  </div>
                  {trip.remaining_range_at_arrival_km != null && (
                    <div>
                      <div className="label-sm">المدى المتبقي عند الوصول</div>
                      <div className="mt-1 nums-latin text-lg text-[var(--ink)]">
                        {trip.remaining_range_at_arrival_km} كم
                      </div>
                    </div>
                  )}
                  {trip.consumption_rate && (
                    <div>
                      <div className="label-sm">معدل الاستهلاك</div>
                      <div className="mt-1 nums-latin text-lg text-[var(--ink)]">{trip.consumption_rate} kWh/100km</div>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* TRIP CONDITIONS */}
            {conditions.length > 0 && (
              <section>
                <SectionHead eyebrow="— ظروف الرحلة" title="بيئة وأسلوب القيادة" />
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
              <SectionHead eyebrow="— التفاصيل" title="تسلسل الرحلة" />
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
                <SectionHead eyebrow="— من القائد" title="ملاحظات الرحلة" />
                <p className="mt-4 body-lg max-w-prose text-[var(--ink-2)]">{notes}</p>
              </section>
            )}
            {trip.route_notes && trip.trip_notes && trip.route_notes !== notes && (
              <section>
                <SectionHead eyebrow="— المسار" title="ملاحظات المسار" />
                <p className="mt-4 body-lg max-w-prose text-[var(--ink-2)]">{trip.route_notes}</p>
              </section>
            )}

            {/* MEDIA */}
            {trip.media && trip.media.length > 0 && (
              <section>
                <SectionHead eyebrow="— صور" title="لقطات من الرحلة" />
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

          {/* ── Sidebar (4 cols) ── */}
          <aside className="lg:col-span-4 space-y-6">

            {/* Actions */}
            <div className="border border-[var(--line)] p-5 space-y-3">
              <button className="btn-primary w-full gap-2">
                <ThumbsUp className="h-4 w-4" />
                مفيدة ({trip.helpful_count ?? 0})
              </button>
              <div className="grid grid-cols-2 gap-2">
                <button className="btn-secondary gap-2 text-sm">
                  <Bookmark className="h-3.5 w-3.5" />
                  حفظ
                </button>
                <button className="btn-secondary gap-2 text-sm">
                  <Share2 className="h-3.5 w-3.5" />
                  مشاركة
                </button>
              </div>
            </div>

            {/* Vehicle spec */}
            <div className="border border-[var(--line)]">
              <div className="px-5 py-4 border-b border-[var(--line)]">
                <span className="eyebrow">— السيارة</span>
                <h3 className="mt-2 text-lg font-medium text-[var(--ink)] tracking-tight">
                  {trip.snap_brand_name} {trip.snap_model_name}
                </h3>
              </div>
              <dl className="divide-y divide-[var(--line-soft)]">
                {[
                  { label: 'الإصدار', value: trip.snap_trim_name },
                  { label: 'السنة',   value: trip.snap_year },
                  { label: 'سعة البطارية', value: trip.snap_battery_capacity_kwh ? `${trip.snap_battery_capacity_kwh} kWh` : undefined },
                  { label: 'نظام الدفع', value: trip.snap_drivetrain },
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
                    جميع رحلات {trip.snap_brand_name} {trip.snap_model_name}
                  </Link>
                </div>
              )}
            </div>

            {/* Author */}
            <div className="border border-[var(--line)] p-5">
              <span className="eyebrow">— صاحب الرحلة</span>
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
                الملف الشخصي
              </Link>
            </div>

            {/* Conditions sidebar summary */}
            {(trip.outside_temperature_c != null || trip.wind_speed_kmh != null || weather) && (
              <div className="border border-[var(--line)] p-5">
                <span className="eyebrow">— الظروف</span>
                <div className="mt-4 space-y-3">
                  {weather && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--ink-3)]">الطقس</span>
                      <span className="text-[var(--ink)]">{weather.icon} {weather.label}</span>
                    </div>
                  )}
                  {trip.outside_temperature_c != null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--ink-3)]">الحرارة</span>
                      <span className="text-[var(--ink)] nums-latin">{trip.outside_temperature_c}°م</span>
                    </div>
                  )}
                  {trip.wind_speed_kmh != null && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--ink-3)]">الرياح</span>
                      <span className="text-[var(--ink)] nums-latin">{trip.wind_speed_kmh} كم/س</span>
                    </div>
                  )}
                  {trip.average_speed_kmh && (
                    <div className="flex justify-between text-sm">
                      <span className="text-[var(--ink-3)]">متوسط السرعة</span>
                      <span className="text-[var(--ink)] nums-latin">{trip.average_speed_kmh} كم/س</span>
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
                <span className="eyebrow">— استكشف أكثر</span>
                <h2 className="mt-3 heading-1">رحلات مشابهة</h2>
              </div>
              <Link href={`/search?from_city_id=${trip.departure_city_id}&to_city_id=${trip.destination_city_id}`} className="link-editorial text-sm hidden md:inline-block">
                عرض المزيد
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedTrips.filter((t: any) => t.id !== trip.id).slice(0, 3).map((t: any) => (
                <TripCard key={t.id} trip={t} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/* ── helpers ─────────────────────────────────────────── */
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
