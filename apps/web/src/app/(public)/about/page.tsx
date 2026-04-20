export const metadata = { title: 'عن المنصة | رحلات EV' };

export default function AboutPage() {
  return (
    <div dir="rtl" className="bg-[var(--cream)]">
      <div className="container-app py-16 md:py-24 max-w-3xl">
        <span className="eyebrow">— عن المنصة</span>
        <h1 className="heading-1 mt-4">وثّق رحلتك. ساعد المجتمع.</h1>
        <p className="body-lg mt-6 text-[var(--ink-2)]">
          منصة <span className="font-medium text-[var(--ink)]">رحلات EV</span> مجتمعٌ عربيّ مستقلّ
          لمستخدمي السيارات الكهربائية. نشارك تجاربنا الحقيقية على الطريق —
          استهلاك البطارية، محطات الشحن، ظروف الطقس — حتى يقود الجميع بثقة أكبر.
        </p>
        <p className="body-md mt-6 text-[var(--ink-3)]">
          كل رحلة موثّقة هنا تُضاف إلى قاعدة بيانات مفتوحة تُساعد السائقين على التخطيط الأذكى،
          وتُقدّم رؤية واقعية عن مدى السيارات الكهربائية في المنطقة.
        </p>

        <div className="mt-12 border-t border-[var(--line)] pt-10 grid gap-8 md:grid-cols-3">
          {[
            { eyebrow: '— الهدف', title: 'تجارب حقيقية', text: 'بلا تسويق. بلا مبالغات. أرقامٌ من الطريق.' },
            { eyebrow: '— المجتمع', title: 'عربي أولاً', text: 'واجهة من اليمين لليسار، محتوى عربي كأصل.' },
            { eyebrow: '— المصدر', title: 'بيانات مفتوحة', text: 'مشاركة مجانية لكل رحلة لفائدة الجميع.' },
          ].map((b) => (
            <div key={b.title}>
              <span className="eyebrow">{b.eyebrow}</span>
              <h3 className="heading-3 mt-2">{b.title}</h3>
              <p className="body-md mt-2 text-[var(--ink-3)]">{b.text}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
