"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Star, Trash2, Search, X, MapPin, ExternalLink } from "lucide-react";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { tripsApi } from "@/lib/api/admin.api";
import type { Trip, TripStatus } from "@/types/admin.types";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate, formatNumber, safeText } from "@/lib/format";

const PAGE_LIMIT = 15;

const STATUS_LABELS: Record<string, string> = {
  "": "الكل", draft: "مسودة", pending: "قيد المراجعة", approved: "منشورة", rejected: "مرفوضة", hidden: "مخفية",
};

const STATUS_COLOR: Record<TripStatus, { bg: string; color: string }> = {
  draft:    { bg: 'var(--sand)',                  color: 'var(--ink-3)' },
  pending:  { bg: 'rgba(217,119,6,.1)',            color: '#d97706' },
  approved: { bg: 'rgba(45,74,62,.1)',             color: 'var(--forest)' },
  rejected: { bg: 'rgba(180,94,66,.1)',            color: 'var(--terra)' },
  hidden:   { bg: 'var(--sand)',                   color: 'var(--ink-4)' },
};

function StatusBadge({ status }: { status: TripStatus }) {
  const s = STATUS_COLOR[status] ?? STATUS_COLOR.draft;
  return (
    <span style={{ display: 'inline-flex', padding: '2px 8px', fontSize: 10, fontWeight: 500, background: s.bg, color: s.color, borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

type ConfirmAction = "hide" | "delete" | null;
interface ConfirmState { action: ConfirmAction; trip: Trip | null; }

export default function TripsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [confirm, setConfirm] = useState<ConfirmState>({ action: null, trip: null });
  const [sort, setSort] = useState({ key: "createdAt", dir: "desc" as "asc" | "desc" });

  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin", "trips", "all", page, debouncedSearch, statusFilter, sort],
    queryFn: () => tripsApi.list({ page, limit: PAGE_LIMIT, search: debouncedSearch || undefined, status: statusFilter || undefined, sortBy: sort.key, sortDir: sort.dir }),
    placeholderData: (prev) => prev,
  });

  const trips = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "trips", "all"] });

  const hideMutation = useMutation({ mutationFn: (id: string) => tripsApi.hide(id), onSuccess: () => { setConfirm({ action: null, trip: null }); invalidate(); } });
  const deleteMutation = useMutation({ mutationFn: (id: string) => tripsApi.delete(id), onSuccess: () => { setConfirm({ action: null, trip: null }); invalidate(); } });
  const featureMutation = useMutation({
    mutationFn: ({ id, featured }: { id: string; featured: boolean }) => tripsApi.feature(id, featured),
    onSuccess: () => invalidate(),
  });

  const handleSort = (key: string) => { setSort((s) => ({ key, dir: s.key === key && s.dir === "asc" ? "desc" : "asc" })); setPage(1); };

  const STATUS_TABS = ["", "pending", "approved", "rejected", "hidden", "draft"];

  const iconBtnStyle: React.CSSProperties = { padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', borderRadius: 2, display: 'flex', alignItems: 'center' };

  const columns: Column<Trip>[] = [
    {
      key: "route", header: "الرحلة / المسار",
      render: (trip) => (
        <div dir="rtl">
          <p style={{ fontWeight: 500, color: 'var(--ink)', fontSize: 13, maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {trip.title || `${trip.fromCity} → ${trip.toCity}`}
          </p>
          {trip.title && (
            <p style={{ fontSize: 11, color: 'var(--ink-4)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
              <MapPin style={{ width: 10, height: 10 }} />{trip.fromCity} → {trip.toCity}
            </p>
          )}
        </div>
      ),
    },
    { key: "author", header: "الكاتب", render: (trip) => <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{safeText(trip.author?.name)}</span> },
    { key: "status", header: "الحالة", render: (trip) => <StatusBadge status={trip.status} /> },
    { key: "createdAt", header: "تاريخ النشر", sortable: true, render: (trip) => <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{formatDate(trip.createdAt)}</span> },
    { key: "viewsCount", header: "المشاهدات", sortable: true, render: (trip) => <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{formatNumber(trip.viewsCount, '—')}</span> },
    {
      key: "actions", header: "", width: "140px",
      render: (trip) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
          <a href={`/trips/${trip.id}`} target="_blank" rel="noopener noreferrer" style={iconBtnStyle} title="عرض"><ExternalLink style={{ width: 15, height: 15 }} /></a>
          {trip.status !== "hidden"
            ? <button onClick={() => setConfirm({ action: "hide", trip })} style={iconBtnStyle} title="إخفاء"><EyeOff style={{ width: 15, height: 15 }} /></button>
            : <button onClick={() => setConfirm({ action: null, trip: null })} style={iconBtnStyle} title="إظهار"><Eye style={{ width: 15, height: 15 }} /></button>
          }
          <button
            onClick={() => featureMutation.mutate({ id: trip.id, featured: !(trip as any).isFeatured })}
            disabled={featureMutation.isPending}
            style={{ ...iconBtnStyle, color: (trip as any).isFeatured ? 'var(--forest)' : 'var(--ink-4)' }}
            title={(trip as any).isFeatured ? 'إلغاء التمييز' : 'تمييز'}
          >
            <Star style={{ width: 15, height: 15, fill: (trip as any).isFeatured ? 'currentColor' : 'none' }} />
          </button>
          <button onClick={() => setConfirm({ action: "delete", trip })} style={{ ...iconBtnStyle, color: 'var(--terra)' }} title="حذف"><Trash2 style={{ width: 15, height: 15 }} /></button>
        </div>
      ),
    },
  ];

  const confirmProps = (() => {
    if (!confirm.action || !confirm.trip) return null;
    if (confirm.action === "hide") return {
      title: "إخفاء الرحلة", message: `هل تريد إخفاء رحلة "${confirm.trip.fromCity} → ${confirm.trip.toCity}"؟`, confirmLabel: "إخفاء", variant: "warning" as const, isLoading: hideMutation.isPending, onConfirm: () => hideMutation.mutate(confirm.trip!.id),
    };
    return {
      title: "حذف الرحلة", message: "هل تريد حذف هذه الرحلة نهائياً؟ لا يمكن التراجع عن هذا الإجراء.", confirmLabel: "حذف", variant: "danger" as const, isLoading: deleteMutation.isPending, onConfirm: () => deleteMutation.mutate(confirm.trip!.id),
    };
  })();

  return (
    <>
      <AdminTopbar title="الرحلات" subtitle={`${formatNumber(total)} رحلة إجمالاً`} />
      <main className="admin-main" dir="rtl">
        {/* Status filter tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {STATUS_TABS.map((s) => {
            const active = statusFilter === s;
            return (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                style={{ padding: '5px 14px', borderRadius: 2, fontSize: 12, fontWeight: active ? 500 : 400, whiteSpace: 'nowrap', background: active ? 'var(--ink)' : 'transparent', color: active ? 'var(--cream)' : 'var(--ink-3)', border: active ? '1px solid var(--ink)' : '1px solid var(--line)', cursor: 'pointer' }}>
                {STATUS_LABELS[s]}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ position: 'relative', maxWidth: 320 }}>
            <Search style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--ink-4)' }} />
            <input type="text" placeholder="البحث في الرحلات…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} dir="rtl" className="form-input" style={{ paddingRight: 32 }} />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', display: 'flex' }}>
                <X style={{ width: 13, height: 13 }} />
              </button>
            )}
          </div>
        </div>

        <DataTable columns={columns} data={trips} isLoading={isLoading} sort={sort} onSort={handleSort} page={page} totalPages={totalPages} onPageChange={setPage} total={total} limit={PAGE_LIMIT} emptyMessage="لا توجد رحلات تطابق المعايير المحددة" />
      </main>

      {confirmProps && (
        <ConfirmModal isOpen onClose={() => setConfirm({ action: null, trip: null })} cancelLabel="إلغاء" {...confirmProps} />
      )}
    </>
  );
}
