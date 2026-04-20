'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Route, Plus, User, Settings, LogOut, Bell, Car } from 'lucide-react';
import { useAuthStore } from '@/store/auth.store';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
  { href: '/dashboard',     label: 'الرئيسية',    icon: LayoutDashboard },
  { href: '/trips',         label: 'رحلاتي',      icon: Route },
  { href: '/trips/new',     label: 'رحلة جديدة',  icon: Plus, accent: true },
  { href: '/vehicles',      label: 'سياراتي',     icon: Car },
  { href: '/notifications', label: 'الإشعارات',   icon: Bell },
  { href: '/profile',       label: 'ملفي الشخصي', icon: User },
  { href: '/settings',      label: 'الإعدادات',   icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();
  const initial = user?.full_name?.[0] ?? 'U';

  return (
    <aside className="w-64 bg-[var(--cream)] border-e border-[var(--line)] min-h-screen flex-col shrink-0 hidden md:flex">

      {/* Wordmark */}
      <div className="h-18 flex items-center px-6 border-b border-[var(--line)]">
        <Link href="/" className="block">
          <span className="text-lg font-medium tracking-[-0.02em] text-[var(--ink)]">
            EV<span className="italic font-light text-[var(--ink-3)]"> Trips</span>
          </span>
        </Link>
      </div>

      {/* User block */}
      {user && (
        <div className="px-6 py-5 border-b border-[var(--line-soft)]">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 shrink-0 rounded-full bg-[var(--ink)] text-[var(--cream)] flex items-center justify-center text-xs font-medium">
              {initial}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-[var(--ink)] truncate">{user.full_name}</p>
              <p className="text-xs text-[var(--ink-3)] truncate">@{user.username}</p>
            </div>
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 py-4 px-3 space-y-0.5">
        {NAV_ITEMS.map(({ href, label, icon: Icon, accent }) => {
          const isActive = pathname === href || (href !== '/dashboard' && pathname.startsWith(href + '/'));
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 text-sm transition-colors tracking-tight',
                isActive
                  ? 'text-[var(--ink)] bg-[var(--sand)] font-medium'
                  : 'text-[var(--ink-2)] hover:text-[var(--ink)] hover:bg-[var(--sand)]/50',
                accent && !isActive && 'text-[var(--forest)]',
              )}
            >
              <Icon className={cn('h-4 w-4 shrink-0', isActive ? 'text-[var(--ink)]' : 'text-[var(--ink-3)]')} />
              <span className="flex-1">{label}</span>
              {isActive && <span className="h-1 w-1 rounded-full bg-[var(--ink)]" />}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-[var(--line)]">
        <button
          onClick={() => logout()}
          className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-[var(--ink-3)] hover:text-[var(--terra)] hover:bg-[var(--sand)]/50 transition-colors tracking-tight"
        >
          <LogOut className="h-4 w-4" />
          تسجيل الخروج
        </button>
      </div>
    </aside>
  );
}
