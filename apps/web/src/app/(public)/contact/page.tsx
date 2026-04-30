import { getLocale } from 'next-intl/server';
import ContactForm from './ContactForm';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  path: '/contact',
  title: 'تواصل معنا',
  description: 'تواصل مع فريق رحلات EV — اقتراحات، شراكات، إعلانات، أو استفسارات حول السيارات الكهربائية.',
  keywords: ['تواصل', 'اتصل بنا', 'EV contact'],
});

export default async function ContactPage() {
  const locale = await getLocale();
  const isAr = locale.startsWith('ar');
  const dir = isAr ? 'rtl' : 'ltr';

  return (
    <div dir={dir} className="bg-[var(--cream)]">
      <div className="container-app py-16 md:py-24 max-w-3xl">
        <span className="eyebrow">{isAr ? '— تواصل معنا' : '— Contact us'}</span>
        <h1 className="heading-1 mt-4">
          {isAr ? 'تواصل معنا' : 'Get in touch'}
        </h1>
        <p className="body-md mt-6 text-[var(--ink-3)]">
          {isAr
            ? 'عندك اقتراح أو سؤال أو واجهتك مشكلة؟ نحب نسمع منك. عبّي النموذج وبنرد عليك قريباً.'
            : 'Have a suggestion, question, or issue? Fill the form and we’ll get back to you shortly.'}
        </p>

        <div className="mt-10">
          <ContactForm locale={locale} />
        </div>
      </div>
    </div>
  );
}
