import { notFound } from 'next/navigation';
import { getTranslations, getLocale } from 'next-intl/server';
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
    // The API returns { items, meta } which the transform interceptor
    // unwraps to { data: items, meta }. Some older endpoints return
    // the array directly. Handle both shapes.
    const raw = json?.data ?? json ?? [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw?.items)) return raw.items;
    return [];
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
  const locale = await getLocale();
  const isAr = locale.startsWith('ar');
  const dir = isAr ? 'rtl' : 'ltr';

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
    (isAr ? user.city?.name_ar : user.city?.name) ??
    user.city?.name_ar ?? user.city?.name ??
    (typeof user.city === 'string' ? user.city : '');
  const joinedAt: string =
    user.joined_at ?? user.joinedAt ?? user.created_at ?? '';

  const stats = user.stats ?? {};
  const tripsCount = Number(
    stats.tripsCount ?? stats.total_trips ?? user.total_trips ?? trips.length ?? 0,
  );
  const helpfulCount = Number(stats.helpfulCount ?? user.total_helpful ?? 0);
  const viewsCount = Number(stats.viewsCount ?? user.total_views ?? 0);

  return (
    <div dir={dir} className="min-h-screen bg-[var(--cream)]">
      {/* ── HEADER ─────────────────────────────────────────── */}
      <section className="border-b border-[var(--line)]">
        <div className="container-app py-12 md:py-16">
          <div className="flex flex-col sm:flex-row sm:items-end gap-6">
            <div className="w-24 h-24 md:w-28 md:h-28 border border-[var(--line)] bg-[var(--sand)] rounded-[2px] overflow-hidden shrink-0">
              <Avatar
                src={avatar ?? undefined}
                name={displayName}
                size="xl"
                className="w-full h-full rounded-none"
              />
            </div>

            <div className="flex-1 min-w-0">
              <span className="eyebrow">— @{username}</span>
              <h1 className="mt-3 heading-1 tracking-tight text-[var(--ink)] truncate">
                {displayName}
              </h1>
              {(city || joinedAt) && (
                <p className="mt-3 text-sm text-[var(--ink-3)] flex flex-wrap items-center gap-x-4 gap-y-1 nums-latin">
                  {city && <span>{city}</span>}
                  {city && joinedAt && <span className="text-[var(--ink-4)]">·</span>}
                  {joinedAt && <span>{t('joinedLabel')}: {formatDate(joinedAt, '—', locale)}</span>}
                </p>
              )}
            </div>
          </div>

          {bio && (
            <p className="mt-6 max-w-2xl body-md text-[var(--ink-2)]">{bio}</p>
          )}

          {/* STATS */}
          <dl className="mt-10 border-t border-[var(--line)] pt-8 grid grid-cols-3 gap-6">
            {[
              { label: t('stat.trips'), value: tripsCount },
              { label: t('stat.helpful'), value: helpfulCount },
              { label: isAr ? 'المشاهدات' : 'Views', value: viewsCount },
            ].map((stat) => (
              <div key={stat.label}>
                <dt className="label-sm text-[10px]">{stat.label}</dt>
                <dd className="mt-2 nums-latin text-2xl md:text-3xl font-medium text-[var(--ink)] tracking-tight">
                  {formatNumber(stat.value ?? 0)}
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* ── TRIPS ──────────────────────────────────────────── */}
      <section className="container-app py-12 md:py-16">
        <div className="flex items-end justify-between mb-10 border-b border-[var(--line)] pb-4">
          <div>
            <span className="eyebrow">— {t('stat.trips')}</span>
            <h2 className="mt-2 heading-2">{t('userTrips', { name: displayName })}</h2>
          </div>
          <span className="text-sm text-[var(--ink-3)] nums-latin">
            {t('tripsCount', { count: trips.length })}
          </span>
        </div>

        {trips.length === 0 ? (
          <div className="border border-[var(--line)] bg-[var(--sand)]/40 py-20 px-6 text-center">
            <span className="eyebrow">— {t('noTrips')}</span>
            <p className="mt-4 body-md text-[var(--ink-3)] max-w-md mx-auto">
              {t('noTrips')}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trips.map((trip: any) => (
              <TripCard key={trip.id} trip={trip} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
