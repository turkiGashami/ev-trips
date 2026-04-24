"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  LayoutDashboard, Users, Map, MessageSquare, Flag, ShieldCheck,
  Zap, MapPin, FileText, Image as ImageIcon, Settings, ScrollText,
  LogOut, Bolt, HelpCircle, Inbox,
} from "lucide-react";
import { useAdminAuthStore } from "@/store/admin-auth.store";

interface NavItem { labelKey: string; href: string; icon: React.ReactNode; badge?: number; }
interface NavGroup { titleKey: string; items: NavItem[]; }

const navGroups: NavGroup[] = [
  {
    titleKey: "overview",
    items: [{ labelKey: "dashboard", href: "/dashboard", icon: <LayoutDashboard className="w-4 h-4" /> }],
  },
  {
    titleKey: "moderation",
    items: [
      { labelKey: "pendingQueue", href: "/moderation", icon: <ShieldCheck className="w-4 h-4" /> },
      { labelKey: "reports",      href: "/reports",    icon: <Flag className="w-4 h-4" /> },
    ],
  },
  {
    titleKey: "content",
    items: [
      { labelKey: "trips",    href: "/trips",    icon: <Map className="w-4 h-4" /> },
      { labelKey: "comments", href: "/comments", icon: <MessageSquare className="w-4 h-4" /> },
    ],
  },
  {
    titleKey: "users",
    items: [{ labelKey: "allUsers", href: "/users", icon: <Users className="w-4 h-4" /> }],
  },
  {
    titleKey: "lookups",
    items: [
      { labelKey: "brands",           href: "/brands",            icon: <Bolt className="w-4 h-4" /> },
      { labelKey: "cities",           href: "/cities",            icon: <MapPin className="w-4 h-4" /> },
      { labelKey: "chargingStations", href: "/charging-stations", icon: <Zap className="w-4 h-4" /> },
    ],
  },
  {
    titleKey: "cms",
    items: [
      { labelKey: "staticPages",     href: "/static-pages",     icon: <FileText className="w-4 h-4" /> },
      { labelKey: "faqs",            href: "/faqs",             icon: <HelpCircle className="w-4 h-4" /> },
      { labelKey: "banners",         href: "/banners",          icon: <ImageIcon className="w-4 h-4" /> },
      { labelKey: "contactMessages", href: "/contact-messages", icon: <Inbox className="w-4 h-4" /> },
    ],
  },
  {
    titleKey: "system",
    items: [
      { labelKey: "settings", href: "/settings", icon: <Settings className="w-4 h-4" /> },
      { labelKey: "logs",     href: "/logs",     icon: <ScrollText className="w-4 h-4" /> },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();
  const { admin, logout } = useAdminAuthStore();
  const t = useTranslations("nav");
  const tRoles = useTranslations("roles");

  const isActive = (href: string) => {
    const full = `/dashboard${href === "/dashboard" ? "" : href}`;
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(full);
  };

  const initial = admin?.name?.charAt(0).toUpperCase() ?? "A";
  const roleLabel = (() => {
    if (!admin?.role) return "";
    try { return tRoles(admin.role as any); } catch { return admin.role.replace("_", " "); }
  })();

  return (
    <aside
      style={{ display: 'flex', flexDirection: 'column', width: 256, flexShrink: 0, height: '100vh', overflow: 'hidden', background: "var(--cream)", borderInlineEnd: "1px solid var(--line)" }}
    >
      {/* Wordmark */}
      <div className="px-6 py-5" style={{ borderBottom: "1px solid var(--line)" }}>
        <div className="text-lg font-medium tracking-[-0.02em]" style={{ color: "var(--ink)" }}>
          EV<span className="italic font-light" style={{ color: "var(--ink-3)" }}> Trips</span>
        </div>
        <p className="mt-1 text-[10px] tracking-[0.15em] uppercase" style={{ color: "var(--ink-3)" }}>
          {t("adminPanel")}
        </p>
      </div>

      {/* Nav */}
      <nav className="scrollbar-thin" style={{ flex: 1, overflowY: 'auto', padding: '16px 12px' }}>
        {navGroups.map((group) => (
          <div key={group.titleKey} className="mb-6">
            <p className="px-3 mb-2 text-[10px] font-medium uppercase tracking-[0.14em]" style={{ color: "var(--ink-4)" }}>
              {t(group.titleKey as any)}
            </p>
            <ul className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href);
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      className="transition-colors"
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '7px 12px', fontSize: 13, fontWeight: active ? 500 : 400, background: active ? 'var(--sand)' : 'transparent', color: active ? 'var(--ink)' : 'var(--ink-2)', borderRadius: 3 }}
                    >
                      <span className="flex-shrink-0" style={{ color: active ? "var(--ink)" : "var(--ink-3)" }}>
                        {item.icon}
                      </span>
                      <span className="flex-1 truncate tracking-tight">
                        {t(item.labelKey as any)}
                      </span>
                      {item.badge !== undefined && (
                        <span
                          className="flex-shrink-0 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-medium px-1"
                          style={{ background: "var(--terra)", color: "var(--cream)", borderRadius: 2 }}
                        >
                          {item.badge}
                        </span>
                      )}
                      {active && (
                        <span className="h-1 w-1 rounded-full flex-shrink-0" style={{ background: "var(--ink)" }} />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      {/* User footer */}
      <div className="p-3" style={{ borderTop: "1px solid var(--line)" }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 8px' }}>
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-medium"
            style={{ background: "var(--ink)", color: "var(--cream)" }}
          >
            {initial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: "var(--ink)" }}>{admin?.name}</p>
            <p className="text-[10px] capitalize truncate" style={{ color: "var(--ink-3)" }}>
              {roleLabel}
            </p>
          </div>
          <button
            onClick={() => logout()}
            title={t("signOut")}
            aria-label={t("signOut")}
            className="flex-shrink-0 transition-colors"
            style={{ color: "var(--ink-3)" }}
            onMouseOver={(e) => (e.currentTarget.style.color = "var(--terra)")}
            onMouseOut={(e) => (e.currentTarget.style.color = "var(--ink-3)")}
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
