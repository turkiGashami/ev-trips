'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Edit2, MapPin, Calendar, Route, Users, UserCheck, BadgeCheck, Star, Car, ArrowLeft,
} from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { usersApi } from '@/lib/api/users.api';
import { tripsApi } from '@/lib/api/trips.api';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { cn } from '@/lib/utils';

function Stat({
  label, value, unit, icon: Icon,
}: {
  label: string;
  value: number | string;
  unit?: string;
  icon: any;
}) {
  return (
    <div className="border border-[var(--line)] bg-[var(--cream)] p-5">
      <div className="flex items-center gap-2 text-[var(--ink-3)] mb-4">
        <Icon className="h-3.5 w-3.5" />
        <span className="text-[11px] tracking-[0.1em] uppercase">{label}</span>
      </div>
      <div className="flex items-baseline gap-1.5 nums-latin">
        <span className="text-[1.75rem] font-medium text-[var(--ink)] leading-none tracking-tight">
          {value}
        </span>
        {unit && <span className="text-xs text-[var(--ink-3)]">{unit}</span>}
      </div>
    </div>
  );
}

function QuickLink({
  href, label, icon: Icon, trailing,
}: {
  href: string;
  label: string;
  icon: any;
  trailing?: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 px-5 py-3.5 text-sm text-[var(--ink-2)] hover:bg-[var(--sand)]/60 hover:text-[var(--ink)] transition-colors border-t first:border-t-0 border-[var(--line-soft)]"
    >
      <span className="flex items-center gap-3">
        <Icon className="h-4 w-4 text-[var(--ink-3)]" />
        {label}
      </span>
      <span className="flex items-center gap-2">
        {trailing && <span className="text-xs text-[var(--ink-3)] nums-latin">{trailing}</span>}
        <ArrowLeft className="h-3.5 w-3.5 text-[var(--ink-4)] flip-rtl" />
      </span>
    </Link>
  );
}

