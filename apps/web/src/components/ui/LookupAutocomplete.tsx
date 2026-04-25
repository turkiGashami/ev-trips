'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Search, X, Loader2, Plus, Check } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface LookupOption {
  id: string;
  name: string;
  name_ar?: string | null;
  [key: string]: any;
}

export interface LookupAutocompleteProps {
  /** Currently selected display name (controlled). */
  value?: string;
  /** All known options to filter against. */
  options: LookupOption[];
  /** Fired when the user picks an existing option. */
  onSelect: (option: LookupOption) => void;
  /** Fired when the user clears the field. */
  onClear?: () => void;
  /** Optional create handler — if provided, the user can suggest a new entry. */
  onCreate?: (name: string) => Promise<LookupOption | null>;
  /** Placeholder shown when empty. */
  placeholder?: string;
  /** Disable the input (e.g. waiting for parent select). */
  disabled?: boolean;
  /** Optional id for label association. */
  id?: string;
  /** Force-fit into a small input. */
  size?: 'sm' | 'md';
  /** Visible error text below the field. */
  error?: string;
}

/**
 * Generic typeahead picker for lookup tables (brands, models, trims, …).
 * Mirrors the CityAutocomplete UX: type to filter, click to pick, optional
 * inline "Add new" button when nothing matches.
 */
export default function LookupAutocomplete({
  value = '',
  options,
  onSelect,
  onClear,
  onCreate,
  placeholder = 'ابحث...',
  disabled = false,
  id,
  size = 'md',
  error,
}: LookupAutocompleteProps) {
  const [input, setInput] = useState(value);
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(-1);
  const [creating, setCreating] = useState(false);
  const [focused, setFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uid = useId();
  const listId = `lookup-${uid}`;

  // Keep input synced when parent value changes (e.g., reset programmatically),
  // but only when the user isn't actively typing — otherwise our own onClear
  // would wipe what they just keyed in.
  useEffect(() => {
    if (!focused) setInput(value);
  }, [value, focused]);

  const trimmed = input.trim();
  const filtered = options.filter((o) => {
    if (!trimmed) return true;
    const name = (o.name || '').toLowerCase();
    const nameAr = (o.name_ar || '').toLowerCase();
    const q = trimmed.toLowerCase();
    return name.includes(q) || nameAr.includes(q);
  });

  const exactMatch = options.find((o) => {
    const q = trimmed.toLowerCase();
    return (o.name || '').toLowerCase() === q || (o.name_ar || '').toLowerCase() === q;
  });

  const select = (opt: LookupOption) => {
    setInput(opt.name_ar || opt.name);
    setOpen(false);
    setHighlight(-1);
    onSelect(opt);
  };

  const create = async () => {
    if (!onCreate || !trimmed || creating || exactMatch) return;
    setCreating(true);
    try {
      const created = await onCreate(trimmed);
      if (created) select(created);
    } finally {
      setCreating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlight((h) => Math.min(h + 1, filtered.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlight >= 0 && filtered[highlight]) {
        select(filtered[highlight]);
      } else if (onCreate && trimmed && !exactMatch) {
        void create();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const handleClear = () => {
    setInput('');
    setOpen(false);
    setHighlight(-1);
    onClear?.();
    inputRef.current?.focus();
  };

  const showCreateRow = !!onCreate && trimmed.length >= 2 && !exactMatch && !creating;

  const heightCls = size === 'sm' ? 'h-9' : 'h-11';
  const textCls = size === 'sm' ? 'text-xs' : 'text-sm';

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--ink-3)]" />
        <input
          ref={inputRef}
          id={id}
          value={input}
          disabled={disabled}
          onChange={(e) => {
            const next = e.target.value;
            setInput(next);
            setOpen(true);
            setHighlight(-1);
            // If the user is editing the field, the previously-selected
            // option no longer matches what they typed — drop the
            // selection so the filter doesn't keep applying the old id
            // until they pick again.
            if (!next || next.trim() !== value.trim()) {
              onClear?.();
            }
          }}
          onFocus={() => {
            setFocused(true);
            setOpen(true);
          }}
          onBlur={() => {
            setTimeout(() => {
              setFocused(false);
              setOpen(false);
              // On blur, snap the visible text back to the actual selection
              // so we don't leave dangling typed text that doesn't match
              // any picked option.
              setInput((curr) => (curr.trim() === value.trim() ? curr : value));
            }, 150);
          }}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls={listId}
          className={cn(
            'input-base ps-9 pe-8',
            heightCls,
            textCls,
            disabled && 'opacity-50 cursor-not-allowed',
            error && 'border-[var(--terra)]',
          )}
        />
        {input && !disabled && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleClear();
            }}
            className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--ink-3)] hover:text-[var(--ink)]"
            tabIndex={-1}
            aria-label="مسح"
          >
            <X className="h-3 w-3" />
          </button>
        )}
        {creating && (
          <Loader2 className="absolute end-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--ink-3)] animate-spin" />
        )}
      </div>

      {error && <p className="mt-1 text-xs text-[var(--terra)]">{error}</p>}

      {open && !disabled && (filtered.length > 0 || showCreateRow) && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 start-0 end-0 mt-1 bg-[var(--cream)] border border-[var(--line)] shadow-lg max-h-60 overflow-y-auto rounded-[2px]"
        >
          {filtered.slice(0, 30).map((opt, i) => (
            <li
              key={opt.id}
              role="option"
              aria-selected={i === highlight}
              onMouseDown={() => select(opt)}
              onMouseEnter={() => setHighlight(i)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 cursor-pointer text-sm',
                i === highlight
                  ? 'bg-[var(--sand)] text-[var(--ink)]'
                  : 'text-[var(--ink-2)] hover:bg-[var(--sand)]/60',
              )}
            >
              {value && (opt.name === value || opt.name_ar === value) ? (
                <Check className="h-3.5 w-3.5 text-[var(--forest)] shrink-0" />
              ) : (
                <span className="w-3.5 shrink-0" />
              )}
              <span className="font-medium">{opt.name_ar || opt.name}</span>
              {opt.name_ar && opt.name && opt.name_ar !== opt.name && (
                <span className="text-[var(--ink-3)] text-xs ms-auto" dir="ltr">{opt.name}</span>
              )}
            </li>
          ))}
          {showCreateRow && (
            <li
              role="option"
              aria-selected={false}
              onMouseDown={() => void create()}
              className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer text-sm text-[var(--forest)] border-t border-[var(--line)] bg-[var(--sand)]/30 hover:bg-[var(--sand)]"
            >
              <Plus className="h-3.5 w-3.5 shrink-0" />
              <span>إضافة "{trimmed}" كخيار جديد</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}
