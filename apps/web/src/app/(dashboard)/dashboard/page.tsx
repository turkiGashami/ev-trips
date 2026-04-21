'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Route, Eye, ThumbsUp, Users, Plus, Bell, CheckCircle2, MessageSquare,
  Car, ArrowUpRight, ArrowLeft, Star, UserPlus, Inbox,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { usersApi } from '@/lib/api/users.api';
import { tripsApi } from '@/lib/api/trips.api';
import { notificationsApi } from '@/lib/api/notifications.api';
import TripCard from '@/components/trips/TripCard';
import { cn } from '@/lib/utils';

/* ── KPI CELL (data-first, no icon tiles) ── */
function KPI({
  label, value, unit, icon: Icon, loading,
}: {
  label: string;
  value: string | number;
  unit?: string;
  icon: any;
  loading?: boolean;
}) {
  return (
    <div className="border border-[var(--line)] bg-[var(--cream)] p-5 md:p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-[var(--ink-3)]">
          <Icon className="h-3.5 w-3.5" />
          <span className="text-[11px] tracking-[0.1em] uppercase">{label}</span>
        </div>
      </div>
      <div className="flex items-baseline gap-1.5 nums-latin">
        <span className="text-[2.25rem] md:text-[2.5rem] font-medium text-[var(--ink)] leading-none tracking-tight">
          {loading ? '—' : value}
        </span>
        {unit && <span className="text-sm text-[var(--ink-3)]">{unit}</span>}
      </div>
    </div>
  );
}

const STATUS_LABELS: Record<string, { label: string; color: string }> = {
  published:      { label: 'منشورة',  color: 'bg-[var(--forest)]' },
  pending_review: { label: 'قيد المراجعة', color: 'bg-[var(--ink)]/60' },
  draft:          { label: 'مسودة',   color: 'bg-[var(--ink-3)]' },
  rejected:       { label: 'مرفوضة', color: 'bg-[var(--terra)]' },
  hidden:         { label: 'مخفية',   color: 'bg-[var(--ink-4)]' },
  archived:       { label: 'مؤرشفة', color: 'bg-[var(--ink-4)]' },
};

const NOTIF_ICON: Record<string, React.ReactNode> = {
  helpful_reaction: <ThumbsUp className="h-3.5 w-3.5" />,
  comment:          <MessageSquare className="h-3.5 w-3.5" />,
  reply:            <MessageSquare className="h-3.5 w-3.5" />,
  favorite:         <Star className="h-3.5 w-3.5" />,
  follow:           <UserPlus className="h-3.5 w-3.5" />,
  trip_approved:    <CheckCircle2 className="h-3.5 w-3.5" />,
  trip_rejected:    <CheckCircle2 className="h-3.5 w-3.5" />,
  system:           <Bell className="h-3.5 w-3.5" />,
};

function formatShort(n: number | undefined | null): { value: string; unit?: string } {
  const v = Number(n ?? 0);
  if (v >= 1000) return { value: (v / 1000).toFixed(1), unit: 'ألف' };
  return { value: String(v) };
}

function relativeTime(iso?: string): string {
  if (!iso) return '';
  const diff = (Date.now() - new Date(iso).getTime()) / 1000;
  if (diff < 60) return 'الآن';
  if (diff < 3600) return `منذ ${Math.floor(diff / 60)} د`;
  if (diff < 86400) return `منذ ${Math.floor(diff / 3600)} س`;
  if (diff < 86400 * 7) return `منذ ${Math.floor(diff / 86400)} يوم`;
  return new Date(iso).toLocaleDateString('ar-SA');
}

