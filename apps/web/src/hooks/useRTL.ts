'use client';

import { useUIStore } from '../store/ui.store';

export function useRTL() {
  const { lang, dir } = useUIStore();
  return {
    isRTL: dir === 'rtl',
    dir,
    lang,
  };
}
