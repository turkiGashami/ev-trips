function isInvalid(v: unknown): boolean {
  return v === null || v === undefined || v === '' || (typeof v === 'number' && !isFinite(v));
}

export function formatNumber(value: unknown, fallback = '0'): string {
  if (isInvalid(value)) return fallback;
  const n = typeof value === 'number' ? value : Number(value);
  if (!isFinite(n)) return fallback;
  return n.toLocaleString('ar-SA');
}

export function formatDate(value: unknown, fallback = '—', locale = 'ar-SA'): string {
  if (isInvalid(value)) return fallback;
  const d = value instanceof Date ? value : new Date(value as string);
  if (isNaN(d.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

export function formatDateTime(value: unknown, fallback = '—', locale = 'ar-SA'): string {
  if (isInvalid(value)) return fallback;
  const d = value instanceof Date ? value : new Date(value as string);
  if (isNaN(d.getTime())) return fallback;
  return new Intl.DateTimeFormat(locale, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function formatPercent(value: unknown, fallback = '—', digits = 0): string {
  if (isInvalid(value)) return fallback;
  const n = typeof value === 'number' ? value : Number(value);
  if (!isFinite(n)) return fallback;
  return `${n.toFixed(digits)}%`;
}

export function formatDuration(value: unknown, fallback = '—'): string {
  if (isInvalid(value)) return fallback;
  const n = typeof value === 'number' ? value : Number(value);
  if (!isFinite(n) || n < 0) return fallback;
  const minutes = Math.round(n);
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (hours === 0) return `${mins}د`;
  if (mins === 0) return `${hours}س`;
  return `${hours}س ${mins}د`;
}

export function safeText(value: unknown, fallback = '—'): string {
  if (isInvalid(value)) return fallback;
  return String(value);
}

export function safeFixed(value: unknown, digits = 1, fallback = '—'): string {
  if (isInvalid(value)) return fallback;
  const n = typeof value === 'number' ? value : Number(value);
  if (!isFinite(n)) return fallback;
  return n.toFixed(digits);
}
