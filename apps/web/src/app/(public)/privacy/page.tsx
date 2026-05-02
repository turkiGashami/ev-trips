import { getLocale } from 'next-intl/server';
import { getApiBaseUrl } from '@/lib/utils';
import StaticPageView from '@/components/static/StaticPageView';
import { buildPageMetadata } from '@/lib/seo';

export const revalidate = 60;
export const metadata = buildPageMetadata({
  path: '/privacy',
  title: 'سياسة الخصوصية',
  description: 'سياسة الخصوصية وحماية بيانات المستخدمين على منصة رحلات EV.',
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

export default async function PrivacyPage() {
  const locale = await getLocale();
  const page = await fetchPage('privacy');
  return <StaticPageView page={page} locale={locale} fallbackEyebrow="— سياسة الخصوصية" />;
}
