'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bell } from 'lucide-react';
import Sidebar from '@/components/layout/Sidebar';
import { useAuthStore } from '@/store/auth.store';

function DashboardTopbar() {
  const { user } = useAuthStore();
  const initial = user?.full_name?.[0] ?? 'U';

  return (
    <header className="h-16 bg-[var(--cream)] border-b border-[var(--line)] flex items-center justify-between px-6 md:px-8 sticky top-0 z-20">
      {/* Mobile logo */}
      <Link href="/" className="flex md:hidden">
        <span className="text-base font-medium tracking-[-0.02em] text-[var(--ink)]">
          EV<span className="italic font-light text-[var(--ink-3)]"> Trips</span>
        </span>
      </Link>

      <div className="hidden md:block" />

      {/* Right actions */}
      <div className="flex items-center gap-4">
        <Link href="/notifications" className="relative p-2 text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors">
          <Bell className="h-4 w-4" />
          <span className="absolute top-1.5 end-1.5 h-1.5 w-1.5 rounded-full bg-[var(--terra)]" />
        </Link>
        <div className="flex items-center gap-2.5">
          <div className="h-8 w-8 rounded-full bg-[var(--ink)] text-[var(--cream)] flex items-center justify-center text-xs font-medium">
            {initial}
          </div>
          <span className="hidden sm:block text-sm font-medium text-[var(--ink)] tracking-tight">
            {user?.full_name ?? 'مستخدم'}
          </span>
        </div>
      </div>
    </header>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.replace('/login?redirect=/dashboard');
    }
  }, [hasHydrated, isAuthenticated, router]);

  if (!hasHydrated || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--cream)]">
        <div className="flex flex-col items-center gap-4">
          <div className="h-8 w-8 rounded-full border-2 border-[var(--ink)] border-t-transparent animate-spin" />
          <p className="body-sm">جاري التحقق من الصلاحيات…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--cream)] flex">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <DashboardTopbar />
        <main className="flex-1 p-6 md:p-10 overflow-auto">
          <div className="max-w-[1100px]">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
