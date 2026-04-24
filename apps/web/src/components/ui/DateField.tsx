'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Calendar, ChevronRight, ChevronLeft } from 'lucide-react';
import { cn } from '../../lib/utils';

interface DateFieldProps {
  value?: string; // ISO YYYY-MM-DD
  onChange?: (v: string) => void;
  min?: string;
  max?: string;
  placeholder?: string;
  error?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
}

const AR_MONTHS = [
  'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
  'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
];
const AR_WEEKDAYS = ['أحد', 'إثن', 'ثلا', 'أرب', 'خمي', 'جمع', 'سبت'];

function parseISO(s?: string): Date | null {
  if (!s) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s);
  if (!m) return null;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return isNaN(d.getTime()) ? null : d;
}
function toISO(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
}
function formatDisplay(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd} / ${mm} / ${d.getFullYear()}`;
}

export function DateField({
  value,
  onChange,
  min,
  max,
  placeholder = 'اختر التاريخ',
  error,
  id,
  name,
  disabled,
}: DateFieldProps) {
  const [open, setOpen] = useState(false);
  const selected = parseISO(value);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [viewMonth, setViewMonth] = useState<Date>(() => {
    const d = selected ?? today;
    return new Date(d.getFullYear(), d.getMonth(), 1);
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const minDate = parseISO(min);
  const maxDate = parseISO(max);

  useEffect(() => {
    if (selected) setViewMonth(new Date(selected.getFullYear(), selected.getMonth(), 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    if (!open) return;
    const handle = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', handle);
    document.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handle);
      document.removeEventListener('keydown', handleKey);
    };
  }, [open]);

  // Build calendar grid (6 weeks × 7 days) starting on Sunday
  const firstOfMonth = new Date(viewMonth);
  const startOffset = firstOfMonth.getDay(); // 0=Sun
  const gridStart = new Date(firstOfMonth);
  gridStart.setDate(firstOfMonth.getDate() - startOffset);
  const days: Date[] = [];
  for (let i = 0; i < 42; i++) {
    const d = new Date(gridStart);
    d.setDate(gridStart.getDate() + i);
    days.push(d);
  }

  const isDisabled = (d: Date) => {
    if (minDate && d < minDate) return true;
    if (maxDate && d > maxDate) return true;
    return false;
  };
  const isSameDay = (a: Date, b: Date | null) =>
    !!b && a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  const select = (d: Date) => {
    if (isDisabled(d) || disabled) return;
    onChange?.(toISO(d));
    setOpen(false);
  };

  const shiftMonth = (delta: number) => {
    setViewMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1));
  };

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        id={id}
        disabled={disabled}
        onClick={() => !disabled && setOpen((o) => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        className={cn(
          'relative w-full flex items-center gap-2.5 border h-11 ps-3 pe-3 bg-white rounded-xl transition-colors cursor-pointer text-start',
          'hover:border-[var(--ink)] focus:outline-none focus:border-[var(--ink)]',
          error ? 'border-[var(--terra)]' : 'border-[var(--line)]',
          disabled && 'opacity-60 cursor-not-allowed',
        )}
      >
        <Calendar className="h-4 w-4 text-[var(--ink-3)] shrink-0" />
        <span
          className={cn(
            'flex-1 text-sm nums-latin',
            selected ? 'text-[var(--ink)]' : 'text-[var(--ink-4)]',
          )}
        >
          {selected ? formatDisplay(selected) : placeholder}
        </span>
      </button>
      {name && <input type="hidden" name={name} value={value ?? ''} readOnly />}
      {error && <p className="text-xs text-[var(--terra)] mt-1">{error}</p>}

      {open && (
        <div
          role="dialog"
          className="absolute z-50 mt-1 w-[19rem] end-0 bg-[var(--cream)] border border-[var(--line)] shadow-xl rounded-[4px] p-3"
        >
          <div className="flex items-center justify-between mb-3">
            <button
              type="button"
              onClick={() => shiftMonth(1)}
              className="p-1.5 rounded hover:bg-[var(--sand)] text-[var(--ink-2)]"
              aria-label="الشهر التالي"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <div className="text-sm font-medium text-[var(--ink)] nums-latin">
              {AR_MONTHS[viewMonth.getMonth()]} {viewMonth.getFullYear()}
            </div>
            <button
              type="button"
              onClick={() => shiftMonth(-1)}
              className="p-1.5 rounded hover:bg-[var(--sand)] text-[var(--ink-2)]"
              aria-label="الشهر السابق"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-1">
            {AR_WEEKDAYS.map((w) => (
              <div key={w} className="text-[10px] text-[var(--ink-4)] text-center py-1">
                {w}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {days.map((d, i) => {
              const inMonth = d.getMonth() === viewMonth.getMonth();
              const disabled = isDisabled(d);
              const selectedDay = isSameDay(d, selected);
              const isToday = isSameDay(d, today);
              return (
                <button
                  key={i}
                  type="button"
                  onClick={() => select(d)}
                  disabled={disabled}
                  className={cn(
                    'h-8 text-xs rounded nums-latin transition-colors',
                    selectedDay
                      ? 'bg-[var(--forest)] text-[var(--cream)] font-medium'
                      : isToday
                        ? 'bg-[var(--sand)] text-[var(--ink)]'
                        : 'text-[var(--ink-2)] hover:bg-[var(--sand)]',
                    !inMonth && !selectedDay && 'text-[var(--ink-4)]/60',
                    disabled && 'opacity-30 cursor-not-allowed hover:bg-transparent',
                  )}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>

          <div className="mt-3 pt-3 border-t border-[var(--line)] flex items-center justify-between">
            <button
              type="button"
              onClick={() => {
                if (!disabled) {
                  onChange?.('');
                  setOpen(false);
                }
              }}
              className="text-xs text-[var(--ink-3)] hover:text-[var(--ink)] px-2 py-1"
            >
              مسح
            </button>
            <button
              type="button"
              onClick={() => select(today)}
              className="text-xs text-[var(--forest)] hover:text-[var(--forest)]/80 px-2 py-1"
            >
              اليوم
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default DateField;
