import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';
import TripCard from '@/components/trips/TripCard';
import JsonLd from '@/components/seo/JsonLd';
import { getApiBaseUrl } from '@/lib/utils';
import { SITE_URL, breadcrumbJsonLd } from '@/lib/seo';

export const revalidate = 300;

interface PageProps {
  params: { from: string; to: string };
}

type City = { id: string; name: string; name_ar?: string | null; slug: string };

async function safeFetch<T>(url: string, opts: RequestInit & { next?: any } = {}): Promise<T | null> {
  try {
    const res = await fetch(url, { next: { revalidate: 300 }, ...opts });
    if (!res.ok) return null;
    const json = await res.json();
    return (json?.data ?? json) as T;
  } catch {
    return null;
  }
}

async function resolveCities(fromSlug: string, toSlug: string) {
  const base = getApiBaseUrl();
  const cities = await safeFetch<City[]>(`${base}/api/v1/lookup/cities`);
  if (!cities) return null;
  const norm = (s: string) => decodeURIComponent(s).toLowerCase().trim();
  const fromCity = cities.find((c) => c.slug === norm(fromSlug));
  const toCity = cities.find((c) => c.slug === norm(toSlug));
  if (!fromCity || !toCity) return null;
  return { fromCity, toCity };
}

async function getTripsBetween(fromId: string, toId: string) {
  const base = getApiBaseUrl();
  const data = await safeFetch<any>(
    `${base}/api/v1/trips?from_city_id=${fromId}&to_city_id=${toId}&limit=20&sort_by=helpful_count&sort_order=DESC`,
  );
  const trips = Array.isArray(data) ? data : data?.data ?? [];
  return Array.isArray(trips) ? trips : [];
}

export async function generateMetadata({ params }: PageProps) {
  const resolved = await resolveCities(params.from, params.to);
  if (!resolved) {
    return { title: 'الرحلة غير موجودة | رحلات EV' };
  }
  const from = resolved.fromCity.name_ar ?? resolved.fromCity.name;
  const to = resolved.toCity.name_ar ?? resolved.toCity.name;
  const title = `رحلة سيارة كهربائية من ${from} إلى ${to}`;
  const description = `كل ما تحتاج معرفته عن رحلة سيارة كهربائية من ${from} إلى ${to}: المسافة، استهلاك البطارية، محطات الشحن في الطريق، وتجارب حقيقية من سائقين سابقين.`;
  const path = `/from/${params.from}/to/${params.to}`;
  return {
    title,
    description,
    keywords: [
      `${from} ${to} كهربائية`,
      `رحلة ${from} ${to}`,
      `EV ${from} ${to}`,
      `شحن ${from} ${to}`,
    ],
    alternates: { canonical: path },
    openGraph: { type: 'article', title, description, url: `${SITE_URL}${path}` },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function FromToPage({ params }: PageProps) {
  const resolved = await resolveCities(params.from, params.to);
  if (!resolved) notFound();
  const { fromCity, toCity } = resolved;
  const from = fromCity.name_ar ?? fromCity.name;
  const to = toCity.name_ar ?? toCity.name;

  const trips = await getTripsBetween(fromCity.id, toCity.id);

  const distances = trips
    .map((t: any) => Number(t.total_distance_km ?? t.distance_km))
    .filter((n: number) => Number.isFinite(n));
  const avgDistance = distances.length
    ? Math.round(distances.reduce((s: number, n: number) => s + n, 0) / distances.length)
    : null;
  const arrivals = trips
    .map((t: any) => Number(t.arrival_battery_pct))
    .filter((n: number) => Number.isFinite(n));
  const avgArrival = arrivals.length
    ? Math.round(arrivals.reduce((s: number, n: number) => s + n, 0) / arrivals.length)
    : null;

  return (
    <div dir="rtl" className="bg-[var(--cream)] min-h-screen">
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'TouristTrip',
            name: `${from} إلى ${to}`,
            description: `${trips.length} رحلة سيارة كهربائية موثقة من ${from} إلى ${to}.`,
            itinerary: [
              { '@type': 'Place', name: from },
              { '@type': 'Place', name: to },
            ],
          },
          breadcrumbJsonLd([
            { name: 'الرئيسية', url: '/' },
            { name: from, url: `/search?from_city_id=${fromCity.id}` },
            { name: `${from} → ${to}`, url: `/from/${params.from}/to/${params.to}` },
          ]),
        ]}
      />

      <div className="container-app py-16 md:py-24">
        <div className="max-w-3xl">
          <span className="eyebrow">— رحلة كهربائية</span>
          <h1 className="heading-1 mt-4">
            من {from} <span className="text-[var(--ink-3)] mx-2">→</span> {to}
          </h1>
          <p className="body-md mt-4 text-[var(--ink-3)]">
            رحلة بسيارة كهربائية من {from} إلى {to}.{' '}
            {trips.length > 0
              ? `${trips.length} تجربة حقيقية من المجتمع تساعدك تخطط.`
              : 'لا يوجد رحلات موثقة بعد — كن أول من يوثّق هذه الرحلة.'}
          </p>
        </div>

        {trips.length > 0 && (
          <>
            <div className="mt-12 grid grid-cols-2 md:grid-cols-3 gap-px bg-[var(--line)] border border-[var(--line)]">
              <div className="bg-[var(--cream)] p-6">
                <div className="text-xs text-[var(--ink-4)]">عدد الرحلات</div>
                <div className="heading-2 mt-2">{trips.length}</div>
              </div>
              {avgDistance != null && (
                <div className="bg-[var(--cream)] p-6">
                  <div className="text-xs text-[var(--ink-4)]">متوسط المسافة</div>
                  <div className="heading-2 mt-2">{avgDistance} كم</div>
                </div>
              )}
              {avgArrival != null && (
                <div className="bg-[var(--cream)] p-6">
                  <div className="text-xs text-[var(--ink-4)]">متوسط البطارية عند الوصول</div>
                  <div className="heading-2 mt-2">{avgArrival}%</div>
                </div>
              )}
            </div>

            <div className="mt-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {trips.map((trip: any) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          </>
        )}

        <div className="mt-12 flex flex-wrap items-center gap-3">
          <Link href="/search" className="btn-secondary text-sm">
            استكشف رحلات أخرى
            <ArrowLeft className="h-4 w-4 flip-rtl" />
          </Link>
          <Link href="/popular-routes" className="btn-secondary text-sm">
            المسارات الشائعة
          </Link>
        </div>
      </div>
    </div>
  );
}
