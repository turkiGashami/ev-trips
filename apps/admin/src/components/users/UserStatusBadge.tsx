"use client";

import { useTranslations } from "next-intl";
import type { UserStatus } from "@/types/admin.types";

const tone: Record<UserStatus, { bg: string; color: string }> = {
  active:    { bg: 'rgba(45,74,62,.1)',   color: 'var(--forest)' },
  suspended: { bg: 'rgba(217,119,6,.1)',  color: '#d97706' },
  banned:    { bg: 'rgba(180,94,66,.1)',  color: 'var(--terra)' },
  pending:   { bg: 'rgba(107,142,156,.12)', color: 'var(--sky)' },
};

export function UserStatusBadge({ status }: { status: UserStatus; showDot?: boolean; className?: string }) {
  const tStatus = useTranslations("status");
  const t = tone[status] ?? { bg: 'var(--sand)', color: 'var(--ink-3)' };
  const label = tone[status] ? tStatus(status as any) : status;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', fontSize: 10, fontWeight: 500, background: t.bg, color: t.color, borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {label}
    </span>
  );
}
