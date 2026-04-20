import type { UserStatus } from "@/types/admin.types";

const config: Record<UserStatus, { label: string; bg: string; color: string }> = {
  active:    { label: "نشط",    bg: 'rgba(45,74,62,.1)',   color: 'var(--forest)' },
  suspended: { label: "موقوف",  bg: 'rgba(217,119,6,.1)', color: '#d97706' },
  banned:    { label: "محظور",  bg: 'rgba(180,94,66,.1)', color: 'var(--terra)' },
  pending:   { label: "معلق",   bg: 'rgba(107,142,156,.12)', color: 'var(--sky)' },
};

export function UserStatusBadge({ status }: { status: UserStatus; showDot?: boolean; className?: string }) {
  const c = config[status] ?? { label: status, bg: 'var(--sand)', color: 'var(--ink-3)' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', fontSize: 10, fontWeight: 500, background: c.bg, color: c.color, borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {c.label}
    </span>
  );
}
