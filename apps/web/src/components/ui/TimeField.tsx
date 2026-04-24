'use client';

import React, { useEffect, useRef, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

interface TimeFieldProps {
  value?: string; // "HH:MM" 24h
  onChange?: (v: string) => void;
  placeholder?: string;
  error?: string;
  id?: string;
  name?: string;
  disabled?: boolean;
  /** Minute step for the quick list (default 5). */
  step?: number;
}

function parseValue(v?: string): { h: number; m: number } | null {
  if (!v) return null;
  const m = /^(\d{1,2}):(\d{1,2})$/.exec(v);
  if (!m) return null;
  const h = Number(m[1]);
  const mi = Number(m[2]);
  if (h < 0 || h > 23 || mi < 0 || mi > 59) return null;
  return { h, m: mi };
}
function formatDisplay(h: number, m: number) {
  const hh = String(h).padStart(2, '0');
  const mm = String(m).padStart(2, '0');
  return `${hh}:${mm}`;
}

export function TimeField({
  value,
  onChange,
  placeholder = '--:--',
  error,
  id,
  name,
  disabled,
  step = 5,
}: TimeFieldProps) {
  const [open, setOpen] = useState(false);
  const parsed = parseValue(value);
  const [h, setH] = useState<number>(parsed?.h ?? 9);
  const [m, setM] = useState<number>(parsed?.m ?? 0);
  const rootRef = useRef<HTMLDivElement>(null);
  const hourColRef = useRef<HTMLDivElement>(null);
  const minColRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (parsed) {
      setH(parsed.h);
      setM(parsed.m);
    }
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

  // Scroll selected rows into view on open
  useEffect(() => {
    if (!open) return;
    setTimeout(() => {
      hourColRef.current?.querySelector<HTMLElement>('[data-selected="true"]')?.scrollIntoView({ block: 'center' });
      minColRef.current?.querySelector<HTMLElement>('[data-selected="true"]')?.scrollIntoView({ block: 'center' });
    }, 0);
  }, [open]);

  const commit = (nh: number, nm: number) => {
    setH(nh);
    setM(nm);
    onChange?.(formatDisplay(nh, nm));
  };

  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: Math.floor(60 / step) }, (_, i) => i * step);

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
        <Clock className="h-4 w-4 text-[var(--ink-3)] shrink-0" />
        <span
          className={cn(
            'flex-1 text-sm nums-latin',
            parsed ? 'text-[var(--ink)]' : 'text-[var(--ink-4)]',
          )}
        >
          {parsed ? formatDisplay(parsed.h, parsed.m) : placeholder}
        </span>
      </button>
      {name && <input type="hidden" name={name} value={value ?? ''} readOnly />}
      {error && <p className="text-xs text-[var(--terra)] mt-1">{error}</p>}

      {open && (
        <div
          role="dialog"
          className="absolute z-50 mt-1 end-0 bg-[var(--cream)] border border-[var(--line)] shadow-xl rounded-[4px] p-2 flex gap-2"
        >
          <div ref={hourColRef} className="flex flex-col max-h-56 overflow-y-auto w-16 scrollbar-thin">
            {hours.map((hh) => {
              const sel = hh === h;
              return (
                <button
                  key={hh}
                  type="button"
                  data-selected={sel}
                  onClick={() => commit(hh, m)}
                  className={cn(
                    'text-center py-1.5 text-sm rounded nums-latin transition-colors',
                    sel
                      ? 'bg-[var(--forest)] text-[var(--cream)] font-medium'
                      : 'text-[var(--ink-2)] hover:bg-[var(--sand)]',
                  )}
                >
                  {String(hh).padStart(2, '0')}
                </button>
              );
            })}
          </div>
          <div className="w-px bg-[var(--line)]" />
          <div ref={minColRef} className="flex flex-col max-h-56 overflow-y-auto w-16 scrollbar-thin">
            {minutes.map((mm) => {
              const sel = mm === m || (m >= mm && m < mm + step);
              return (
                <button
                  key={mm}
                  type="button"
                  data-selected={sel}
                  onClick={() => commit(h, mm)}
                  className={cn(
                    'text-center py-1.5 text-sm rounded nums-latin transition-colors',
                    sel
                      ? 'bg-[var(--forest)] text-[var(--cream)] font-medium'
                      : 'text-[var(--ink-2)] hover:bg-[var(--sand)]',
                  )}
                >
                  {String(mm).padStart(2, '0')}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export default TimeField;
