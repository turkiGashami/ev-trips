"use client";

import { Bell, Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { LanguageToggle } from "./LanguageToggle";

interface AdminTopbarProps {
  title: string;
  subtitle?: string;
}

export function AdminTopbar({ title, subtitle }: AdminTopbarProps) {
  const t = useTranslations("topbar");

  return (
    <header
      style={{ height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px', flexShrink: 0, background: "var(--cream)", borderBottom: "1px solid var(--line)" }}
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

        <button
          aria-label={t("notifications")}
          title={t("notifications")}
          className="relative w-9 h-9 flex items-center justify-center transition-colors rounded-[2px]"
          style={{ color: "var(--ink-3)" }}
          onMouseOver={(e) => { e.currentTarget.style.color = "var(--ink)"; e.currentTarget.style.background = "var(--sand)"; }}
          onMouseOut={(e) => { e.currentTarget.style.color = "var(--ink-3)"; e.currentTarget.style.background = "transparent"; }}
        >
          <Bell className="w-4 h-4" />
          <span
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ background: "var(--terra)" }}
          />
        </button>

        <LanguageToggle />
      </div>
    </header>
  );
}