export default function DashboardPage() {
  const { user } = useAuthStore();

  // Real user stats
  const statsQ = useQuery({
    queryKey: ['me', 'stats'],
    queryFn: () => usersApi.getMyStats().then((r) => r.data?.data ?? {}),
  });

  // Recent trips (display) + totals/buckets from a wider fetch
  const recentTripsQ = useQuery({
    queryKey: ['me', 'trips', 'recent'],
    queryFn: () => tripsApi.getMyTrips({ page: 1, limit: 5 }).then((r) => r.data),
  });

  const allMyTripsQ = useQuery({
    queryKey: ['me', 'trips', 'all-for-buckets'],
    queryFn: () => tripsApi.getMyTrips({ page: 1, limit: 100 }).then((r) => r.data),
  });

  const notificationsQ = useQuery({
    queryKey: ['me', 'notifications', 'recent'],
    queryFn: () => notificationsApi.getAll({ limit: 5 }).then((r) => r.data),
  });

  const stats = statsQ.data ?? {};
  const totalTrips = Number((stats as any).total_trips ?? 0);
  const totalViews = Number((stats as any).total_views ?? 0);
  const totalFavorites = Number((stats as any).total_favorites ?? 0);
  const reputation = Number((stats as any).contributor_points ?? 0);

  const recentTrips: any[] = Array.isArray(recentTripsQ.data?.data) ? recentTripsQ.data!.data : [];
  const allTrips: any[] = Array.isArray(allMyTripsQ.data?.data) ? allMyTripsQ.data!.data : [];
  const notifications: any[] = Array.isArray(notificationsQ.data?.data) ? notificationsQ.data!.data : [];

  // Compute status buckets from the user's own trips only
  const buckets = allTrips.reduce<Record<string, number>>((acc, t) => {
    const s = t?.status ?? 'draft';
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});
  const bucketOrder = ['published', 'pending_review', 'draft', 'rejected', 'hidden', 'archived'];
  const statusRows = bucketOrder
    .filter((k) => (buckets[k] ?? 0) > 0)
    .map((k) => ({ key: k, label: STATUS_LABELS[k].label, color: STATUS_LABELS[k].color, value: buckets[k] }));
  const totalBuckets = statusRows.reduce((s, x) => s + x.value, 0);

  const views = formatShort(totalViews);

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

      {/* KPI grid — real user data only */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KPI label="رحلاتي" value={totalTrips} icon={Route} loading={statsQ.isLoading} />
        <KPI label="المشاهدات" value={views.value} unit={views.unit} icon={Eye} loading={statsQ.isLoading} />
        <KPI label="المفضلات" value={totalFavorites} icon={ThumbsUp} loading={statsQ.isLoading} />
        <KPI label="نقاط المساهمة" value={reputation} icon={Users} loading={statsQ.isLoading} />
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

            {recentTripsQ.isLoading ? (
              <p className="text-sm text-[var(--ink-3)] py-6">جارٍ التحميل…</p>
            ) : recentTrips.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-[var(--line)]">
                <Route className="h-6 w-6 mx-auto text-[var(--ink-4)] mb-3" />
                <p className="text-sm text-[var(--ink-2)] mb-1">لم توثّق أي رحلة بعد</p>
                <p className="text-xs text-[var(--ink-3)] mb-4">ابدأ بتسجيل أول رحلة وساعد مجتمع EV</p>
                <Link href="/trips/new" className="btn-primary text-sm">
                  <Plus className="h-3.5 w-3.5" />
                  أضف رحلة جديدة
                </Link>
              </div>
            ) : (
              <div className="grid gap-4">
                {recentTrips.map((trip) => <TripCard key={trip.id} trip={trip} compact />)}
              </div>
            )}
          </section>

          {/* Status breakdown */}
          {statusRows.length > 0 && (
            <section>
              <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--line)]">
                <div>
                  <span className="eyebrow">— ملخص</span>
                  <h2 className="mt-2 heading-2">حالة رحلاتي</h2>
                </div>
                <span className="text-xs text-[var(--ink-3)] nums-latin">
                  إجمالي {totalBuckets}
                </span>
              </div>

              <div className="flex h-2 w-full overflow-hidden mb-5 border border-[var(--line)]">
                {statusRows.map((s) => (
                  <div key={s.key} className={s.color} style={{ flex: s.value }} />
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
                {statusRows.map((s) => (
                  <div key={s.key} className="flex items-center gap-2.5">
                    <div className={cn('w-2 h-2', s.color)} />
                    <div>
                      <div className="text-xs text-[var(--ink-3)]">{s.label}</div>
                      <div className="nums-latin text-sm font-medium text-[var(--ink)]">{s.value}</div>
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* RIGHT — notifications + quick actions */}
        <div className="space-y-8">

          {/* Notifications */}
          <section>
            <div className="flex items-center justify-between pb-4 mb-4 border-b border-[var(--line)]">
              <h3 className="heading-3">الإشعارات</h3>
              <Link href="/notifications" className="text-xs text-[var(--ink-3)] hover:text-[var(--ink)]">عرض الكل</Link>
            </div>
            {notificationsQ.isLoading ? (
              <p className="text-sm text-[var(--ink-3)] py-4">…</p>
            ) : notifications.length === 0 ? (
              <div className="py-8 text-center border border-dashed border-[var(--line)]">
                <Inbox className="h-5 w-5 mx-auto text-[var(--ink-4)] mb-2" />
                <p className="text-sm text-[var(--ink-3)]">لا توجد إشعارات بعد</p>
              </div>
            ) : (
              <ul className="divide-y divide-[var(--line-soft)]">
                {notifications.map((n: any) => (
                  <li key={n.id} className="py-4 flex gap-3">
                    <div className="h-7 w-7 shrink-0 rounded-full border border-[var(--line)] flex items-center justify-center text-[var(--ink-3)]">
                      {NOTIF_ICON[n.type] ?? NOTIF_ICON.system}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-[var(--ink-2)] leading-relaxed">
                        {n.message ?? n.title ?? 'إشعار'}
                      </p>
                      <p className="text-xs text-[var(--ink-4)] mt-1 nums-latin">
                        {relativeTime(n.created_at ?? n.createdAt)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
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
