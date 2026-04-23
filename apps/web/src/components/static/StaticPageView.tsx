import { formatDate } from '@/lib/utils';

interface StaticPagePayload {
  key: string;
  title: string;
  title_ar: string | null;
  content: string;
  content_ar: string | null;
  updated_at?: string;
}

interface Props {
  page: StaticPagePayload | null;
  locale: string;
  fallbackEyebrow: string;
}

export default function StaticPageView({ page, locale, fallbackEyebrow }: Props) {
  const isAr = locale.startsWith('ar');
  const dir = isAr ? 'rtl' : 'ltr';

  if (!page) {
    return (
      <div dir={dir} className="bg-[var(--cream)]">
        <div className="container-app py-16 md:py-24 max-w-3xl">
          <span className="eyebrow">{fallbackEyebrow}</span>
          <h1 className="heading-1 mt-4">
            {isAr ? 'محتوى هذه الصفحة قيد التحديث' : 'This page is being updated'}
          </h1>
          <p className="body-md mt-6 text-[var(--ink-3)]">
            {isAr
              ? 'سنعيد نشر المحتوى قريبًا. شكرًا لصبرك.'
              : 'Content will be republished soon. Thank you for your patience.'}
          </p>
        </div>
      </div>
    );
  }

  const title = isAr ? (page.title_ar ?? page.title) : (page.title ?? page.title_ar ?? '');
  const content = isAr ? (page.content_ar ?? page.content) : (page.content ?? page.content_ar ?? '');

  return (
    <div dir={dir} className="bg-[var(--cream)]">
      <div className="container-app py-16 md:py-24 max-w-3xl">
        <span className="eyebrow">{fallbackEyebrow}</span>
        <h1 className="heading-1 mt-4">{title}</h1>
        {page.updated_at && (
          <p className="text-sm text-[var(--ink-3)] mt-3 nums-latin">
            {isAr ? 'آخر تحديث: ' : 'Last updated: '}
            {formatDate(page.updated_at, '—', locale)}
          </p>
        )}
        <article
          className="mt-10 body-lg text-[var(--ink-2)]"
          style={{ whiteSpace: 'pre-wrap', lineHeight: 1.75 }}
        >
          {content}
        </article>
      </div>
    </div>
  );
}
