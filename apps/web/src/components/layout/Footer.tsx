'use client';

import React from 'react';
import Link from 'next/link';
import { useTranslations } from 'next-intl';

export function Footer() {
  const t = useTranslations('footer');
  const tNav = useTranslations('nav');
  const year = new Date().getFullYear();

  const exploreLinks = [
    { href: '/search', label: tNav('trips') },
    { href: '/popular-routes', label: tNav('popularRoutes') },
    { href: '/charging-stations', label: tNav('stations') },
  ];

  const companyLinks = [
    { href: '/about', label: t('about') },
    { href: '/faq', label: t('faq') },
    { href: '/contact', label: t('contact') },
  ];

  const legalLinks = [
    { href: '/terms', label: t('terms') },
    { href: '/privacy', label: t('privacy') },
  ];

  const LinkCol = ({ title, links }: { title: string; links: { href: string; label: string }[] }) => (
    <div>
      <h4 className="eyebrow mb-6 text-[var(--ink-3)]">{title}</h4>
      <ul className="space-y-3">
        {links.map(({ href, label }) => (
          <li key={href}>
            <Link href={href} className="text-sm text-[var(--ink-2)] hover:text-[var(--ink)] transition-colors tracking-tight">
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );

  return (
    <footer className="border-t border-[var(--line)] bg-[var(--cream)]">
      <div className="container-app pt-20 md:pt-28 pb-10">
        <div className="grid grid-cols-2 md:grid-cols-12 gap-10 md:gap-8">
          {/* Brand block */}
          <div className="col-span-2 md:col-span-5">
            <Link href="/" className="block w-fit mb-5">
              <span className="text-xl font-medium tracking-[-0.02em] text-[var(--ink)]">
                EV<span className="italic font-light text-[var(--ink-3)]"> Trips</span>
              </span>
            </Link>
            <p className="text-[var(--ink-2)] max-w-sm leading-[1.7] text-[0.95rem]">{t('tagline')}</p>
          </div>

          <div className="md:col-span-2 md:col-start-7"><LinkCol title={t('explore')} links={exploreLinks} /></div>
          <div className="md:col-span-2"><LinkCol title={t('company')} links={companyLinks} /></div>
          <div className="md:col-span-2"><LinkCol title={t('legal')} links={legalLinks} /></div>
        </div>

        <div className="border-t border-[var(--line)] mt-20 pt-8 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <p className="text-xs text-[var(--ink-3)] tracking-wide">{t('copyright', { year })}</p>
          <p className="text-xs text-[var(--ink-3)] tracking-[0.1em]">— {t('crafted')}</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