export default function ProfilePage() {
  const { user: authUser } = useAuthStore();

  const profileQ = useQuery({
    queryKey: ['me', 'profile', authUser?.username],
    queryFn: () =>
      usersApi.getPublicProfile(authUser!.username).then((r) => r.data?.data),
    enabled: !!authUser?.username,
  });

  const statsQ = useQuery({
    queryKey: ['me', 'stats'],
    queryFn: () => usersApi.getMyStats().then((r) => r.data?.data ?? {}),
  });

  const myTripsQ = useQuery({
    queryKey: ['me', 'trips', 'recent'],
    queryFn: () => tripsApi.getMyTrips({ page: 1, limit: 3 }).then((r) => r.data),
  });

  const savedQ = useQuery({
    queryKey: ['me', 'saved-trips', 'count'],
    queryFn: () => usersApi.getMySavedTrips({ page: 1, limit: 1 }).then((r) => r.data),
  });

  const user: any = profileQ.data ?? authUser ?? {};
  const displayName = user?.full_name ?? user?.fullName ?? '';
  const username = user?.username ?? '';
  const bio = user?.bio ?? '';
  const joinedAt = user?.joined_at ?? user?.joinedAt ?? user?.created_at ?? '';
  const city = user?.city?.name_ar ?? user?.city?.name ?? user?.city ?? '';
  const isVerified = user?.is_contributor_verified ?? user?.isVerified ?? false;

  const stats = statsQ.data ?? {};
  const totalTrips = Number((stats as any).total_trips ?? 0);
  const totalViews = Number((stats as any).total_views ?? 0);
  const totalFavorites = Number((stats as any).total_favorites ?? 0);
  const reputation = Number((stats as any).contributor_points ?? 0);
  const savedCount = Number(savedQ.data?.meta?.total ?? 0);
  const recentTrips: any[] = Array.isArray(myTripsQ.data?.data) ? myTripsQ.data!.data : [];

  const joinedLabel = joinedAt
    ? new Date(joinedAt).toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })
    : '';

  const initials = (displayName || username || 'م')
    .split(' ')
    .map((p: string) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto space-y-10">

        {/* Header card */}
        <section className="border border-[var(--line)] bg-[var(--cream)] p-6 md:p-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-5">
            <div className="flex items-start gap-4">
              <div className="h-16 w-16 rounded-full border border-[var(--line)] bg-[var(--sand)] flex items-center justify-center text-lg font-medium text-[var(--ink)] shrink-0">
                {initials}
              </div>
              <div className="min-w-0">
                <span className="eyebrow">— ملفّي الشخصي</span>
                <h1 className="heading-2 mt-2 flex items-center gap-2 flex-wrap">
                  {displayName || username}
                  {isVerified && (
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--forest)] border border-[var(--forest)]/30 bg-[var(--forest)]/5 px-2 py-0.5 rounded-[2px]">
                      <BadgeCheck className="h-3 w-3" />
                      موثّق
                    </span>
                  )}
                </h1>
                <p className="text-sm text-[var(--ink-3)] nums-latin mt-1">@{username}</p>

                {bio && (
                  <p className="text-sm text-[var(--ink-2)] leading-relaxed mt-3 max-w-lg">
                    {bio}
                  </p>
                )}

                <div className="flex items-center gap-4 flex-wrap text-xs text-[var(--ink-3)] mt-4">
                  {joinedLabel && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="h-3.5 w-3.5" />
                      انضم {joinedLabel}
                    </span>
                  )}
                  {city && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="h-3.5 w-3.5" />
                      {city}
                    </span>
                  )}
                  {reputation > 0 && (
                    <span className="flex items-center gap-1.5 nums-latin">
                      <Star className="h-3.5 w-3.5" />
                      {reputation} نقطة
                    </span>
                  )}
                </div>
              </div>
            </div>

            <Link href="/profile/edit" className="btn-secondary self-start sm:self-auto text-sm">
              <Edit2 className="h-4 w-4" />
              تعديل الملف
            </Link>
          </div>
        </section>

        {/* Stats grid */}
        <section>
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--line)]">
            <span className="eyebrow">— أرقامي</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
            <Stat label="رحلاتي"    value={totalTrips}     icon={Route} />
            <Stat label="المشاهدات" value={totalViews}     icon={Users} />
            <Stat label="المفضلات"  value={totalFavorites} icon={Star} />
            <Stat label="النقاط"    value={reputation}     icon={BadgeCheck} />
          </div>
        </section>

        {/* Recent trips */}
        <section>
          <div className="flex items-center justify-between pb-4 mb-5 border-b border-[var(--line)]">
            <div>
              <span className="eyebrow">— نشاطي</span>
              <h2 className="mt-2 heading-3">آخر رحلاتي</h2>
            </div>
            <Link href="/trips" className="link-editorial text-xs">عرض الكل</Link>
          </div>

          {myTripsQ.isLoading ? (
            <p className="text-sm text-[var(--ink-3)] py-4">جارٍ التحميل…</p>
          ) : recentTrips.length === 0 ? (
            <div className="text-center py-10 border border-dashed border-[var(--line)]">
              <Route className="h-6 w-6 mx-auto text-[var(--ink-4)] mb-3" />
              <p className="text-sm text-[var(--ink-2)] mb-1">لم توثّق أي رحلة بعد</p>
              <p className="text-xs text-[var(--ink-3)] mb-4">ابدأ الآن وشارك تجربتك مع المجتمع</p>
              <Link href="/trips/new" className="btn-primary text-sm">أضف رحلة جديدة</Link>
            </div>
          ) : (
            <ul className="border border-[var(--line)] divide-y divide-[var(--line-soft)]">
              {recentTrips.map((t: any) => (
                <li key={t.id}>
                  <Link
                    href={`/trips/${t.slug}`}
                    className="flex items-center justify-between gap-3 px-5 py-4 hover:bg-[var(--sand)]/60 transition-colors"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--ink)] truncate">
                        {(t.departure_city?.name_ar ?? t.departure_city?.name ?? '—')} ← {(t.destination_city?.name_ar ?? t.destination_city?.name ?? '—')}
                      </p>
                      <p className="text-xs text-[var(--ink-3)] mt-0.5 nums-latin">
                        {t.trip_date ? new Date(t.trip_date).toLocaleDateString('ar-SA') : ''}
                      </p>
                    </div>
                    <span className={cn(
                      'text-[10px] uppercase tracking-[0.1em] border px-2 py-0.5 rounded-[2px]',
                      t.status === 'published'      && 'border-[var(--forest)]/30 text-[var(--forest)]',
                      t.status === 'pending_review' && 'border-[var(--ink)]/30 text-[var(--ink-2)]',
                      t.status === 'draft'          && 'border-[var(--line)] text-[var(--ink-3)]',
                      t.status === 'rejected'       && 'border-[var(--terra)]/30 text-[var(--terra)]',
                    )}>
                      {t.status === 'published' ? 'منشورة'
                        : t.status === 'pending_review' ? 'قيد المراجعة'
                        : t.status === 'draft' ? 'مسودة'
                        : t.status === 'rejected' ? 'مرفوضة'
                        : t.status}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Quick links */}
        <section className="border border-[var(--line)]">
          <div className="px-5 py-4 border-b border-[var(--line)]">
            <span className="eyebrow">— اختصارات</span>
          </div>
          <nav>
            <QuickLink href="/trips"        label="رحلاتي"            icon={Route} trailing={`${totalTrips}`} />
            <QuickLink href="/saved-trips"  label="الرحلات المحفوظة"  icon={Star}  trailing={`${savedCount}`} />
            <QuickLink href="/vehicles"     label="سياراتي"           icon={Car} />
            <QuickLink href="/profile/edit" label="تعديل الملف"       icon={Edit2} />
          </nav>
        </section>
      </div>
    </ProtectedRoute>
  );
}
