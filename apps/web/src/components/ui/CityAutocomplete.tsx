'use client';

import { useState, useRef, useEffect, useId } from 'react';
import { Search, X, MapPin, Loader2, Plus } from 'lucide-react';
import { useSearchCities } from '../../hooks/useLookup';
import { lookupApi } from '../../lib/api/lookup.api';
import { cn } from '../../lib/utils';

interface CityAutocompleteProps {
  selectedName?: string;
  onSelect: (id: string, nameAr: string, nameEn?: string) => void;
  onClear?: () => void;
  onInputChange?: (value: string) => void;
  placeholder?: string;
  id?: string;
  /** When true, users can add a new city that doesn't match any suggestion. */
  allowCreate?: boolean;
}

export function CityAutocomplete({
  selectedName = '',
  onSelect,
  onClear,
  onInputChange,
  placeholder = 'ابحث عن مدينة...',
  id,
  allowCreate = true,
}: CityAutocompleteProps) {
  const [inputValue, setInputValue] = useState(selectedName);
  const [open, setOpen] = useState(false);
  const [debouncedQ, setDebouncedQ] = useState('');
  const [highlighted, setHighlighted] = useState(-1);
  const [creating, setCreating] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const uid = useId();
  const listId = `city-list-${uid}`;

  useEffect(() => {
    setInputValue(selectedName);
  }, [selectedName]);

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(inputValue), 250);
    return () => clearTimeout(t);
  }, [inputValue]);

  const { data: suggestions = [], isFetching } = useSearchCities(debouncedQ);

  const select = (city: any) => {
    const cityNameAr = city.name_ar ?? city.nameAr ?? city.name ?? '';
    const cityNameEn = city.name ?? city.nameEn;

    setInputValue(cityNameAr);
    onInputChange?.(cityNameAr);
    onSelect(city.id, cityNameAr, cityNameEn);

    setOpen(false);
    setHighlighted(-1);
  };

  const trimmed = inputValue.trim();
  const hasExactMatch = suggestions.some((c: any) => {
    const ar = (c.name_ar ?? c.nameAr ?? '').trim().toLowerCase();
    const en = (c.name ?? c.nameEn ?? '').trim().toLowerCase();
    const q = trimmed.toLowerCase();
    return ar === q || en === q;
  });
  const canCreate =
    allowCreate && trimmed.length >= 2 && !hasExactMatch && !isFetching;

  const createCity = async () => {
    if (!trimmed || creating) return;
    setCreating(true);
    try {
      const res = await lookupApi.createCity(trimmed);
      const created = (res as any)?.data?.data ?? (res as any)?.data ?? res;
      if (created?.id) select(created);
    } catch (err) {
      // Silently keep input open — user can retry
      console.error('createCity failed', err);
    } finally {
      setCreating(false);
    }
  };

  const handleInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;

    setInputValue(value);
    onInputChange?.(value);

    setOpen(true);
    setHighlighted(-1);

    if (!value) {
      onClear?.();
    }
  };

  const handleClear = () => {
    setInputValue('');
    onInputChange?.('');
    onClear?.();
    setOpen(false);
    setHighlighted(-1);
    inputRef.current?.focus();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlighted((h) => Math.min(h + 1, suggestions.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlighted((h) => Math.max(h - 1, 0));
    } else if (e.key === 'Enter') {
      if (highlighted >= 0 && suggestions[highlighted]) {
        e.preventDefault();
        select(suggestions[highlighted]);
      } else if (canCreate) {
        e.preventDefault();
        void createCity();
      }
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--ink-3)]" />

        <input
          ref={inputRef}
          id={id}
          value={inputValue}
          onChange={handleInput}
          onKeyDown={handleKeyDown}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open && suggestions.length > 0}
          aria-autocomplete="list"
          aria-controls={listId}
          aria-activedescendant={
            highlighted >= 0 ? `${listId}-${highlighted}` : undefined
          }
          className="input-base h-11 text-sm ps-9 pe-8"
        />

        {isFetching && (
          <Loader2 className="absolute end-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[var(--ink-3)] animate-spin" />
        )}

        {inputValue && !isFetching && (
          <button
            type="button"
            onMouseDown={(e) => {
              e.preventDefault();
              handleClear();
            }}
            className="absolute end-2.5 top-1/2 -translate-y-1/2 p-1 text-[var(--ink-3)] hover:text-[var(--ink)] transition-colors"
            tabIndex={-1}
            aria-label="مسح"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {open && (suggestions.length > 0 || canCreate) && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-50 start-0 end-0 mt-1 bg-[var(--cream)] border border-[var(--line)] shadow-lg max-h-52 overflow-y-auto rounded-[2px]"
        >
          {suggestions.map((city: any, i: number) => (
            <li
              key={city.id}
              id={`${listId}-${i}`}
              role="option"
              aria-selected={i === highlighted}
              onMouseDown={() => select(city)}
              onMouseEnter={() => setHighlighted(i)}
              className={cn(
                'flex items-center gap-2.5 px-3 py-2.5 cursor-pointer text-sm transition-colors',
                i === highlighted
                  ? 'bg-[var(--sand)] text-[var(--ink)]'
                  : 'text-[var(--ink-2)] hover:bg-[var(--sand)]/60',
              )}
            >
              <MapPin className="h-3.5 w-3.5 text-[var(--ink-3)] shrink-0" />

              <span className="font-medium">
                {city.name_ar ?? city.nameAr ?? city.name}
              </span>

              <span className="text-[var(--ink-3)] text-xs ms-auto">
                {city.name ?? city.nameEn}
              </span>
            </li>
          ))}

          {canCreate && (
            <li
              role="option"
              aria-selected={false}
              onMouseDown={(e) => {
                e.preventDefault();
                void createCity();
              }}
              className="flex items-center gap-2.5 px-3 py-2.5 cursor-pointer text-sm text-[var(--forest)] border-t border-[var(--line)] hover:bg-[var(--sand)]/60"
            >
              {creating ? (
                <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
              ) : (
                <Plus className="h-3.5 w-3.5 shrink-0" />
              )}
              <span>إضافة «{trimmed}» كمدينة جديدة</span>
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export default CityAutocomplete;
