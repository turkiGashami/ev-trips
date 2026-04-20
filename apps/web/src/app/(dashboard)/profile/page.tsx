'use client';

import React from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  Edit2,
  MapPin,
  Calendar,
  Route,
  Users,
  UserCheck,
  BadgeCheck,
  Star,
} from 'lucide-react';
import { useAuthStore } from '../../../store/auth.store';
import { usersApi } from '../../../lib/api/users.api';
import { Avatar } from '../../../components/ui/Avatar';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { PageSpinner } from '../../../components/ui/Spinner';
import { ProtectedRoute } from '../../../components/auth/ProtectedRoute';
import { formatDate, formatNumber } from '../../../lib/utils';

// ─── Stat card ───────────────────────────────────────────────────────────────

function StatCard({
  icon,
  value,
  label,
  color,
}: {
  icon: React.ReactNode;
  value: number | string;
  label: string;
  color: string;
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 text-center">
      <div
        className={`w-11 h-11 rounded-xl flex items-center justify-center mx-auto mb-3 ${color}`}
      >
        {icon}
      </div>
      <p className="text-2xl font-bold text-gray-900">{value}</p>
      <p className="text-sm text-gray-500 mt-0.5">{label}</p>
    </div>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function ProfilePage() {
  const { user: authUser } = useAuthStore();

  // Fetch full public profile with stats
  const { data: profile, isLoading } = useQuery({
    queryKey: ['profile', authUser?.username],
    queryFn: () =>
      usersApi.getPublicProfile(authUser!.username).then((r) => r.data.data),
    enabled: !!authUser?.username,
  });

  // Merge auth store fields with fetched profile (profile takes precedence when available)
  const user = profile ?? authUser;

  const displayName = (user as any)?.fullName ?? (user as any)?.full_name ?? '';
  const username = user?.username ?? '';
  const bio = (user as any)?.bio ?? '';
  const joinedAt = (user as any)?.joinedAt ?? (user as any)?.joined_at ?? '';
  const avatarUrl = (user as any)?.avatarUrl ?? (user as any)?.avatar_url ?? undefined;
  const isVerified =
    (user as any)?.isVerified ?? (user as any)?.is_contributor_verified ?? false;

  const stats = (user as any)?.stats;
  const tripsCount = stats?.tripsCount ?? 0;
  const savedTripsCount = stats?.savedTripsCount ?? 0;
  const reputation = stats?.reputation ?? 0;

  return (
    <ProtectedRoute>
      <div className="max-w-3xl mx-auto space-y-6">
        {isLoading && !authUser ? (
          <PageSpinner />
        ) : (
          <>
            {/* Profile card */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              {/* Cover gradient */}
              <div className="h-28 bg-gradient-to-l from-emerald-500 to-emerald-700" />

              <div className="px-6 pb-6">
                {/* Avatar & edit button row */}
                <div className="flex items-end justify-between -mt-10 mb-4">
                  <div className="relative">
                    <Avatar
                      src={avatarUrl}
                      name={displayName || username || 'م'}
                      size="xl"
                      verified={isVerified}
                      className="ring-4 ring-white"
                    />
                    {isVerified && (
                      <span className="absolute -bottom-1 -end-1 bg-emerald-500 rounded-full p-0.5">
                        <BadgeCheck className="w-4 h-4 text-white" />
                      </span>
                    )}
                  </div>
                  <Link href="/profile/edit">
                    <Button variant="outline" size="sm" leftIcon={<Edit2 className="w-4 h-4" />}>
                      تعديل الملف الشخصي
                    </Button>
                  </Link>
                </div>

                {/* Name & username */}
                <div className="mb-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h1 className="text-xl font-bold text-gray-900">{displayName}</h1>
                    {isVerified && (
                      <Badge variant="green" size="sm">
                        <BadgeCheck className="w-3 h-3 me-1" />
                        موثّق
                      </Badge>
                    )}
                  </div>
                  <p className="text-gray-500 text-sm mt-0.5">@{username}</p>
                </div>

                {/* Bio */}
                {bio && (
                  <p className="text-gray-700 text-sm leading-relaxed mb-4 max-w-lg">{bio}</p>
                )}

                {/* Meta info */}
                <div className="flex items-center gap-4 flex-wrap text-sm text-gray-500">
                  {joinedAt && (
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      انضم {formatDate(joinedAt)}
                    </span>
                  )}
                  {(user as any)?.city && (
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-4 h-4 text-gray-400" />
                      {(user as any).city}
                    </span>
                  )}
                  {reputation > 0 && (
                    <span className="flex items-center gap-1.5">
                      <Star className="w-4 h-4 text-amber-400" />
                      {reputation} نقطة
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Stats grid */}
            <div className="grid grid-cols-3 gap-4">
              <StatCard
                icon={<Route className="w-5 h-5 text-emerald-600" />}
                value={tripsCount}
                label="الرحلات"
                color="bg-emerald-50"
              />
              <StatCard
                icon={<Users className="w-5 h-5 text-blue-600" />}
                value={stats?.followersCount ?? 0}
                label="المتابعون"
                color="bg-blue-50"
              />
              <StatCard
                icon={<UserCheck className="w-5 h-5 text-purple-600" />}
                value={stats?.followingCount ?? 0}
                label="يتابع"
                color="bg-purple-50"
              />
            </div>

            {/* Additional stats row */}
            {(savedTripsCount > 0 || (stats?.totalDistance ?? 0) > 0) && (
              <div className="grid grid-cols-2 gap-4">
                {savedTripsCount > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
                      <Star className="w-5 h-5 text-amber-500" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">{savedTripsCount}</p>
                      <p className="text-sm text-gray-500">رحلة محفوظة</p>
                    </div>
                  </div>
                )}
                {(stats?.totalDistance ?? 0) > 0 && (
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                      <Route className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-gray-900">
                        {formatNumber(stats?.totalDistance)}
                      </p>
                      <p className="text-sm text-gray-500">كيلومتر موثّق</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick links */}
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              <Link
                href="/trips"
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors rounded-t-2xl group"
              >
                <div className="flex items-center gap-3">
                  <Route className="w-5 h-5 text-emerald-500" />
                  <span className="text-sm font-medium text-gray-700">رحلاتي</span>
                </div>
                <span className="text-gray-400 group-hover:text-gray-600 text-sm">
                  {tripsCount} رحلة ←
                </span>
              </Link>
              <Link
                href="/saved-trips"
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <Star className="w-5 h-5 text-amber-500" />
                  <span className="text-sm font-medium text-gray-700">الرحلات المحفوظة</span>
                </div>
                <span className="text-gray-400 group-hover:text-gray-600 text-sm">
                  {savedTripsCount} رحلة ←
                </span>
              </Link>
              <Link
                href="/vehicles"
                className="flex items-center justify-between px-5 py-4 hover:bg-gray-50 transition-colors rounded-b-2xl group"
              >
                <div className="flex items-center gap-3">
                  <Users className="w-5 h-5 text-blue-500" />
                  <span className="text-sm font-medium text-gray-700">سياراتي</span>
                </div>
                <span className="text-gray-400 group-hover:text-gray-600 text-sm">إدارة ←</span>
              </Link>
            </div>
          </>
        )}
      </div>
    </ProtectedRoute>
  );
}
