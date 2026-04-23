import { notFound } from 'next/navigation';
import { getTranslations } from 'next-intl/server';
import TripCard from '@/components/trips/TripCard';
import Avatar from '@/components/ui/Avatar';
import { formatNumber, formatDate, getApiBaseUrl } from '@/lib/utils';

const API_BASE = getApiBaseUrl();

interface PageProps {
  params: { username: string };
}

async function getUserProfile(username: string): Promise<any | null> {
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/users/${encodeURIComponent(username)}/profile`,
      { next: { revalidate: 60 } },
    );
    if (res.status === 404 || res.status === 403) return null;
    if (!res.ok) return null;
    const json = await res.json();
    return json?.data ?? json ?? null;
  } catch {
    return null;
  }
}

async function getUserTrips(username: string): Promise<any[]> {
  try {
    const res = await fetch(
      `${API_BASE}/api/v1/users/${encodeURIComponent(username)}/trips?limit=12`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) return [];
    const json = await res.json();
    const list = json?.data ?? json ?? [];
    return Array.isArray(list) ? list : [];
  } catch {
    return [];
  }
}

export async function generateMetadata({ params }: PageProps) {
  const t = await getTranslations('userProfile');
  const user = await getUserProfile(params.username);
  if (!user) return { title: t('notFoundTitle') };
  const name = user.full_name ?? user.fullName ?? user.displayName ?? user.username;
  return {
    title: t('metaTitle', { name }),
    description: user.bio ?? undefined,
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const t = await getTranslations('userProfile');
  const [user, trips] = await Promise.all([
    getUserProfile(params.username),
    getUserTrips(params.username),
  ]);

  if (!user) notFound();

  const displayName: string =
    user.full_name ?? user.fullName ?? user.displayName ?? user.username ?? t('defaultUser');
  const username: string = user.username ?? params.username;
  const avatar: string | null = user.avatar_url ?? user.avatarUrl ?? null;
  const bio: string = user.bio ?? '';
  const city: string =
    user.city?.name_ar ?? user.city?.name ?? (typeof user.city === 'string' ? user.city : '');
  const joinedAt: string =
    user.joined_at ?? user.joinedAt ?? user.created_at ?? '';

  const stats = user.stats ?? {};
  const tripsCount = Number(
    stats.tripsCount ?? stats.total_trips ?? user.total_trips ?? trips.length ?? 0,
  );
  const helpfulCount = Number(stats.helpfulCount ?? user.total_helpful ?? 0);
  const followersCount = Number(stats.followersCount ?? user.followers_count ?? 0);
  const followingCount = Number(stats.followingCount ?? user.following_count ?? 0);

  return (
    <div className="min-h-screen">
      <div className="h-40 gradient-hero" />

      <div className="page-container">
        <div className="-mt-16 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden flex-shrink-0 bg-white">
              <Avatar
                src={avatar ?? undefined}
                name={displayName}
                size="xl"
                className="w-full h-full rounded-none"
              />
            </div>

            <div className="flex-1 pb-1 min-w-0">
              <h1 className="text-2xl font-bold text-gray-900 truncate">{displayName}</h1>
              <p className="text-gray-500 nums-latin">@{username}</p>
              {city && (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {city}
                </p>
              )}
            </div>
          </div>

          {bio && <p className="mt-4 text-gray-700 max-w-xl">{bio}</p>}

          <div className="flex flex-wrap gap-6 mt-5">
            {[
              { label: t('stat.trips'), value: tripsCount },
              { label: t('stat.helpful'), value: helpfulCount },
              { label: t('stat.followers'), value: followersCount },
              { label: t('stat.following'), value: followingCount },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl font-bold text-gray-900 nums-latin">
                  {formatNumber(stat.value)}
                </div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
            {joinedAt && (
              <div className="text-center">
                <div className="text-xl font-bold text-gray-900">{formatDate(joinedAt)}</div>
                <div className="text-sm text-gray-500">{t('joinedLabel')}</div>
              </div>
            )}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">{t('userTrips', { name: displayName })}</h2>
            <span className="text-sm text-gray-500 nums-latin">{t('tripsCount', { count: trips.length })}</span>
          </div>

          {trips.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg">{t('noTrips')}</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-10">
              {trips.map((trip: any) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
