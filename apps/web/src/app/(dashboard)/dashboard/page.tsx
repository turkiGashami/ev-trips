'use client';

import Link from 'next/link';
import { Route, Eye, ThumbsUp, Users, Plus, Bell, CheckCircle2, MessageSquare, Car, ArrowUpRight, ArrowDownRight, ArrowLeft } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import TripCard from '@/components/trips/TripCard';
import { cn } from '@/lib/utils';

const recentTrips: any[] = [
  {
    id: '1',
    slug: 'riyadh-to-jeddah-tesla-model-3',
    title: 'من الرياض إلى جدة بتسلا موديل 3',
    departure_city: { name: 'Riyadh', name_ar: 'الرياض' },
    destination_city: { name: 'Jeddah', name_ar: 'جدة' },
    trip_date: '2026-03-15',
    departure_battery_pct: 95,
    arrival_battery_pct: 22,
    stop_count: 3,
    status: 'published',
    helpful_count: 147,
    view_count: 1832,
    favorite_count: 0,
    snap_brand_name: 'Tesla',
    snap_model_name: 'Model 3',
    snap_year: 2023,
    distance_km: 945,
    duration_minutes: 540,
    user: { id: 'u1', username: 'ahmed_ev', full_name: 'أحمد العتيبي', avatar_url: null },
  },
];

const notifications = [
  { id: '1', type: 'helpful',  message: 'أضاف محمد علامة "مفيدة" لرحلتك الرياض → جدة', time: 'منذ ساعة' },
  { id: '2', type: 'comment',  message: 'علّق خالد الشمري على رحلتك', time: 'منذ 3 ساعات' },
  { id: '3', type: 'approved', message: 'تمت الموافقة على رحلتك "الدمام إلى الرياض"', time: 'أمس' },
];

const TRIP_STATUSES = [
  { label: 'منشورة',  value: 38, color: 'bg-[var(--forest)]' },
  { label: 'معلقة',   value: 4,  color: 'bg-[var(--ink)]/60' },
  { label: 'مسودة',   value: 3,  color: 'bg-[var(--ink-3)]' },
  { label: 'مرفوضة', value: 1,  color: 'bg-[var(--terra)]' },
  { label: 'مؤرشفة', value: 1,  color: 'bg-[var(--ink-4)]' },
];

