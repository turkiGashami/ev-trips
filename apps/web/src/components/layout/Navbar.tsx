'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Search, Bell, Menu, X, ChevronDown, LogOut, Settings, Car, LayoutDashboard, Route } from 'lucide-react';
import { useAuthStore } from '../../store/auth.store';
import { useUnreadNotificationsCount } from '../../hooks/useNotifications';
import { cn } from '../../lib/utils';
import LanguageSwitcher from './LanguageSwitcher';

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const active = pathname === href || pathname.startsWith(href + '/');
  return (
    <Link
      href={href}
      className={cn(
        'relative text-sm font-medium transition-colors py-1 tracking-tight',
        active ? 'text-[var(--ink)]' : 'text-[var(--ink-3)] hover:text-[var(--ink)]',
      )}
    >
      {children}
      {active && <span className="absolute -bottom-0.5 inset-x-0 h-px bg-[var(--ink)]" />}
    </Link>
  );
}

export function Navbar() {
  const router = useRouter();
  const { user, isAuthenticated, logout } = useAuthStore();
  const tNav = useTranslations('nav');
  const tAuth = useTranslations('auth');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [scrolled, setScrolled] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchQuery)}`);
      setMobileOpen(false);
    }
  };

  const initial = user?.full_name?.[0] ?? user?.username?.[0] ?? 'U';

  return (
    <header
      className={cn(
        'sticky top-0 z-50 transition-all duration-200',
        scrolled
          ? 'bg-[var(--cream)]/92 backdrop-blur-md border-b border-[var(--line)]'
          : 'bg-transparent border-b border-transparent',
      )}
    >
      <div className="container-app">
        <div className="flex h-16 md:h-18 items-center gap-6 md:gap-10">

          {/* Wordmark — no icon, typography-led */}
          <Link href="/" className="flex shrink-0 items-center">
            <span className="text-[1.05rem] md:text-lg font-medium tracking-[-0.02em] text-[var(--ink)]">
              EV<span className="italic font-light text-[var(--ink-3)]"> Trips</span>
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden items-center gap-8 md:flex">
            <NavLink href="/search">{tNav('trips')}</NavLink>
            <NavLink href="/popular-routes">{tNav('popularRoutes')}</NavLink>
            <NavLink href="/charging-stations">{tNav('stations')}</NavLink>
          </nav>

          {/* Actions */}
          <div className="ms-auto flex items-center gap-1 md:gap-3">
            {/* Search icon → expand on focus (desktop only) */}
            <form onSubmit={handleSearch} className="hidden md:block">
              <div className="relative group">
                <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-[var(--ink-3)]" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={tNav('search') + '...'}
                  className="h-9 w-44 focus:w-64 transition-all bg-transparent border-b border-[var(--line)] focus:border-[var(--ink)] ps-8 pe-3 text-sm outline-none placeholder:text-[var(--ink-4)]"
                />
              </div>
            </form>

            {/* Lang toggle */}
            <LanguageSwitcher />

            {isAuthenticated && user ? (
              <>
                <NotificationsBell />

                <div ref={menuRef} className="relative">
                  <button
                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                    className="flex items-center gap-2 py-1.5 px-1 transition-colors"
                  >
                    <div className="h-8 w-8 rounded-full bg-[var(--ink)] text-[var(--cream)] flex items-center justify-center text-xs font-medium">
                      {initial}
                    </div>
                    <ChevronDown className={cn('hidden h-3 w-3 text-[var(--ink-4)] transition-transform sm:block', userMenuOpen && 'rotate-180')} />
                  </button>

                  {userMenuOpen && (
                    <div className="absolute end-0 top-full mt-2 w-56 border border-[var(--line)] bg-[var(--cream)] py-1.5 rounded-[4px] z-50"
                         style={{ boxShadow: '0 16px 40px -12px rgba(26,26,26,.18)' }}>
                      <div className="border-b border-[var(--line)] px-4 py-3">
                        <p className="text-sm font-medium text-[var(--ink)]">{user.full_name}</p>
                        <p className="text-xs text-[var(--ink-3)] mt-0.5">@{user.username}</p>
                      </div>
                      {[
                        { href: '/dashboard', icon: LayoutDashboard, label: tNav('dashboard') },
                        { href: '/vehicles', icon: Car, label: tNav('vehicles') },
                        { href: '/trips', icon: Route, label: tNav('myTrips') },
                        { href: '/settings', icon: Settings, label: tNav('settings') },
                      ].map(({ href, icon: Icon, label }) => (
                        <Link
                          key={href}
                          href={href}
                          onClick={() => setUserMenuOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-[var(--ink-2)] hover:bg-[var(--sand)] transition-colors"
                        >
                          <Icon className="h-3.5 w-3.5 text-[var(--ink-4)]" />
                          {label}
                        </Link>
                      ))}
                      <div className="border-t border-[var(--line)] mt-1 pt-1">
                        <button
                          onClick={() => { logout(); setUserMenuOpen(false); }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-[var(--terra)] hover:bg-[var(--sand)] transition-colors"
                        >
                          <LogOut className="h-3.5 w-3.5" />
                          {tNav('logout')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-1 md:gap-2">
                <Link href="/login" className="hidden sm:inline-flex text-sm font-medium text-[var(--ink-2)] hover:text-[var(--ink)] px-3 py-2 transition-colors">
                  {tAuth('login')}
                </Link>
                <Link href="/register" className="btn-primary text-sm">
                  {tAuth('register')}
                </Link>
              </div>
            )}

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="p-2 text-[var(--ink-2)] md:hidden"
              aria-label={tNav('home')}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="border-t border-[var(--line)] bg-[var(--cream)] md:hidden">
          <div className="container-app py-5 space-y-5">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute start-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--ink-3)]" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={tNav('search') + '...'}
                  className="input-base ps-10 pe-4"
                />
              </div>
            </form>
            <nav className="flex flex-col">
              {[
                { href: '/search', label: tNav('trips') },
                { href: '/popular-routes', label: tNav('popularRoutes') },
                { href: '/charging-stations', label: tNav('stations') },
              ].map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMobileOpen(false)}
                  className="py-3 text-base font-medium text-[var(--ink)] border-b border-[var(--line-soft)] tracking-tight"
                >
                  {label}
                </Link>
              ))}
            </nav>
            {!isAuthenticated && (
              <div className="flex gap-3 pt-2">
                <Link href="/login" className="btn-secondary flex-1 text-sm" onClick={() => setMobileOpen(false)}>{tAuth('login')}</Link>
                <Link href="/register" className="btn-primary flex-1 text-sm" onClick={() => setMobileOpen(false)}>{tAuth('register')}</Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}

function NotificationsBell() {
  const { data: count = 0 } = useUnreadNotificationsCount();
  const hasUnread = count > 0;
  return (
    <Link
      href="/notifications"
      className="relative p-2 text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
      aria-label={hasUnread ? `${count} إشعار غير مقروء` : 'الإشعارات'}
    >
      <Bell className="h-4 w-4" />
      {hasUnread && (
        <span
          className="nums-latin absolute -top-0.5 -end-0.5 min-w-[16px] h-[16px] px-1 flex items-center justify-center rounded-full bg-[var(--terra)] text-[10px] font-medium text-white leading-none"
        >
          {count > 99 ? '99+' : count}
        </span>
      )}
    </Link>
  );
}

export default Navbar;
