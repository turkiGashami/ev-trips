"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { Bell, Search, ShieldCheck, Flag, Inbox } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "./LanguageToggle";
import { adminApi } from "@/lib/api/admin.api";

interface AdminTopbarProps {
  title: string;
  subtitle?: string;
}

const ICONS: Record<string, React.ReactNode> = {
  pending_trips: <ShieldCheck className="w-4 h-4" style={{ color: "var(--forest)" }} />,
  open_reports: <Flag className="w-4 h-4" style={{ color: "var(--terra)" }} />,
  new_contact_messages: <Inbox className="w-4 h-4" style={{ color: "var(--sky)" }} />,
};

const LABELS_AR: Record<string, string> = {
  pending_trips: "رحلات بانتظار المراجعة",
  open_reports: "بلاغات مفتوحة",
  new_contact_messages: "رسائل تواصل جديدة",
};

const LABELS_EN: Record<string, string> = {
  pending_trips: "Trips pending review",
  open_reports: "Open reports",
  new_contact_messages: "New contact messages",
};

function NotificationsDropdown({ onClose }: { onClose: () => void }) {
  const t = useTranslations("topbar");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-alerts"],
    queryFn: () => adminApi.getAdminAlerts(),
    refetchInterval: 30_000,
  });

  const envelope: any = data?.data ?? {};
  const payload = envelope?.data ?? envelope;
  const items: any[] = payload?.items ?? [];
  const total: number = payload?.total ?? 0;
  // Detect locale heuristically by document direction
  const isAr = typeof document !== "undefined" && document.documentElement.dir === "rtl";
  const labels = isAr ? LABELS_AR : LABELS_EN;

  return (
    <div
      style={{
        position: "absolute",
        top: "calc(100% + 8px)",
        insetInlineEnd: 0,
        width: 320,
        background: "var(--cream)",
        border: "1px solid var(--line)",
        borderRadius: 4,
        boxShadow: "0 12px 32px rgba(0,0,0,0.12)",
        zIndex: 100,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          padding: "12px 16px",
          borderBottom: "1px solid var(--line)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
          {isAr ? "الإشعارات" : "Notifications"}
        </span>
        <span
          className="nums-latin"
          style={{ fontSize: 11, color: "var(--ink-3)" }}
        >
          {total}
        </span>
      </div>

      {isLoading ? (
        <div style={{ padding: 24, textAlign: "center", color: "var(--ink-4)", fontSize: 12 }}>
          {t("loading") || (isAr ? "جاري التحميل..." : "Loading…")}
        </div>
      ) : items.length === 0 || total === 0 ? (
        <div style={{ padding: 32, textAlign: "center", color: "var(--ink-4)", fontSize: 12 }}>
          {isAr ? "لا يوجد إشعارات جديدة" : "No new notifications"}
        </div>
      ) : (
        <div>
          {items.map((it) => {
            const count = Number(it.count) || 0;
            if (count === 0) return null;
            return (
              <Link
                key={it.key}
                href={it.href}
                onClick={onClose}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "12px 16px",
                  borderBottom: "1px solid var(--line)",
                  textDecoration: "none",
                  color: "var(--ink)",
                  background: "transparent",
                  transition: "background 0.15s",
                }}
                onMouseOver={(e) => (e.currentTarget.style.background = "var(--sand)")}
                onMouseOut={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    background: "var(--sand)",
                    borderRadius: 4,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  {ICONS[it.key]}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--ink)" }}>
                    {labels[it.key] || it.key}
                  </div>
                  <div className="nums-latin" style={{ fontSize: 11, color: "var(--ink-3)", marginTop: 2 }}>
                    {count} {isAr ? (count === 1 ? "عنصر" : "عناصر") : count === 1 ? "item" : "items"}
                  </div>
                </div>
                <span
                  className="nums-latin"
                  style={{
                    fontSize: 11,
                    fontWeight: 500,
                    color: "var(--cream)",
                    background: "var(--terra)",
                    padding: "2px 8px",
                    borderRadius: 10,
                    flexShrink: 0,
                  }}
                >
                  {count > 99 ? "99+" : count}
                </span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function AdminTopbar({ title, subtitle }: AdminTopbarProps) {
  const t = useTranslations("topbar");
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  const { data: alertsData } = useQuery({
    queryKey: ["admin-alerts"],
    queryFn: () => adminApi.getAdminAlerts(),
    refetchInterval: 30_000,
  });
  const envelope: any = alertsData?.data ?? {};
  const payload = envelope?.data ?? envelope;
  const totalAlerts: number = payload?.total ?? 0;

  // Close on outside click
  useEffect(() => {
    if (!notifOpen) return;
    const onClick = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [notifOpen]);

  return (
    <header
      style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', flexShrink: 0, background: "var(--cream)", borderBottom: "1px solid var(--line)", position: 'sticky', top: 0, zIndex: 10 }}
    >
      <div>
        <h1 className="text-[0.95rem] font-medium tracking-tight leading-tight" style={{ color: "var(--ink)" }}>
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs leading-tight mt-1" style={{ color: "var(--ink-3)" }}>
            {subtitle}
          </p>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <button
          aria-label={t("search")}
          title={t("search")}
          className="w-9 h-9 flex items-center justify-center transition-colors rounded-[2px]"
          style={{ color: "var(--ink-3)" }}
          onMouseOver={(e) => { e.currentTarget.style.color = "var(--ink)"; e.currentTarget.style.background = "var(--sand)"; }}
          onMouseOut={(e) => { e.currentTarget.style.color = "var(--ink-3)"; e.currentTarget.style.background = "transparent"; }}
        >
          <Search className="w-4 h-4" />
        </button>

        <div ref={notifRef} style={{ position: 'relative' }}>
          <button
            onClick={() => setNotifOpen((o) => !o)}
            aria-label={t("notifications")}
            title={t("notifications")}
            className="relative w-9 h-9 flex items-center justify-center transition-colors rounded-[2px]"
            style={{ color: notifOpen ? "var(--ink)" : "var(--ink-3)", background: notifOpen ? "var(--sand)" : "transparent" }}
            onMouseOver={(e) => { if (!notifOpen) { e.currentTarget.style.color = "var(--ink)"; e.currentTarget.style.background = "var(--sand)"; } }}
            onMouseOut={(e) => { if (!notifOpen) { e.currentTarget.style.color = "var(--ink-3)"; e.currentTarget.style.background = "transparent"; } }}
          >
            <Bell className="w-4 h-4" />
            {totalAlerts > 0 && (
              <span
                className="nums-latin"
                style={{
                  position: 'absolute',
                  top: 4,
                  insetInlineEnd: 4,
                  minWidth: 16,
                  height: 16,
                  padding: '0 4px',
                  borderRadius: 8,
                  background: "var(--terra)",
                  color: "var(--cream)",
                  fontSize: 9,
                  fontWeight: 600,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  lineHeight: 1,
                }}
              >
                {totalAlerts > 99 ? "99+" : totalAlerts}
              </span>
            )}
          </button>
          {notifOpen && <NotificationsDropdown onClose={() => setNotifOpen(false)} />}
        </div>

        <LanguageToggle />
      </div>
    </header>
  );
}
