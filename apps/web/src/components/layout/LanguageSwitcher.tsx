'use client';

import { Globe } from 'lucide-react';
import { useLocale } from 'next-intl';
import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { useUIStore } from '../../store/ui.store';

export function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const { setLang } = useUIStore();

  const toggle = () => {
    const next = locale === 'ar' ? 'en' : 'ar';
    // Persist on the server via cookie read by src/i18n/request.ts
    document.cookie = `NEXT_LOCALE=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    // Keep legacy ui store in sync for components that still read from it
    setLang(next);
    startTransition(() => {
      router.refresh();
    });
  };

  return (
    <button
      onClick={toggle}
      disabled={isPending}
      aria-label="Toggle language"
      className="text-xs font-medium text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors px-2 py-2 flex items-center gap-1.5 disabled:opacity-50"
    >
      <Globe className="h-3.5 w-3.5" />
      {locale === 'ar' ? 'EN' : 'ع'}
    </button>
  );
}

export default LanguageSwitcher;
