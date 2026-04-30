import type { MetadataRoute } from 'next';
import { getApiBaseUrl } from '@/lib/utils';

const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
const API_BASE = getApiBaseUrl();

export const revalidate = 3600;

const STATIC_PATHS: { path: string; priority: number; changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency'] }[] = [
  { path: '/', priority: 1.0, changeFrequency: 'daily' },
  { path: '/search', priority: 0.9, changeFrequency: 'daily' },
  { path: '/popular-routes', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/charging-stations', priority: 0.8, changeFrequency: 'weekly' },
  { path: '/about', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/faq', priority: 0.5, changeFrequency: 'monthly' },
  { path: '/contact', priority: 0.4, changeFrequency: 'yearly' },
  { path: '/privacy', priority: 0.3, changeFrequency: 'yearly' },
  { path: '/terms', priority: 0.3, changeFrequency: 'yearly' },
];

async function fetchList(path: string): Promise<any[]> {
  try {
    const res = await fetch(`${API_BASE}${path}`, { next: { revalidate: 3600 } });
    if (!res.ok) return [];
    const json = await res.json();
    const data = json?.data ?? json;
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const base: MetadataRoute.Sitemap = STATIC_PATHS.map(({ path, priority, changeFrequency }) => ({
    url: `${SITE_URL}${path}`,
    lastModified: now,
    changeFrequency,
    priority,
  }));

  const [trips, routes, users, cities, popular] = await Promise.all([
    fetchList('/api/v1/trips?limit=500&sort_by=created_at&sort_order=DESC'),
    fetchList('/api/v1/routes?limit=500'),
    fetchList('/api/v1/users?limit=500'),
    fetchList('/api/v1/lookup/cities'),
    fetchList('/api/v1/popular-routes?limit=100'),
  ]);

  const tripUrls: MetadataRoute.Sitemap = trips
    .filter((t: any) => t?.slug)
    .map((t: any) => ({
      url: `${SITE_URL}/trips/${t.slug}`,
      lastModified: t.updated_at ? new Date(t.updated_at) : now,
      changeFrequency: 'weekly',
      priority: 0.7,
    }));

  const routeUrls: MetadataRoute.Sitemap = routes
    .filter((r: any) => r?.slug)
    .map((r: any) => ({
      url: `${SITE_URL}/routes/${r.slug}`,
      lastModified: r.updated_at ? new Date(r.updated_at) : now,
      changeFrequency: 'weekly',
      priority: 0.6,
    }));

  const userUrls: MetadataRoute.Sitemap = users
    .filter((u: any) => u?.username)
    .map((u: any) => ({
      url: `${SITE_URL}/users/${u.username}`,
      lastModified: u.updated_at ? new Date(u.updated_at) : now,
      changeFrequency: 'monthly',
      priority: 0.4,
    }));

  // City-pair landing pages — generate from popular routes for now (avoid N×N).
  const citySlugById = new Map<string, string>();
  for (const c of cities) {
    if (c?.id && c?.slug) citySlugById.set(String(c.id), String(c.slug));
  }
  const cityPairUrls: MetadataRoute.Sitemap = [];
  const seen = new Set<string>();
  for (const r of popular) {
    const fromSlug = r?.from_slug ?? citySlugById.get(String(r?.departure_city_id ?? ''));
    const toSlug = r?.to_slug ?? citySlugById.get(String(r?.destination_city_id ?? ''));
    if (!fromSlug || !toSlug) continue;
    const key = `${fromSlug}->${toSlug}`;
    if (seen.has(key)) continue;
    seen.add(key);
    cityPairUrls.push({
      url: `${SITE_URL}/from/${fromSlug}/to/${toSlug}`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.6,
    });
  }

  return [...base, ...tripUrls, ...routeUrls, ...userUrls, ...cityPairUrls];
}
