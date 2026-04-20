'use client';

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

type Lang = 'ar' | 'en';
type Dir = 'rtl' | 'ltr';

interface UIState {
  lang: Lang;
  dir: Dir;
  sidebarOpen: boolean;

  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  setSidebarOpen: (open: boolean) => void;
  toggleSidebar: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      lang: 'ar',
      dir: 'rtl',
      sidebarOpen: true,

      setLang: (lang) =>
        set({ lang, dir: lang === 'ar' ? 'rtl' : 'ltr' }),

      toggleLang: () =>
        set((state) => {
          const newLang: Lang = state.lang === 'ar' ? 'en' : 'ar';
          return { lang: newLang, dir: newLang === 'ar' ? 'rtl' : 'ltr' };
        }),

      setSidebarOpen: (open) => set({ sidebarOpen: open }),
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
    }),
    {
      name: 'ev-trips-ui',
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
