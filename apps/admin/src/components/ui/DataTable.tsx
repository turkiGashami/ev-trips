"use client";

import { ChevronUp, ChevronDown, ChevronsUpDown, ChevronLeft, ChevronRight } from "lucide-react";

export interface Column<T> {
  key: string;
  header: string;
  sortable?: boolean;
  width?: string;
  render?: (row: T) => React.ReactNode;
}

interface SortConfig {
  key: string;
  dir: "asc" | "desc";
}

interface DataTableProps<T extends { id: string }> {
  columns: Column<T>[];
  data: T[];
  isLoading?: boolean;
  sort?: SortConfig;
  onSort?: (key: string) => void;
  page?: number;
  totalPages?: number;
  onPageChange?: (page: number) => void;
  total?: number;
  limit?: number;
  emptyMessage?: string;
  onRowClick?: (row: T) => void;
}

function SortIcon({ columnKey, sort }: { columnKey: string; sort?: SortConfig }) {
  const color = 'var(--ink-4)';
  const activeColor = 'var(--ink)';
  if (!sort || sort.key !== columnKey) return <ChevronsUpDown style={{ width: 12, height: 12, color }} />;
  return sort.dir === "asc"
    ? <ChevronUp style={{ width: 12, height: 12, color: activeColor }} />
    : <ChevronDown style={{ width: 12, height: 12, color: activeColor }} />;
}

export function DataTable<T extends { id: string }>({
  columns, data, isLoading = false, sort, onSort,
  page = 1, totalPages = 1, onPageChange, total, limit,
  emptyMessage = "لا توجد سجلات", onRowClick,
}: DataTableProps<T>) {
  const startItem = total && limit ? (page - 1) * limit + 1 : null;
  const endItem = total && limit ? Math.min(page * limit, total) : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="admin-table">
            <thead>
              <tr>
                {columns.map((col) => (
                  <th
                    key={col.key}
                    style={{ width: col.width, cursor: col.sortable ? 'pointer' : 'default', textAlign: 'right' }}
                    onClick={() => col.sortable && onSort?.(col.key)}
                  >
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                      {col.header}
                      {col.sortable && <SortIcon columnKey={col.key} sort={sort} />}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {columns.map((col) => (
                      <td key={col.key}>
                        <div className="skeleton" style={{ height: 14 }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data.length === 0 ? (
                <tr>
                  <td colSpan={columns.length} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--ink-4)' }}>
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                data.map((row) => (
                  <tr
                    key={row.id}
                    onClick={() => onRowClick?.(row)}
                    style={{ cursor: onRowClick ? 'pointer' : 'default' }}
                  >
                    {columns.map((col) => (
                      <td key={col.key}>
                        {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "—")}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {totalPages > 1 && (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, padding: '0 4px' }}>
          <p style={{ fontSize: 11, color: 'var(--ink-4)' }}>
            {startItem && endItem && total ? `${startItem}–${endItem} من ${total}` : ""}
          </p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <button
              onClick={() => onPageChange?.(page - 1)}
              disabled={page <= 1}
              style={{ padding: 6, color: 'var(--ink-3)', background: 'none', border: 'none', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1, display: 'flex' }}
            >
              <ChevronRight style={{ width: 16, height: 16 }} />
            </button>
            {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
              let pageNum = i + 1;
              if (totalPages > 7) {
                if (page <= 4) { pageNum = i + 1; if (i === 6) pageNum = totalPages; }
                else if (page >= totalPages - 3) { pageNum = totalPages - 6 + i; }
                else { if (i === 0) pageNum = 1; else if (i === 6) pageNum = totalPages; else pageNum = page - 2 + i; }
              }
              const isActive = pageNum === page;
              return (
                <button
                  key={`page-${pageNum}`}
                  onClick={() => onPageChange?.(pageNum)}
                  style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: isActive ? 500 : 400, background: isActive ? 'var(--ink)' : 'transparent', color: isActive ? 'var(--cream)' : 'var(--ink-3)', border: isActive ? '1px solid var(--ink)' : '1px solid transparent', borderRadius: 2, cursor: 'pointer' }}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => onPageChange?.(page + 1)}
              disabled={page >= totalPages}
              style={{ padding: 6, color: 'var(--ink-3)', background: 'none', border: 'none', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1, display: 'flex' }}
            >
              <ChevronLeft style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
