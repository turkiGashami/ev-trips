import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function isInvalid(v: unknown): boolean {
  return v === null || v === undefined || v === '' || (typeof v === 'number' && !isFinite(v));
}

// Always render digits in Latin form regardless of UI language (product rule).
// BCP-47 `-u-nu-latn` extension forces Latin numbering inside ar-SA so
// dates read "23 أبريل 2026" not "٢٣ أبريل ٢٠٢٦".
const NUMBER_LOCALE = 'en-US';
const DATE_LOCALE_AR = 'ar-SA-u-nu-latn';
const DATE_LOCALE_EN = 'en-US';

function dateLocale(locale?: string): string {
  if (!locale) return DATE_LOCALE_AR;
  if (locale.startsWith('ar')) return DATE_LOCALE_AR;
  if (locale.startsWith('en')) return DATE_LOCALE_EN;
  return locale;
}

export function formatNumber(value: unknown, fallback = '0'): string {
  if (isInvalid(value)) return fallback;
  const n = typeof value === 'number' ? value : Number(value);
  if (!isFinite(n)) return fallback;
  return n.toLocaleString(NUMBER_LOCALE);
}

export function formatDate(value: unknown, fallback = '—', locale = DATE_LOCALE_AR): string {
  if (isInvalid(value)) return fallback;
  const d = value instanceof Date ? value : new Date(value as string);
  if (isNaN(d.getTime())) return fallback;
  return new Intl.DateTimeFormat(dateLocale(locale), {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

export function formatDateTime(value: unknown, fallback = '—', locale = DATE_LOCALE_AR): string {
  if (isInvalid(value)) return fallback;
  const d = value instanceof Date ? value : new Date(value as string);
  if (isNaN(d.getTime())) return fallback;
  return new Intl.DateTimeFormat(dateLocale(locale), {
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

/**
 * Returns NEXT_PUBLIC_API_URL normalized: strips trailing slashes and any
 * trailing `/api/v1` so callers can safely append `/api/v1/...` themselves
 * without risking `/api/v1/api/v1/...`.
 */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
  return raw.replace(/\/+$/, '').replace(/\/api\/v1$/, '');
}
