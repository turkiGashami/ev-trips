'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/auth.store';
import { PageSpinner } from '../ui/Spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
  redirectTo?: string;
}

export function ProtectedRoute({
  children,
  requiredRoles,
  redirectTo = '/login',
}: ProtectedRouteProps) {
  const router = useRouter();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const user = useAuthStore((s) => s.user);
  const hasHydrated = useAuthStore((s) => s.hasHydrated);

  useEffect(() => {
    if (!hasHydrated) return;
    if (!isAuthenticated) {
      router.replace(redirectTo);
      return;
    }
    if (requiredRoles && user && !requiredRoles.includes(user.role)) {
      router.replace('/');
    }
  }, [hasHydrated, isAuthenticated, user, requiredRoles, redirectTo, router]);

  if (!hasHydrated) return <PageSpinner />;
  if (!isAuthenticated) return <PageSpinner />;
  if (requiredRoles && user && !requiredRoles.includes(user.role)) return <PageSpinner />;

  return <>{children}</>;
}
