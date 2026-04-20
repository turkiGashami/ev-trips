export const metadata = { title: 'الأسئلة الشائعة | رحلات EV' };

const FAQS = [
  {
    q: 'ما هي منصة رحلات EV؟',
    a: 'منصة مجتمعية عربية لتوثيق ومشاركة رحلات السيارات الكهربائية: البطارية، المسافة، الشحن، الطقس، وأسلوب القيادة.',
  },
  {
    q: 'هل المنصة مجانية؟',
    a: 'نعم، كل الميزات الأساسية مجانية للمستخدمين.',
  },
  {
    q: 'كيف أضيف رحلة؟',
    a: 'سجّل حسابًا، ثم اذهب إلى "رحلاتي" واختر "إضافة رحلة". اتبع الخطوات الخمس لإدخال تفاصيل الرحلة.',
  },
  {
    q: 'هل تُراجَع الرحلات قبل النشر؟',
    a: 'نعم، كل رحلة تمر بمراجعة سريعة للتأكد من جودة البيانات قبل النشر على المجتمع.',
  },
  {
    q: 'هل بياناتي الشخصية آمنة؟',
    a: 'نعم. نحن لا نشارك بياناتك مع أطراف ثالثة. راجع سياسة الخصوصية للتفاصيل.',
  },
  {
    q: 'هل التطبيق متاح على الموبايل؟',
    a: 'نعمل حاليًا على تطبيق موبايل. في الوقت الراهن، الموقع يعمل جيدًا على جميع الأجهزة.',
  },
];

export default function FAQPage() {
  return (
    <div dir="rtl" className="bg-[var(--cream)]">
      <div className="container-app py-16 md:py-24 max-w-3xl">
        <span className="eyebrow">— الأسئلة الشائعة</span>
        <h1 className="heading-1 mt-4">أسئلة قد تخطر لك</h1>
        <p className="body-md mt-4 text-[var(--ink-3)]">
          إجابات مباشرة عن أكثر الأسئلة تكرارًا.
        </p>

        <div className="mt-12 divide-y divide-[var(--line)] border-y border-[var(--line)]">
          {FAQS.map((f, i) => (
            <details key={i} className="group py-5">
              <summary className="flex justify-between items-center cursor-pointer list-none">
                <h3 className="text-base md:text-lg font-medium text-[var(--ink)] tracking-tight">
                  {f.q}
                </h3>
                <span className="text-[var(--ink-3)] text-xl transition-transform group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="mt-3 body-md text-[var(--ink-2)]">{f.a}</p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
