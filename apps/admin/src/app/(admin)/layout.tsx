"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { AdminSidebar } from "@/components/layout/AdminSidebar";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { useTranslations } from "next-intl";
import { useAdminAuthStore, selectIsAuthenticated } from "@/store/admin-auth.store";

function RoleGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const t = useTranslations("common");
  const isAuthenticated = useAdminAuthStore(selectIsAuthenticated);
  const admin = useAdminAuthStore((s) => s.admin);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useAdminAuthStore.persist.hasHydrated()) {
      setHydrated(true);
    } else {
      const unsub = useAdminAuthStore.persist.onFinishHydration(() => setHydrated(true));
      return unsub;
    }
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!isAuthenticated || !admin) {
      router.replace("/login");
      return;
    }
    const allowedRoles = ["admin", "super_admin", "moderator"];
    if (!allowedRoles.includes(admin.role)) {
      router.replace("/login");
    }
  }, [hydrated, isAuthenticated, admin, router]);

  if (!hydrated || !isAuthenticated || !admin) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--cream)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 32, height: 32, border: '2px solid var(--forest)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          <p className="text-sm" style={{ color: 'var(--ink-3)' }}>{t("verifying")}</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}

function PageTitleProvider({ children }: { children: React.ReactNode }) {
  // Topbar title is driven by individual pages via a shared context or static title.
  // Pages import and use AdminTopbar directly for custom titles.
  return <>{children}</>;
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleGuard>
      <PageTitleProvider>
        <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', background: 'var(--cream)' }}>
          <AdminSidebar />
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            {children}
          </div>
        </div>
      </PageTitleProvider>
    </RoleGuard>
  );
}
