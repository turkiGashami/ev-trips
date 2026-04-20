type Status = "active" | "suspended" | "banned" | "pending" | "approved" | "rejected" | "hidden" | "draft" | "visible" | "reported" | "open" | "resolved" | "dismissed" | "verified" | "premium" | "user";

const statusConfig: Record<Status, { label: string; bg: string; color: string }> = {
  active:    { label: "نشط",              bg: 'rgba(45,74,62,.1)',   color: 'var(--forest)' },
  approved:  { label: "منشور",            bg: 'rgba(45,74,62,.1)',   color: 'var(--forest)' },
  visible:   { label: "مرئي",             bg: 'rgba(45,74,62,.1)',   color: 'var(--forest)' },
  resolved:  { label: "تمت المراجعة",    bg: 'rgba(45,74,62,.1)',   color: 'var(--forest)' },
  verified:  { label: "موثق",             bg: 'rgba(107,142,156,.12)', color: 'var(--sky)' },
  premium:   { label: "مميز",             bg: 'rgba(139,92,246,.1)', color: '#7c3aed' },
  suspended: { label: "موقوف",            bg: 'rgba(217,119,6,.1)',  color: '#d97706' },
  open:      { label: "مفتوح",            bg: 'rgba(217,119,6,.1)',  color: '#d97706' },
  pending:   { label: "قيد المراجعة",    bg: 'rgba(217,119,6,.1)',  color: '#d97706' },
  banned:    { label: "محظور",            bg: 'rgba(180,94,66,.1)',  color: 'var(--terra)' },
  rejected:  { label: "مرفوض",           bg: 'rgba(180,94,66,.1)',  color: 'var(--terra)' },
  reported:  { label: "مُبلَّغ عنه",     bg: 'rgba(180,94,66,.1)',  color: 'var(--terra)' },
  hidden:    { label: "مخفي",             bg: 'var(--sand)',          color: 'var(--ink-4)' },
  draft:     { label: "مسودة",            bg: 'var(--sand)',          color: 'var(--ink-4)' },
  dismissed: { label: "مرفوض",           bg: 'var(--sand)',          color: 'var(--ink-4)' },
  user:      { label: "مستخدم",           bg: 'var(--sand)',          color: 'var(--ink-2)' },
};

export function StatusBadge({ status }: { status: Status | string; className?: string }) {
  const c = statusConfig[status as Status] ?? { label: status, bg: 'var(--sand)', color: 'var(--ink-3)' };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '2px 8px', fontSize: 10, fontWeight: 500, background: c.bg, color: c.color, borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {c.label}
    </span>
  );
}
