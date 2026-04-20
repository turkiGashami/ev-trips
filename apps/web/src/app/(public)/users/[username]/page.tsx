import { notFound } from 'next/navigation';
import Link from 'next/link';
import TripCard from '@/components/trips/TripCard';
import Avatar from '@/components/ui/Avatar';
import { formatNumber, formatDate } from '@/lib/utils';

interface PageProps {
  params: { username: string };
}

async function getUserProfile(username: string): Promise<any | null> {
  if (username === 'not-found') return null;
  return {
    id: 'u1',
    username,
    displayName: 'أحمد العتيبي',
    avatar: null,
    tripsCount: 47,
    helpfulCount: 892,
    bio: 'متحمس للسيارات الكهربائية منذ 2020. أوثق رحلاتي عبر المملكة لمساعدة مجتمع EV',
    location: 'الرياض، المملكة العربية السعودية',
    joinedAt: '2022-05-10',
    followersCount: 312,
    followingCount: 89,
  };
}

async function getUserTrips(userId: string): Promise<any[]> {
  return [
    {
      id: '1',
      slug: 'riyadh-to-jeddah-tesla-model-3',
      title: 'من الرياض إلى جدة بتسلا موديل 3',
      titleEn: 'Riyadh to Jeddah with Tesla Model 3',
      fromCity: 'الرياض',
      toCity: 'جدة',
      fromCityEn: 'Riyadh',
      toCityEn: 'Jeddah',
      distanceKm: 945,
      durationMinutes: 540,
      batteryDeparture: 95,
      batteryArrival: 22,
      stopsCount: 3,
      status: 'published',
      helpfulCount: 147,
      viewCount: 1832,
      vehicle: { brand: 'Tesla', model: 'Model 3', year: 2023, rangeKm: 576 },
      author: { id: 'u1', username: userId, displayName: 'أحمد العتيبي', avatar: null },
      tripDate: '2026-03-15',
      weather: 'sunny',
      createdAt: '2026-03-16T08:00:00Z',
    },
  ];
}

export async function generateMetadata({ params }: PageProps) {
  const user = await getUserProfile(params.username);
  if (!user) return { title: 'مستخدم غير موجود' };
  return {
    title: `${user.displayName} | رحلات EV`,
    description: user.bio,
  };
}

export default async function UserProfilePage({ params }: PageProps) {
  const [user, trips] = await Promise.all([
    getUserProfile(params.username),
    getUserTrips(params.username),
  ]);

  if (!user) notFound();

  return (
    <div className="min-h-screen">
      {/* Cover / Profile header */}
      <div className="h-40 gradient-hero" />

      <div className="page-container">
        <div className="-mt-16 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-end gap-4">
            <div className="w-24 h-24 rounded-2xl border-4 border-white shadow-lg overflow-hidden flex-shrink-0">
              <Avatar src={user.avatar} name={user.displayName} size="xl" className="w-full h-full rounded-none" />
            </div>

            <div className="flex-1 pb-1">
              <h1 className="text-2xl font-bold text-gray-900">{user.displayName}</h1>
              <p className="text-gray-500">@{user.username}</p>
              {user.location && (
                <p className="text-sm text-gray-500 mt-1 flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                  {user.location}
                </p>
              )}
            </div>

            <div className="flex gap-3">
              <button className="btn-base bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2.5 focus:ring-emerald-500">
                متابعة
              </button>
              <button className="btn-base border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 px-4 py-2.5 focus:ring-gray-300">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </button>
            </div>
          </div>

          {/* Bio */}
          {user.bio && (
            <p className="mt-4 text-gray-700 max-w-xl">{user.bio}</p>
          )}

          {/* Stats */}
          <div className="flex flex-wrap gap-6 mt-5">
            {[
              { label: 'رحلة', value: user.tripsCount },
              { label: 'مفيد', value: user.helpfulCount },
              { label: 'متابع', value: user.followersCount },
              { label: 'متابَع', value: user.followingCount },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="text-xl font-bold text-gray-900">{formatNumber(stat.value)}</div>
                <div className="text-sm text-gray-500">{stat.label}</div>
              </div>
            ))}
            <div className="text-center">
              <div className="text-xl font-bold text-gray-900">
                {formatDate(user.joinedAt)}
              </div>
              <div className="text-sm text-gray-500">تاريخ الانضمام</div>
            </div>
          </div>
        </div>

        {/* Trips section */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">رحلات {user.displayName}</h2>
            <span className="text-sm text-gray-500">{trips.length} رحلة</span>
          </div>

          {trips.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg">لا توجد رحلات بعد</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-10">
              {trips.map((trip) => (
                <TripCard key={trip.id} trip={trip} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
