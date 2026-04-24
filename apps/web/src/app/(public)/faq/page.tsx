import { getLocale } from 'next-intl/server';
import { getApiBaseUrl } from '@/lib/utils';

export const revalidate = 60;
export const metadata = { title: 'الأسئلة الشائعة | رحلات EV' };

type FaqItem = {
  id: string;
  question_ar: string;
  question_en: string | null;
  answer_ar: string;
  answer_en: string | null;
  sort_order: number;
};

async function fetchFaqs(): Promise<FaqItem[]> {
  try {
    const res = await fetch(`${getApiBaseUrl()}/api/v1/faqs`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json?.data ?? json ?? [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function FAQPage() {
  const locale = await getLocale();
  const isAr = locale.startsWith('ar');
  const dir = isAr ? 'rtl' : 'ltr';
  const faqs = await fetchFaqs();

  return (
    <div dir={dir} className="bg-[var(--cream)]">
      <div className="container-app py-16 md:py-24 max-w-3xl">
        <span className="eyebrow">{isAr ? '— الأسئلة الشائعة' : '— FAQ'}</span>
        <h1 className="heading-1 mt-4">
          {isAr ? 'الأسئلة الشائعة' : 'Frequently Asked Questions'}
        </h1>
        <p className="body-md mt-6 text-[var(--ink-3)]">
          {isAr
            ? 'تجد هنا إجابات للأسئلة الأكثر شيوعاً. لم تجد إجابة؟ تواصل معنا.'
            : 'Find answers to the most common questions. Didn’t find yours? Contact us.'}
        </p>

        {faqs.length === 0 ? (
          <p className="body-md mt-12 text-[var(--ink-4)]">
            {isAr ? 'سنضيف الأسئلة قريباً.' : 'Questions will be added soon.'}
          </p>
        ) : (
          <div className="mt-10 divide-y divide-[var(--line)] border-y border-[var(--line)]">
            {faqs.map((faq) => {
              const question = isAr ? faq.question_ar : (faq.question_en || faq.question_ar);
              const answer = isAr ? faq.answer_ar : (faq.answer_en || faq.answer_ar);
              return (
                <details key={faq.id} className="group py-5">
                  <summary className="cursor-pointer list-none flex items-center justify-between gap-4">
                    <h3 className="heading-3 text-base md:text-lg flex-1">{question}</h3>
                    <span
                      aria-hidden
                      className="text-[var(--ink-4)] group-open:rotate-45 transition-transform text-xl leading-none"
                    >
                      +
                    </span>
                  </summary>
                  <div className="mt-3 body-md text-[var(--ink-2)] leading-relaxed whitespace-pre-wrap">
                    {answer}
                  </div>
                </details>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
