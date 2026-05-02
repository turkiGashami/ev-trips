import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getTranslations, getLocale } from 'next-intl/server';
import ShareTripCTA from '@/components/cta/ShareTripCTA';
import BannerSlot from '@/components/banners/BannerSlot';
import JsonLd from '@/components/seo/JsonLd';
import { getApiBaseUrl } from '@/lib/utils';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export const revalidate = 60;

const GRADIENTS = [
  'linear-gradient(135deg, #3a4a3e 0%, #1a1a1a 100%)',
  'linear-gradient(135deg, #b45e42 0%, #6b3a28 100%)',
  'linear-gradient(135deg, #6b8e9c 0%, #2d4656 100%)',
  'linear-gradient(135deg, #2d4a3e 0%, #1a2a24 100%)',
  'linear-gradient(135deg, #8b7355 0%, #4a3a28 100%)',
];

type ApiTrip = {
  id: string;
  slug: string;
  title: string;
  departure_battery_pct: number;
  arrival_battery_pct: number;
  total_distance_km?: number | null;
  total_stops?: number | null;
  snap_brand_name?: string | null;
  snap_model_name?: string | null;
  departure_city?: { name_ar?: string; name?: string } | null;
  destination_city?: { name_ar?: string; name?: string } | null;
  user?: { full_name?: string; username?: string } | null;
};

async function getFeaturedTrips(): Promise<ApiTrip[]> {
  const base = getApiBaseUrl();
  try {
    const res = await fetch(
      `${base}/api/v1/trips?limit=3&sort_by=helpful_count&sort_order=DESC`,
      { cache: 'no-store' },
    );
    if (!res.ok) return [];
    const json = await res.json();
    const data = json?.data ?? json;
    const trips = Array.isArray(data) ? data : data?.data ?? [];
    return trips.filter((t: ApiTrip) => !!t?.slug);
  } catch {
    return [];
  }
}

type PublicStats = { trips: number; routes: number; cities: number; members: number };
async function getPublicStats(): Promise<PublicStats> {
  const base = getApiBaseUrl();
  try {
    const res = await fetch(`${base}/api/v1/stats`, { next: { revalidate: 60 } });
    if (!res.ok) return { trips: 0, routes: 0, cities: 0, members: 0 };
    const json = await res.json();
    const d = json?.data ?? json;
    return {
      trips: Number(d?.trips) || 0,
      routes: Number(d?.routes) || 0,
      cities: Number(d?.cities) || 0,
      members: Number(d?.members) || 0,
    };
  } catch {
    return { trips: 0, routes: 0, cities: 0, members: 0 };
  }
}

