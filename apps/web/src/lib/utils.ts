import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
    month: 'long',
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

export function batteryColor(pct: number): string {
  if (pct > 60) return 'text-emerald-600';
  if (pct > 30) return 'text-amber-500';
  return 'text-red-500';
}

export function batteryBgColor(pct: number): string {
  if (pct > 60) return 'bg-emerald-500';
  if (pct > 30) return 'bg-amber-400';
  return 'bg-red-500';
}

export function truncate(str: string | null | undefined, maxLength: number): string {
  if (!str) return '';
  if (str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w-]+/g, '')
    .replace(/--+/g, '-')
    .trim();
}
