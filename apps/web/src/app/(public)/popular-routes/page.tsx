import Link from 'next/link';
import { ArrowLeft, Route } from 'lucide-react';
import { getLocale, getTranslations } from 'next-intl/server';
import { getApiBaseUrl } from '@/lib/utils';
import { buildPageMetadata } from '@/lib/seo';

export const revalidate = 60;
export const metadata = buildPageMetadata({
  path: '/popular-routes',
  title: 'المسارات الشائعة للسيارات الكهربائية',
  description:
    'استكشف أكثر مسارات السيارات الكهربائية شيوعاً بين المدن العربية: متوسط استهلاك البطارية، المسافات، وعدد الرحلات الموثقة من المجتمع.',
  keywords: [
    'مسارات السيارات الكهربائية',
    'رحلات EV بين المدن',
    'الرياض جدة كهربائية',
    'EV routes Saudi Arabia',
  ],
});

type PopularRoute = {
  departure_city_id?: string | null;
  destination_city_id?: string | null;
  from_ar?: string | null;
  from_en?: string | null;
  to_ar?: string | null;
  to_en?: string | null;
  trip_count: number;
  avg_arrival_battery: number | null;
  avg_distance_km: number | null;
};

async function getPopularRoutes(limit = 12): Promise<PopularRoute[]> {
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

export default async function PopularRoutesPage() {
  const [routes, t, tCommon, tLanding, locale] = await Promise.all([
    getPopularRoutes(12),
    getTranslations('popularRoutes'),
    getTranslations('common'),
    getTranslations('landing'),
    getLocale(),
  ]);
  const dir = locale === 'ar' ? 'rtl' : 'ltr';

  return (
    <div dir={dir} className="bg-[var(--cream)]">
      <div className="container-app py-16 md:py-24">
        <div className="max-w-3xl">
          <span className="eyebrow">— {t('eyebrow')}</span>
          <h1 className="heading-1 mt-4">{t('title')}</h1>
          <p className="body-md mt-4 text-[var(--ink-3)]">{t('body')}</p>
        </div>

        {routes.length === 0 ? (
          <div className="mt-12 border border-[var(--line)] py-20 text-center text-sm text-[var(--ink-3)]">
            {tLanding('noRoutesYet')}
          </div>
        ) : (
          <div className="mt-12 grid gap-px bg-[var(--line)] border border-[var(--line)] md:grid-cols-2 lg:grid-cols-3">
            {routes.map((r, i) => {
              const from = (locale === 'ar' ? r.from_ar : r.from_en) || r.from_ar || r.from_en || '';
              const to = (locale === 'ar' ? r.to_ar : r.to_en) || r.to_ar || r.to_en || '';
              // Prefer city ids — the search page filters precisely by them
              // and avoids the "two-words full-text" miss when only one
              // field at a time matches.
              const params = new URLSearchParams();
              if (r.departure_city_id) {
                params.set('from_city_id', r.departure_city_id);
                if (r.from_ar) params.set('from_city_name', r.from_ar);
              }
              if (r.destination_city_id) {
                params.set('to_city_id', r.destination_city_id);
                if (r.to_ar) params.set('to_city_name', r.to_ar);
              }
              const qs = params.toString();
              const href = qs ? `/search?${qs}` : `/search?q=${encodeURIComponent(from + ' ' + to)}`;
              return (
                <Link
                  key={`${from}-${to}-${i}`}
                  href={href}
                  className="bg-[var(--cream)] p-6 hover:bg-[var(--sand)]/50 transition-colors group"
                >
                  <div className="flex items-center gap-2 text-[var(--ink-3)] text-xs mb-3">
                    <Route className="h-3.5 w-3.5" />
                    <span>{t('routeLabel')}</span>
                  </div>
                  <div className="flex items-center gap-3 text-lg font-medium text-[var(--ink)] tracking-tight">
                    <span>{from}</span>
                    <ArrowLeft className="h-4 w-4 text-[var(--ink-3)] group-hover:text-[var(--forest)] transition-colors flip-rtl" />
                    <span>{to}</span>
                  </div>
                  <div className="mt-4 flex items-center justify-between text-xs text-[var(--ink-3)]">
                    <span className="nums-latin">
                      {r.avg_distance_km != null ? `${r.avg_distance_km} ${tCommon('kmUnit')}` : '—'}
                    </span>
                    <span className="nums-latin">
                      {t('tripCount', { count: r.trip_count })}
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        <div className="mt-12 text-center">
          <Link href="/search" className="link-editorial text-sm">
            {t('browseAll')}
          </Link>
        </div>
      </div>
    </div>
  );
}