type PopularRoute = {
  from_ar?: string | null;
  from_en?: string | null;
  to_ar?: string | null;
  to_en?: string | null;
  trip_count: number;
  avg_arrival_battery: number | null;
  avg_distance_km: number | null;
};
async function getPopularRoutes(limit = 5): Promise<PopularRoute[]> {
  const base = getApiBaseUrl();
  try {
    const res = await fetch(
      `${base}/api/v1/popular-routes?limit=${limit}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return [];
    const json = await res.json();
    const d = json?.data ?? json;
    return Array.isArray(d) ? d : [];
  } catch {
    return [];
  }
}

/* ─────────────────────────────────────────────────────────────
   PAGE
   ───────────────────────────────────────────────────────────── */
export default async function HomePage() {
  const [featuredTrips, publicStats, popularRoutes] = await Promise.all([
    getFeaturedTrips(),
    getPublicStats(),
    getPopularRoutes(5),
  ]);
  const t = await getTranslations('landing');
  const tCommon = await getTranslations('common');
  const locale = await getLocale();
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  const nfmt = new Intl.NumberFormat(locale === 'ar' ? 'en' : locale);
  const stats = [
    { value: nfmt.format(publicStats.trips),   label: t('statsTrips') },
    { value: nfmt.format(publicStats.routes),  label: t('statsRoutes') },
    { value: nfmt.format(publicStats.cities),  label: t('statsCities') },
    { value: nfmt.format(publicStats.members), label: t('statsMembers') },
  ];

  const principles = [
    { number: locale === 'ar' ? '٠١' : '01', title: t('principle1Title'), body: t('principle1Body') },
    { number: locale === 'ar' ? '٠٢' : '02', title: t('principle2Title'), body: t('principle2Body') },
    { number: locale === 'ar' ? '٠٣' : '03', title: t('principle3Title'), body: t('principle3Body') },
  ];

  return (
    <main dir={dir} className="bg-[var(--cream)]">
      <JsonLd
        data={[
          {
            '@context': 'https://schema.org',
            '@type': 'Organization',
            name: 'رحلات EV',
            url: SITE_URL,
            logo: `${SITE_URL}/icon.png`,
          },
          {
            '@context': 'https://schema.org',
            '@type': 'WebSite',
            name: 'رحلات EV',
            url: SITE_URL,
            inLanguage: ['ar', 'en'],
            potentialAction: {
              '@type': 'SearchAction',
              target: `${SITE_URL}/search?q={search_term_string}`,
              'query-input': 'required name=search_term_string',
            },
          },
        ]}
      />

      {/* ── BANNER (top) ─────────────────────────────────────── */}
      <BannerSlot position="home_top" />

      {/* ── HERO ─────────────────────────────────────────────── */}
      <section className="relative min-h-[85vh] md:min-h-[88vh] flex items-end overflow-hidden"
               style={{ background: 'linear-gradient(180deg, #1a1a1a 0%, #232a26 50%, #2d4a3e 100%)' }}>

        {/* subtle depth overlay */}
        <div className="absolute inset-0 opacity-[0.08] pointer-events-none"
             style={{ backgroundImage: 'radial-gradient(circle at 20% 80%, #faf8f5 0%, transparent 50%)' }} />

        <div className="container-app relative z-10 pt-28 md:pt-40 pb-16 md:pb-28">
          <div className="max-w-4xl">
            <div className="flex items-center gap-3 mb-6 md:mb-8 text-[var(--cream)]/70">
              <span className="rule bg-[var(--cream)]/60" />
              <span className="eyebrow text-[10px] md:text-xs text-[var(--cream)]/70">{t('heroEyebrow')}</span>
            </div>

            <h1 className="text-[var(--cream)]"
                style={{ fontSize: 'clamp(2rem, 7vw, 6rem)', lineHeight: 1.05, fontWeight: 400, letterSpacing: '-0.025em' }}>
              {t('heroTitleA')}
              <br />
              <span className="italic font-light text-[var(--cream)]/85">{t('heroTitleB')}</span>
            </h1>

            <p className="mt-6 md:mt-10 max-w-xl text-base md:text-lg leading-[1.75] text-[var(--cream)]/75">
              {t('heroSubtitle')}
            </p>

            <div className="mt-8 md:mt-12 flex flex-wrap items-center gap-4 md:gap-5">
              <Link href="/search"
                    className="inline-flex items-center gap-3 px-7 md:px-9 py-3.5 md:py-4 bg-[var(--cream)] text-[var(--ink)] text-sm md:text-[0.95rem] font-medium rounded-[2px] hover:bg-white transition-colors">
                {t('browseTrips')}
                <ArrowLeft className="h-4 w-4 flip-rtl" />
              </Link>
              <ShareTripCTA variant="link" label={t('shareTrip')} />
            </div>
          </div>

          {/* inline micro-stats — bottom of hero */}
          <div className="mt-16 md:mt-32 pt-8 md:pt-10 border-t border-[var(--cream)]/15 grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-5xl">
            {stats.map((s) => (
              <div key={s.label}>
                <div className="nums-latin text-2xl md:text-4xl font-light text-[var(--cream)]"
                     style={{ letterSpacing: '-0.02em' }}>
                  {s.value}
                </div>
                <div className="mt-1.5 md:mt-2 text-[11px] md:text-xs text-[var(--cream)]/55 tracking-[0.08em]">
                  {s.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INTRO / STATEMENT ────────────────────────────────── */}
      <section className="section">
        <div className="container-app">
          <div className="grid lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-4">
              <span className="eyebrow">{t('aboutEyebrow')}</span>
            </div>
            <div className="lg:col-span-8">
              <p className="text-xl md:text-[1.75rem] leading-[1.55] text-[var(--ink)] font-light tracking-tight">
                {t('aboutA')} <span className="text-[var(--ink-3)]">{t('aboutB')}</span>
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED TRIPS — editorial post cards ────────────── */}
      <section className="section-sm">
        <div className="container-app">
          <div className="flex items-end justify-between mb-14">
            <div>
              <span className="eyebrow">{t('featuredEyebrow')}</span>
              <h2 className="mt-4 heading-1">{t('featuredTitle')}</h2>
            </div>
            <Link href="/search" className="link-editorial text-sm hidden md:inline-block">
              {t('seeAllTrips')}
            </Link>
          </div>

          {featuredTrips.length === 0 ? (
            <div className="border border-[var(--line)] bg-[var(--sand)]/40 py-20 px-6 text-center">
              <span className="eyebrow">{t('comingSoonEyebrow')}</span>
              <h3 className="heading-2 mt-3">{t('firstTitle')}</h3>
              <p className="body-md mt-3 max-w-md mx-auto text-[var(--ink-3)]">
                {t('firstBody')}
              </p>
              <div className="mt-8">
                <Link href="/register" className="btn-primary text-sm">
                  {t('createAccountStart')}
                  <ArrowLeft className="h-4 w-4 flip-rtl" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid md:grid-cols-3 gap-8 md:gap-10">
              {featuredTrips.map((trip, i) => {
                const from = trip.departure_city?.name_ar || trip.departure_city?.name || '';
                const to = trip.destination_city?.name_ar || trip.destination_city?.name || '';
                const vehicle = [trip.snap_brand_name, trip.snap_model_name]
                  .filter(Boolean).join(' ');
                const subtitle = [vehicle, trip.total_distance_km ? `${trip.total_distance_km} ${tCommon('kmUnit')}` : null]
                  .filter(Boolean).join(' · ');
                const author = trip.user?.full_name || trip.user?.username || '';
                return (
                  <Link key={trip.id} href={`/trips/${trip.slug}`} className="group block">
                    <div className="relative aspect-[4/5] overflow-hidden rounded-[4px] mb-6"
                         style={{ background: GRADIENTS[i % GRADIENTS.length] }}>
                      <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                      <div className="absolute top-5 right-5 nums-latin text-xs text-white/80 tracking-[0.08em]">
                        {trip.departure_battery_pct}% → {trip.arrival_battery_pct}%
                      </div>
                      <div className="absolute bottom-5 right-5 left-5 flex justify-between items-end text-white">
                        <span className="nums-latin text-xs tracking-[0.1em] opacity-75">
                          {trip.total_distance_km ? `${trip.total_distance_km} ${tCommon('kmUnit')}` : ''}
                          {trip.total_stops ? ` · ${t('stopsCount', { count: trip.total_stops })}` : ''}
                        </span>
                        <ArrowLeft className="h-5 w-5 flip-rtl opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-500" />
                      </div>
                    </div>
                    <div>
                      {subtitle && <div className="label-sm mb-2">{subtitle}</div>}
                      <h3 className="text-[1.375rem] leading-[1.3] text-[var(--ink)] font-medium tracking-tight group-hover:text-[var(--forest)] transition-colors">
                        {from && to ? t('fromTo', { from, to }) : trip.title}
                      </h3>
                      {author && (
                        <p className="mt-3 text-sm text-[var(--ink-3)]">{t('byAuthor', { author })}</p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          <div className="mt-14 text-center md:hidden">
            <Link href="/search" className="link-editorial text-sm">{t('seeAllTrips')}</Link>
          </div>
        </div>
      </section>

      {/* ── BANNER (middle) ──────────────────────────────────── */}
      <div className="container-app my-6">
        <BannerSlot position="home_middle" />
      </div>

      {/* ── PRINCIPLES ───────────────────────────────────────── */}
      <section className="section" style={{ background: 'var(--sand)' }}>
        <div className="container-app">
          <div className="max-w-2xl mb-20">
            <span className="eyebrow">{t('principlesEyebrow')}</span>
            <h2 className="mt-4 display-2">
              {t('principlesTitleA')}
              <br />
              <span className="italic font-light text-[var(--ink-2)]">{t('principlesTitleB')}</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-12 lg:gap-20">
            {principles.map((p) => (
              <div key={p.number} className="border-t border-[var(--ink)]/15 pt-8">
                <div className="nums-latin text-sm text-[var(--ink-3)] tracking-[0.15em] mb-6">
                  {p.number}
                </div>
                <h3 className="heading-2 mb-4">{p.title}</h3>
                <p className="body-md text-[var(--ink-2)]">{p.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROUTE PREVIEW — minimal data table style ─────────── */}
      <section className="section">
        <div className="container-app">
          <div className="grid lg:grid-cols-12 gap-10 items-end mb-14">
            <div className="lg:col-span-7">
              <span className="eyebrow">{t('routesEyebrow')}</span>
              <h2 className="mt-4 heading-1">{t('routesTitle')}</h2>
            </div>
            <div className="lg:col-span-5 lg:text-left">
              <p className="body-md max-w-sm lg:ms-auto">
                {t('routesBody')}
              </p>
            </div>
          </div>

          <div>
            {popularRoutes.length === 0 ? (
              <div className="border-t border-[var(--line)] py-16 text-center text-sm text-[var(--ink-3)]">
                {t('noRoutesYet')}
              </div>
            ) : (
              popularRoutes.map((r, i) => {
                const from = (locale === 'ar' ? r.from_ar : r.from_en) || r.from_ar || r.from_en || '';
                const to = (locale === 'ar' ? r.to_ar : r.to_en) || r.to_ar || r.to_en || '';
                return (
                  <Link key={`${from}-${to}-${i}`} href={`/search?q=${encodeURIComponent(from + ' ' + to)}`}
                        className="group grid grid-cols-12 gap-4 items-center py-7 border-t border-[var(--line)] hover:bg-[var(--sand)]/50 transition-colors px-2 -mx-2">

                    <div className="col-span-1 nums-latin text-sm text-[var(--ink-4)]">
                      {String(i + 1).padStart(2, '0')}
                    </div>

                    <div className="col-span-8 md:col-span-5 flex items-center gap-2 md:gap-3 min-w-0">
                      <span className="text-lg md:text-xl text-[var(--ink)] font-medium tracking-tight group-hover:text-[var(--forest)] transition-colors">
                        {from}
                      </span>
                      <ArrowLeft className="h-4 w-4 text-[var(--ink-4)] flip-rtl" />
                      <span className="text-lg md:text-xl text-[var(--ink)] font-medium tracking-tight group-hover:text-[var(--forest)] transition-colors">
                        {to}
                      </span>
                    </div>

                    <div className="hidden sm:block col-span-3 md:col-span-2 nums-latin text-sm text-[var(--ink-3)]">
                      {r.avg_distance_km != null ? `${r.avg_distance_km} ${tCommon('kmUnit')}` : '—'}
                    </div>

                    <div className="hidden md:block md:col-span-2 nums-latin text-sm text-[var(--ink-3)]">
                      {r.trip_count}
                    </div>

                    <div className="col-span-3 sm:col-span-2 text-left nums-latin text-base md:text-lg text-[var(--ink)] font-medium">
                      {r.avg_arrival_battery != null ? `${r.avg_arrival_battery}%` : '—'}
                    </div>
                  </Link>
                );
              })
            )}
          </div>

          <div className="mt-10">
            <Link href="/popular-routes" className="link-editorial text-sm">{t('allRoutes')}</Link>
          </div>
        </div>
      </section>

      {/* ── CTA — quiet, full-bleed ──────────────────────────── */}
      <section className="hero-dark">
        <div className="container-app py-28 md:py-40">
          <div className="max-w-3xl">
            <span className="eyebrow text-[var(--cream)]/60">{t('ctaEyebrow')}</span>
            <h2 className="mt-6 text-[var(--cream)]"
                style={{ fontSize: 'clamp(2rem, 4.5vw, 3.5rem)', lineHeight: 1.1, fontWeight: 400, letterSpacing: '-0.02em' }}>
              {t('ctaTitleA')}
              <br />
              <span className="italic font-light text-[var(--cream)]/80">{t('ctaTitleB')}</span>
            </h2>
            <p className="mt-8 text-lg leading-[1.7] text-[var(--cream)]/65 max-w-xl">
              {t('ctaBody')}
            </p>
            <div className="mt-12 flex flex-wrap items-center gap-6">
              <Link href="/register"
                    className="inline-flex items-center gap-3 px-9 py-4 bg-[var(--cream)] text-[var(--ink)] text-[0.95rem] font-medium rounded-[2px] hover:bg-white transition-colors">
                {t('ctaCreateAccount')}
                <ArrowLeft className="h-4 w-4 flip-rtl" />
              </Link>
              <Link href="/search" className="text-[var(--cream)]/80 text-[0.95rem] font-medium border-b border-[var(--cream)]/30 pb-1 hover:border-[var(--cream)] hover:text-[var(--cream)] transition-colors">
                {t('ctaBrowseFirst')}
              </Link>
            </div>
          </div>
        </div>
      </section>

    </main>
  );
}
