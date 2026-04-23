"use client";

import { Globe } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useAdminAuthStore } from "@/store/admin-auth.store";

export function LanguageToggle() {
  const locale = useLocale();
  const t = useTranslations("topbar");
  const setLanguage = useAdminAuthStore((s) => s.setLanguage);

  const toggle = () => {
    const next = locale === "en" ? "ar" : "en";
    // next-intl reads from this cookie server-side
    document.cookie = `admin_locale=${next}; path=/; max-age=${60 * 60 * 24 * 365}; samesite=lax`;
    // keep zustand store in sync so consumers that read from it (e.g. legacy
    // components) also update — store also updates document dir/lang.
    try {
      setLanguage(next);
    } catch {
      /* non-fatal */
    }
    window.location.reload();
  };

  return (
    <button
      onClick={toggle}
      className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors rounded-[2px]"
      style={{ color: "var(--ink-2)", border: "1px solid var(--line)" }}
      onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--ink)"; }}
      onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--line)"; }}
      title={t("toggleLanguage")}
    >
      <Globe className="w-3.5 h-3.5" />
      {locale === "en" ? t("arabic") : t("english")}
    </button>
  );
}
