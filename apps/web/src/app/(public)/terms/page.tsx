import { getLocale } from 'next-intl/server';
import { getApiBaseUrl } from '@/lib/utils';
import StaticPageView from '@/components/static/StaticPageView';
import { buildPageMetadata } from '@/lib/seo';

export const revalidate = 60;
export const metadata = buildPageMetadata({
  path: '/terms',
  title: 'الشروط والأحكام',
  description: 'الشروط والأحكام لاستخدام منصة رحلات EV.',
});

async function fetchPage(key: string) {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/pages/${key}`, {
      next: { revalidate: 60 },
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? json ?? null;
  } catch {
    return null;
  }
}

export default async function TermsPage() {
  const locale = await getLocale();
  const page = await fetchPage('terms');
  return <StaticPageView page={page} locale={locale} fallbackEyebrow="— الشروط والأحكام" />;
}
