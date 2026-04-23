'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useLocale } from 'next-intl';
import { getApiBaseUrl } from '@/lib/utils';

interface BannerDto {
  id: string;
  title: string;
  title_ar: string | null;
  body: string | null;
  body_ar: string | null;
  image_url: string | null;
  link_url: string | null;
  sort_order: number;
}

interface BannerSlotProps {
  position: string;
}

async function fetchBanners(position: string): Promise<BannerDto[]> {
  const base = getApiBaseUrl();
  const res = await fetch(`${base}/api/v1/banners?position=${encodeURIComponent(position)}`);
  if (!res.ok) return [];
  const json = await res.json();
  const data = json?.data ?? json ?? [];
  return Array.isArray(data) ? data : [];
}

export default function BannerSlot({ position }: BannerSlotProps) {
  const locale = useLocale();
  const { data: banners } = useQuery({
    queryKey: ['banners', position],
    queryFn: () => fetchBanners(position),
    staleTime: 5 * 60 * 1000,
  });

  if (!banners || banners.length === 0) return null;

  // Pick first banner — could rotate in the future; sort_order already prioritizes.
  const banner = banners[0];
  const title = locale === 'ar' ? (banner.title_ar ?? banner.title) : (banner.title ?? banner.title_ar ?? '');
  const body = locale === 'ar' ? (banner.body_ar ?? banner.body) : (banner.body ?? banner.body_ar ?? '');

  const content = (
    <div
      className="relative w-full overflow-hidden border border-[var(--line)] bg-[var(--sand)]"
      style={banner.image_url ? {
        backgroundImage: `linear-gradient(90deg, rgba(0,0,0,0.45), rgba(0,0,0,0.15)), url("${banner.image_url}")`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      } : undefined}
    >
      <div className={`container-app py-8 md:py-12 ${banner.image_url ? 'text-[var(--cream)]' : 'text-[var(--ink)]'}`}>
        <h3 className="text-xl md:text-2xl font-medium tracking-tight">{title}</h3>
        {body && (
          <p className={`mt-3 max-w-2xl body-md ${banner.image_url ? 'opacity-90' : 'text-[var(--ink-2)]'}`}>
            {body}
          </p>
        )}
      </div>
    </div>
  );

  if (banner.link_url) {
    const isExternal = /^https?:\/\//i.test(banner.link_url);
    if (isExternal) {
      return (
        <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="block">
          {content}
        </a>
      );
    }
    return (
      <Link href={banner.link_url} className="block">
        {content}
      </Link>
    );
  }

  return content;
}
