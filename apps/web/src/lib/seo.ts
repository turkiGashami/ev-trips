import type { Metadata } from 'next';

export const SITE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

export function buildPageMetadata(opts: {
  path: string;
  title: string;
  description: string;
  keywords?: string[];
  ogType?: 'website' | 'article' | 'profile';
}): Metadata {
  const url = `${SITE_URL}${opts.path}`;
  return {
    title: opts.title,
    description: opts.description,
    keywords: opts.keywords,
    alternates: {
      canonical: opts.path,
      languages: { ar: opts.path, en: opts.path, 'x-default': opts.path },
    },
    openGraph: {
      type: opts.ogType ?? 'website',
      title: opts.title,
      description: opts.description,
      url,
      siteName: 'رحلات EV',
      locale: 'ar_SA',
    },
    twitter: {
      card: 'summary_large_image',
      title: opts.title,
      description: opts.description,
    },
  };
}

export function breadcrumbJsonLd(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.name,
      item: it.url.startsWith('http') ? it.url : `${SITE_URL}${it.url}`,
    })),
  };
}
