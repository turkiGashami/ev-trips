import Link from 'next/link';
import { ArrowLeft, Route as RouteIcon } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import { getApiBaseUrl } from '@/lib/utils';
import JsonLd from '@/components/seo/JsonLd';
import { SITE_URL, breadcrumbJsonLd } from '@/lib/seo';

export const revalidate = 60;

interface PageProps {
  params: { slug: string };
}

type City = {
  id: string;
  name: string;
  name_ar?: string | null;
  slug: string;
};

type ApiTrip = {
  id: string;
  slug: string;
  title: string;
  trip_date?: string;
  departure_battery_pct: number;
  arrival_battery_pct: number;
  distance_km?: string | number | null;
  duration_minutes?: number | null;
  snap_brand_name?: string | null;
  snap_model_name?: string | null;
  user?: { full_name?: string; username?: string } | null;
};

function parseSlug(slug: string): { from: string; to: string } | null {
  const clean = (slug || '').toLowerCase().trim();
  if (!clean) return null;
  const parts = clean.split(/-to-|--|-/).filter(Boolean);
  if (parts.length < 2) return null;
  if (parts.length === 2) return { from: parts[0], to: parts[1] };
  return { from: parts[0], to: parts[parts.length - 1] };
}

async function safeFetch<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: 'no-store' });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? json) as T;
  } catch {
    return null;
  }
}

async function getRoute(slug: string) {
  const parsed = parseSlug(slug);
  if (!parsed) return null;
  const base = getApiBaseUrl();

  const cities = await safeFetch<City[]>(`${base}/api/v1/lookup/cities`);
  if (!cities || !Array.isArray(cities)) return null;

  const fromCity = cities.find((c) => c.slug === parsed.from);
  const toCity = cities.find((c) => c.slug === parsed.to);
  if (!fromCity || !toCity) return null;

  const tripsResponse = await safeFetch<any>(
    `${base}/api/v1/trips?from_city_id=${fromCity.id}&to_city_id=${toCity.id}&limit=20&sort_by=helpful_count&sort_order=DESC`,
  );
  const trips: ApiTrip[] = Array.isArray(tripsResponse)
    ? tripsResponse
    : tripsResponse?.data ?? [];

  const count = trips.length;
  const avgArrival = count
    ? Math.round(trips.reduce((s, t) => s + (t.arrival_battery_pct ?? 0), 0) / count)
    : null;
  const avgDeparture = count
    ? Math.round(trips.reduce((s, t) => s + (t.departure_battery_pct ?? 0), 0) / count)
    : null;
  const distances = trips
    .map((t) => (t.distance_km != null ? Number(t.distance_km) : NaN))
    .filter((n) => Number.isFinite(n));
  const avgDistance = distances.length
    ? Math.round(distances.reduce((s, n) => s + n, 0) / distances.length)
    : null;

  return { fromCity, toCity, trips, count, avgArrival, avgDeparture, avgDistance };
}

