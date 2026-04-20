"use client";

import { Search, X } from "lucide-react";
import { AdminButton } from "./AdminButton";

interface FilterOption {
  label: string;
  value: string;
}

interface FilterField {
  id: string;
  label: string;
  type: "text" | "select";
  placeholder?: string;
  options?: FilterOption[];
  value: string;
  onChange: (value: string) => void;
}

interface FiltersProps {
  fields: FilterField[];
  onReset?: () => void;
  hasActiveFilters?: boolean;
}

export function Filters({ fields, onReset, hasActiveFilters }: FiltersProps) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      {fields.map((field) => (
        <div key={field.id} className="flex flex-col gap-1 min-w-0">
          <label
            htmlFor={field.id}
            className="text-xs font-medium text-slate-400"
          >
            {field.label}
          </label>
          {field.type === "text" ? (
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                id={field.id}
                type="text"
                value={field.value}
                onChange={(e) => field.onChange(e.target.value)}
                placeholder={field.placeholder}
                className="w-60 pl-9 pr-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              />
              {field.value && (
                <button
                  onClick={() => field.onChange("")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          ) : (
            <select
              id={field.id}
              value={field.value}
              onChange={(e) => field.onChange(e.target.value)}
              className="w-44 px-3 py-2 bg-slate-800 border border-slate-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent appearance-none cursor-pointer"
            >
              <option value="">{field.placeholder ?? `All ${field.label}`}</option>
              {field.options?.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          )}
        </div>
      ))}
      {hasActiveFilters && onReset && (
        <AdminButton variant="ghost" size="sm" onClick={onReset} leftIcon={<X className="w-4 h-4" />}>
          Reset
        </AdminButton>
      )}
    </div>
  );
}
