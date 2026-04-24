import { getLocale } from 'next-intl/server';
import { formatDate, getApiBaseUrl } from '@/lib/utils';
import FAQAccordion from '@/components/static/FAQAccordion';

export const revalidate = 60;
export const metadata = { title: 'الأسئلة الشائعة | رحلات EV' };

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

export default async function FAQPage() {
  const locale = await getLocale();
  const page = await fetchPage('faq');
  const isAr = locale.startsWith('ar');
  const dir = isAr ? 'rtl' : 'ltr';

  if (!page) {
    return (
      <div dir={dir} className="bg-[var(--cream)]">
        <div className="container-app py-16 md:py-24 max-w-3xl">
          <span className="eyebrow">— {isAr ? 'الأسئلة الشائعة' : 'FAQ'}</span>
          <h1 className="heading-1 mt-4">
            {isAr ? 'محتوى هذه الصفحة قيد التحديث' : 'This page is being updated'}
          </h1>
        </div>
      </div>
    );
  }

  const title = isAr ? page.title_ar ?? page.title : page.title ?? page.title_ar ?? '';
  const content = isAr
    ? page.content_ar ?? page.content
    : page.content ?? page.content_ar ?? '';

  return (
    <div dir={dir} className="bg-[var(--cream)]">
      <div className="container-app py-16 md:py-24 max-w-3xl">
        <span className="eyebrow">— {isAr ? 'الأسئلة الشائعة' : 'FAQ'}</span>
        <h1 className="heading-1 mt-4">{title}</h1>
        {page.updated_at && (
          <p className="text-sm text-[var(--ink-3)] mt-3 nums-latin">
            {isAr ? 'آخر تحديث: ' : 'Last updated: '}
            {formatDate(page.updated_at, '—', locale)}
          </p>
        )}
        <div className="mt-12">
          <FAQAccordion content={content} />
        </div>
      </div>
    </div>
  );
}