export async function generateMetadata({ params }: PageProps) {
  const t = await getTranslations('routeInsights');
  const route = await getRoute(params.slug);
  if (!route) return { title: t('metaTitleNotFound') };
  const from = route.fromCity.name_ar ?? route.fromCity.name;
  const to = route.toCity.name_ar ?? route.toCity.name;
  const title = t('metaTitle', { from, to });
  const description = t('metaDescription', { count: route.count, from, to });
  const path = `/routes/${params.slug}`;
  return {
    title,
    description,
    keywords: [
      `رحلة ${from} ${to}`,
      `مسار ${from} ${to}`,
      'سيارة كهربائية',
      `EV ${from} ${to}`,
    ],
    alternates: { canonical: path },
    openGraph: {
      type: 'article',
      title,
      description,
      url: `${SITE_URL}${path}`,
      siteName: 'رحلات EV',
    },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function RouteInsightsPage({ params }: PageProps) {
  const t = await getTranslations('routeInsights');
  const tCommon = await getTranslations('common');
  const route = await getRoute(params.slug);

  if (!route) {
    return (
      <div dir="rtl" className="bg-[var(--cream)]">
        <div className="container-app py-20 md:py-28 max-w-3xl">
          <span className="eyebrow">{t('notFoundEyebrow')}</span>
          <h1 className="heading-1 mt-4">{t('notFoundTitle')}</h1>
          <p className="body-md mt-4 text-[var(--ink-3)]">
            {t('notFoundDesc')}
          </p>
          <div className="mt-10 flex items-center gap-3">
            <Link href="/popular-routes" className="btn-primary text-sm">
              {t('popularRoutes')}
              <ArrowLeft className="h-4 w-4 flip-rtl" />
            </Link>
            <Link href="/search" className="btn-secondary text-sm">
              {t('browseTrips')}
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const from = route.fromCity.name_ar ?? route.fromCity.name;
  const to = route.toCity.name_ar ?? route.toCity.name;
  const dash = tCommon('dash');

  return (
    <div dir="rtl" className="bg-[var(--cream)]">
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'TouristTrip',
            name: `${from} → ${to}`,
            description: `رحلة سيارة كهربائية من ${from} إلى ${to} — ${route.count} رحلة موثقة من المجتمع.`,
            itinerary: [
              { '@type': 'Place', name: from },
              { '@type': 'Place', name: to },
            ],
            ...(route.avgDistance != null && {
              subjectOf: { '@type': 'CreativeWork', text: `متوسط المسافة ${route.avgDistance} كم` },
            }),
          },
          breadcrumbJsonLd([
            { name: 'الرئيسية', url: '/' },
            { name: 'المسارات الشائعة', url: '/popular-routes' },
            { name: `${from} → ${to}`, url: `/routes/${params.slug}` },
          ]),
        ]}
      />
      <div className="container-app py-16 md:py-24">
        <div className="max-w-3xl">
          <div className="flex items-center gap-2 text-[var(--ink-3)] text-xs mb-4">
            <RouteIcon className="h-3.5 w-3.5" />
            <span>{t('routeLabel')}</span>
          </div>
          <h1 className="heading-1">
            {from}
            <span className="text-[var(--ink-3)] mx-3">←</span>
            {to}
          </h1>
          <p className="body-md mt-4 text-[var(--ink-3)]">
            {t('summaryBody')}
          </p>
        </div>

        {route.count === 0 ? (
          <div className="mt-12 border border-[var(--line)] bg-[var(--sand)]/40 py-16 px-6 text-center">
            <span className="eyebrow">{t('emptyEyebrow')}</span>
            <h2 className="heading-2 mt-3">{t('emptyTitle')}</h2>
            <p className="body-md mt-3 max-w-md mx-auto text-[var(--ink-3)]">
              {t('emptyBody')}
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link href="/register" className="btn-primary text-sm">
                {t('createAccount')}
                <ArrowLeft className="h-4 w-4 flip-rtl" />
              </Link>
              <Link href="/search" className="btn-secondary text-sm">
                {t('browseOther')}
              </Link>
            </div>
          </div>
        ) : (
          <>
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-px bg-[var(--line)] border border-[var(--line)]">
              <Stat label={t('stat.count')} value={`${route.count}`} />
              <Stat
                label={t('stat.avgDeparture')}
                value={route.avgDeparture != null ? `${route.avgDeparture}%` : dash}
              />
              <Stat
                label={t('stat.avgArrival')}
                value={route.avgArrival != null ? `${route.avgArrival}%` : dash}
              />
              <Stat
                label={t('stat.avgDistance')}
                value={route.avgDistance != null ? `${route.avgDistance} ${tCommon('kmUnit')}` : dash}
              />
            </div>

            <div className="mt-16">
              <div className="flex items-end justify-between mb-8">
                <div>
                  <span className="eyebrow">{t('tripsEyebrow')}</span>
                  <h2 className="heading-2 mt-3">{t('tripsTitle')}</h2>
                </div>
                <Link
                  href={`/search?q=${encodeURIComponent(`${from} ${to}`)}`}
                  className="link-editorial text-sm hidden md:inline-block"
                >
                  {t('fullSearch')}
                </Link>
              </div>

              <div className="divide-y divide-[var(--line)] border-t border-b border-[var(--line)]">
                {route.trips.map((tr) => {
                  const vehicle = [tr.snap_brand_name, tr.snap_model_name].filter(Boolean).join(' ');
                  const author = tr.user?.full_name || tr.user?.username || '';
                  const distance = tr.distance_km != null ? Number(tr.distance_km) : null;
                  return (
                    <Link
                      key={tr.id}
                      href={`/trips/${tr.slug}`}
                      className="group grid grid-cols-12 gap-4 items-center py-6 hover:bg-[var(--sand)]/50 transition-colors px-2 -mx-2"
                    >
                      <div className="col-span-12 md:col-span-6 min-w-0">
                        <div className="text-[var(--ink)] text-lg font-medium tracking-tight group-hover:text-[var(--forest)] transition-colors">
                          {tr.title}
                        </div>
                        {(vehicle || author) && (
                          <div className="mt-1 text-xs text-[var(--ink-3)]">
                            {[vehicle, author && t('byAuthor', { author })].filter(Boolean).join(' · ')}
                          </div>
                        )}
                      </div>
                      <div className="col-span-4 md:col-span-2 nums-latin text-sm text-[var(--ink-3)]">
                        {tr.departure_battery_pct}% → {tr.arrival_battery_pct}%
                      </div>
                      <div className="col-span-4 md:col-span-2 nums-latin text-sm text-[var(--ink-3)]">
                        {distance != null ? `${distance} ${tCommon('kmUnit')}` : dash}
                      </div>
                      <div className="col-span-4 md:col-span-2 text-left text-[var(--ink-3)]">
                        <ArrowLeft className="h-4 w-4 flip-rtl inline-block opacity-60 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </Link>
                  );
                })}
              </div>
            </div>
          </>
        )}

        <div className="mt-16 text-center">
          <Link href="/popular-routes" className="link-editorial text-sm">
            {t('viewAll')}
          </Link>
        </div>
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[var(--cream)] p-6">
      <div className="nums-latin text-2xl md:text-3xl font-light text-[var(--ink)] tracking-tight">
        {value}
      </div>
      <div className="mt-2 text-[11px] md:text-xs text-[var(--ink-3)] tracking-[0.08em]">
        {label}
      </div>
    </div>
  );
}
