'use client';

import Link from 'next/link';
import { useAuthStore } from '@/store/auth.store';

interface ShareTripCTAProps {
  variant?: 'primary' | 'link';
  label?: string;
  className?: string;
  children?: React.ReactNode;
}

/**
 * CTA button/link that takes the user to /trips/new.
 * - Authenticated users go straight to /trips/new.
 * - Anonymous users are routed to /login?redirect=/trips/new (not /register).
 */
export function ShareTripCTA({
  variant = 'link',
  label = 'شارك رحلتك',
  className,
  children,
}: ShareTripCTAProps) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const href = isAuthenticated ? '/trips/new' : '/login?redirect=/trips/new';

  const base =
    variant === 'primary'
      ? 'inline-flex items-center gap-3 px-9 py-4 bg-[var(--cream)] text-[var(--ink)] text-[0.95rem] font-medium rounded-[2px] hover:bg-white transition-colors'
      : 'text-[var(--cream)] text-sm md:text-[0.95rem] font-medium border-b border-[var(--cream)]/50 pb-1 hover:border-[var(--cream)] transition-colors';

  return (
    <Link href={href} className={className ?? base}>
      {children ?? label}
    </Link>
  );
}

export default ShareTripCTA;
