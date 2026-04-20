import Link from 'next/link';
import { ArrowLeft, Route } from 'lucide-react';

export const metadata = { title: 'المسارات الشائعة | رحلات EV' };

const FEATURED = [
  { from: 'الرياض', to: 'جدة', distance: '950', trips: 18 },
  { from: 'الرياض', to: 'الدمام', distance: '400', trips: 24 },
  { from: 'جدة', to: 'مكة', distance: '85', trips: 31 },
  { from: 'الرياض', to: 'أبها', distance: '900', trips: 9 },
  { from: 'الدمام', to: 'الرياض', distance: '400', trips: 12 },
  { from: 'جدة', to: 'المدينة', distance: '420', trips: 15 },
];

export default function PopularRoutesPage() {
  return (
    <div dir="rtl" className="bg-[var(--cream)]">
      <div className="container-app py-16 md:py-24">
        <div className="max-w-3xl">
          <span className="eyebrow">— المسارات الشائعة</span>
          <h1 className="heading-1 mt-4">أكثر المسارات توثيقًا</h1>
          <p className="body-md mt-4 text-[var(--ink-3)]">
            مسارات وثّقها المجتمع مرارًا. كل مسار يجمع تجارب حقيقية مع تفاصيل
            البطارية، الشحن، والمدة.
          </p>
        </div>

        <div className="mt-12 grid gap-px bg-[var(--line)] border border-[var(--line)] md:grid-cols-2 lg:grid-cols-3">
          {FEATURED.map((r) => {
            const href = `/search?q=${encodeURIComponent(r.from + ' ' + r.to)}`;
            return (
              <Link
                key={`${r.from}-${r.to}`}
                href={href}
                className="bg-[var(--cream)] p-6 hover:bg-[var(--sand)]/50 transition-colors group"
              >
                <div className="flex items-center gap-2 text-[var(--ink-3)] text-xs mb-3">
                  <Route className="h-3.5 w-3.5" />
                  <span>مسار</span>
                </div>
                <div className="flex items-center gap-3 text-lg font-medium text-[var(--ink)] tracking-tight">
                  <span>{r.from}</span>
                  <ArrowLeft className="h-4 w-4 text-[var(--ink-3)] group-hover:text-[var(--forest)] transition-colors flip-rtl" />
                  <span>{r.to}</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-xs text-[var(--ink-3)]">
                  <span className="nums-latin">{r.distance} كم</span>
                  <span className="nums-latin">{r.trips} رحلة</span>
                </div>
              </Link>
            );
          })}
        </div>

        <div className="mt-12 text-center">
          <Link href="/search" className="link-editorial text-sm">
            استعرض كل الرحلات
          </Link>
        </div>
      </div>
    </div>
  );
}
