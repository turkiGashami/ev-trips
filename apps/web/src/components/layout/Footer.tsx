'use client';

import React from 'react';
import Link from 'next/link';
import { useUIStore } from '../../store/ui.store';

export function Footer() {
  const { lang } = useUIStore();
  const year = new Date().getFullYear();

  const t = {
    tagline:    lang === 'ar' ? 'منصة مجتمع السيارات الكهربائية لمشاركة تجارب السفر الحقيقية' : 'The EV community platform for sharing real intercity travel experiences.',
    explore:    lang === 'ar' ? 'استكشف' : 'Explore',
    company:    lang === 'ar' ? 'الشركة' : 'Company',
    legal:      lang === 'ar' ? 'القانوني' : 'Legal',
    copyright:  lang === 'ar' ? `© ${year} رحلات EV. جميع الحقوق محفوظة.` : `© ${year} EV Trips. All rights reserved.`,
    brand:      lang === 'ar' ? 'رحلات EV' : 'EV Trips',
    crafted:    lang === 'ar' ? 'صُنع في الرياض' : 'Crafted in Riyadh',
  };

  const exploreLinks = lang === 'ar'
    ? [{ href: '/search', label: 'الرحلات' }, { href: '/popular-routes', label: 'المسارات' }, { href: '/charging-stations', label: 'محطات الشحن' }]
    : [{ href: '/search', label: 'Trips' }, { href: '/popular-routes', label: 'Routes' }, { href: '/charging-stations', label: 'Chargers' }];

  const companyLinks = lang === 'ar'
    ? [{ href: '/about', label: 'من نحن' }, { href: '/faq', label: 'الأسئلة الشائعة' }]
    : [{ href: '/about', label: 'About' }, { href: '/faq', label: 'FAQ' }];

  const legalLinks = lang === 'ar'
    ? [{ href: '/terms', label: 'الشروط' }, { href: '/privacy', label: 'الخصوصية' }]
    : [{ href: '/terms', label: 'Terms' }, { href: '/privacy', label: 'Privacy' }];

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
            <p className="text-[var(--ink-2)] max-w-sm leading-[1.7] text-[0.95rem]">{t.tagline}</p>
          </div>

          <div className="md:col-span-2 md:col-start-7"><LinkCol title={t.explore} links={exploreLinks} /></div>
          <div className="md:col-span-2"><LinkCol title={t.company} links={companyLinks} /></div>
          <div className="md:col-span-2"><LinkCol title={t.legal} links={legalLinks} /></div>
        </div>

        <div className="border-t border-[var(--line)] mt-20 pt-8 flex flex-col sm:flex-row gap-3 items-center justify-between">
          <p className="text-xs text-[var(--ink-3)] tracking-wide">{t.copyright}</p>
          <p className="text-xs text-[var(--ink-3)] tracking-[0.1em]">— {t.crafted}</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
