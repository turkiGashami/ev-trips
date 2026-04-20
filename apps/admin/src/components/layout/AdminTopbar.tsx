"use client";

import { Bell, Search, Globe } from "lucide-react";
import { useAdminAuthStore, selectLanguage } from "@/store/admin-auth.store";

interface AdminTopbarProps {
  title: string;
  subtitle?: string;
}

export function AdminTopbar({ title, subtitle }: AdminTopbarProps) {
  const { setLanguage } = useAdminAuthStore();
  const language = useAdminAuthStore(selectLanguage);

  const toggleLanguage = () => {
    setLanguage(language === "en" ? "ar" : "en");
  };

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
          className="w-9 h-9 flex items-center justify-center transition-colors rounded-[2px]"
          style={{ color: "var(--ink-3)" }}
          onMouseOver={(e) => { e.currentTarget.style.color = "var(--ink)"; e.currentTarget.style.background = "var(--sand)"; }}
          onMouseOut={(e) => { e.currentTarget.style.color = "var(--ink-3)"; e.currentTarget.style.background = "transparent"; }}
        >
          <Search className="w-4 h-4" />
        </button>

        <button
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

        <button
          onClick={toggleLanguage}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors rounded-[2px]"
          style={{ color: "var(--ink-2)", border: "1px solid var(--line)" }}
          onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--ink)"; }}
          onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--line)"; }}
          title="Toggle language"
        >
          <Globe className="w-3.5 h-3.5" />
          {language === "en" ? "عربي" : "EN"}
        </button>
      </div>
    </header>
  );
}
