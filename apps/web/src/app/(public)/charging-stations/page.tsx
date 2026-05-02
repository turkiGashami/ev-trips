import Link from 'next/link';
import { Zap, MapPin } from 'lucide-react';
import { buildPageMetadata } from '@/lib/seo';

export const metadata = buildPageMetadata({
  path: '/charging-stations',
  title: 'محطات الشحن',
  description:
    'دليل محطات الشحن السريع للسيارات الكهربائية في السعودية والوطن العربي — مواقع، أسعار، وتقييمات حقيقية من مالكي EV.',
  keywords: [
    'محطات شحن',
    'شحن سيارات كهربائية',
    'EV charging Saudi Arabia',
    'محطات شحن سريع',
    'شاحن تيسلا',
  ],
});

export default function ChargingStationsPage() {
  return (
    <div dir="rtl" className="bg-[var(--cream)]">
      <div className="container-app py-16 md:py-24 max-w-3xl">
        <span className="eyebrow">— محطات الشحن</span>
        <h1 className="heading-1 mt-4">دليل محطات الشحن</h1>
        <p className="body-md mt-4 text-[var(--ink-3)]">
          نعمل حاليًا على خريطة تفاعلية لجميع محطات الشحن السريع في المنطقة،
          مع تحديثات مباشرة عن حالة كل محطة.
        </p>

        <div className="mt-12 border border-[var(--line)] bg-[var(--sand)]/40 py-20 px-6 text-center">
          <div className="w-14 h-14 border border-[var(--line)] bg-[var(--cream)] flex items-center justify-center mx-auto mb-6">
            <Zap className="w-6 h-6 text-[var(--forest)]" />
          </div>
          <span className="eyebrow">— قريبًا</span>
          <h2 className="heading-2 mt-3">خريطة محطات الشحن</h2>
          <p className="body-md mt-3 max-w-md mx-auto text-[var(--ink-3)]">
            نُطوِّر حاليًا دليلًا شاملًا لمحطات الشحن مع بيانات من المجتمع.
            تابعنا للحصول على التحديثات.
          </p>
          <div className="mt-8 flex items-center justify-center gap-3">
            <Link href="/search" className="btn-primary text-sm">
              <MapPin className="h-4 w-4" />
              استكشف الرحلات
            </Link>
            <Link href="/about" className="btn-secondary text-sm">عن المنصة</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