/* ── KPI CELL (data-first, no icon tiles) ── */
function KPI({
  label, value, unit, delta, icon: Icon,
}: {
  label: string;
  value: string | number;
  unit?: string;
  delta?: number;
  icon: any;
}) {
  const deltaPositive = (delta ?? 0) >= 0;
  return (
    <div className="border border-[var(--line)] bg-[var(--cream)] p-5 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-[var(--ink-3)]">
          <Icon className="h-3.5 w-3.5" />
          <span className="text-[11px] tracking-[0.1em] uppercase">{label}</span>
        </div>
        {delta !== undefined && (
          <span className={cn(
            'inline-flex items-center gap-0.5 text-xs nums-latin font-medium',
            deltaPositive ? 'text-[var(--forest)]' : 'text-[var(--terra)]'
          )}>
            {deltaPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {Math.abs(delta)}%
          </span>
        )}
      </div>
      <div className="flex items-baseline gap-1.5 nums-latin">
        <span className="text-[2.25rem] md:text-[2.5rem] font-medium text-[var(--ink)] leading-none tracking-tight">
          {value}
        </span>
        {unit && <span className="text-sm text-[var(--ink-3)]">{unit}</span>}
      </div>
    </div>
  );
}

const notifIcon: Record<string, React.ReactNode> = {
  helpful:  <ThumbsUp className="h-3.5 w-3.5" />,
  comment:  <MessageSquare className="h-3.5 w-3.5" />,
  approved: <CheckCircle2 className="h-3.5 w-3.5" />,
};

export default function DashboardPage() {
  const { user } = useAuthStore();

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'صباح الخير' : hour < 18 ? 'مساء الخير' : 'مساء النور';
  const today = new Date().toLocaleDateString('ar-SA', { weekday: 'long', day: 'numeric', month: 'long' });

  return (
    <div className="space-y-10">

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-5 pb-6 border-b border-[var(--line)]">
        <div>
          <span className="eyebrow">— {today}</span>
          <h1 className="mt-3 heading-1">
            {greeting}، <span className="italic font-light text-[var(--ink-2)]">{user?.full_name?.split(' ')[0] ?? 'مستخدم'}</span>
          </h1>
        </div>
        <Link href="/trips/new" className="btn-primary self-start sm:self-auto">
          <Plus className="h-4 w-4" />
          أضف رحلة جديدة
        </Link>
      </div>

      {/* KPI grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KPI label="رحلاتي" value={47} delta={12} icon={Route} />
        <KPI label="المشاهدات" value="14.2" unit="ألف" delta={8} icon={Eye} />
        <KPI label="تقييمات مفيدة" value={892} delta={5} icon={ThumbsUp} />
        <KPI label="المتابعون" value={312} delta={18} icon={Users} />
      </div>

      {/* Two-column content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

        {/* LEFT — trips + status */}
        <div className="lg:col-span-2 space-y-10">

          {/* Recent trips */}
          <section>
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--line)]">
              <div>
                <span className="eyebrow">— نشاطي</span>
                <h2 className="mt-2 heading-2">آخر رحلاتي</h2>
              </div>
              <Link href="/trips" className="link-editorial text-xs">عرض الكل</Link>
            </div>

            <div className="grid gap-4">
              {recentTrips.map((trip) => <TripCard key={trip.id} trip={trip} compact />)}
            </div>
          </section>

          {/* Status breakdown */}
          <section>
            <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--line)]">
              <div>
                <span className="eyebrow">— ملخص</span>
                <h2 className="mt-2 heading-2">حالة رحلاتي</h2>
              </div>
              <span className="text-xs text-[var(--ink-3)] nums-latin">
                إجمالي {TRIP_STATUSES.reduce((s, x) => s + x.value, 0)}
              </span>
            </div>

            {/* Stacked bar */}
            <div className="flex h-2 w-full overflow-hidden mb-5 border border-[var(--line)]">
              {TRIP_STATUSES.map((s) => (
                <div key={s.label} className={s.color} style={{ flex: s.value }} />
              ))}
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
              {TRIP_STATUSES.map((s) => (
                <div key={s.label} className="flex items-center gap-2.5">
                  <div className={cn('w-2 h-2', s.color)} />
                  <div>
                    <div className="text-xs text-[var(--ink-3)]">{s.label}</div>
                    <div className="nums-latin text-sm font-medium text-[var(--ink)]">{s.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        {/* RIGHT — notifications + quick actions */}
        <div className="space-y-8">

          {/* Notifications */}
          <section>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--line)]">
              <h3 className="heading-3">الإشعارات</h3>
              <Link href="/notifications" className="text-xs text-[var(--ink-3)] hover:text-[var(--ink)]">عرض الكل</Link>
            </div>
            <ul className="divide-y divide-[var(--line-soft)]">
              {notifications.map((n) => (
                <li key={n.id} className="py-4 flex gap-3">
                  <div className="h-7 w-7 shrink-0 rounded-full border border-[var(--line)] flex items-center justify-center text-[var(--ink-3)]">
                    {notifIcon[n.type] ?? notifIcon.approved}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[var(--ink-2)] leading-relaxed">{n.message}</p>
                    <p className="text-xs text-[var(--ink-4)] mt-1 nums-latin">{n.time}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          {/* Quick actions */}
          <section className="border border-[var(--line)]">
            <div className="px-5 py-4 border-b border-[var(--line)]">
              <span className="eyebrow">— روابط سريعة</span>
            </div>
            <nav>
              {[
                { href: '/trips/new',     label: 'أضف رحلة جديدة',  icon: Plus },
                { href: '/vehicles',      label: 'إدارة سياراتي',    icon: Car },
                { href: '/notifications', label: 'كل الإشعارات',     icon: Bell },
              ].map(({ href, label, icon: Icon }) => (
                <Link
                  key={href}
                  href={href}
                  className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm text-[var(--ink-2)] hover:bg-[var(--sand)]/60 hover:text-[var(--ink)] transition-colors border-t first:border-t-0 border-[var(--line-soft)]"
                >
                  <span className="flex items-center gap-3">
                    <Icon className="h-4 w-4 text-[var(--ink-3)]" />
                    {label}
                  </span>
                  <ArrowLeft className="h-3.5 w-3.5 text-[var(--ink-4)] flip-rtl" />
                </Link>
              ))}
            </nav>
          </section>
        </div>
      </div>
    </div>
  );
}
