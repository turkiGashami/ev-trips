"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Eye, EyeOff, Star, Trash2, Search, X, MapPin, ExternalLink } from "lucide-react";
import { useTranslations } from "next-intl";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { tripsApi } from "@/lib/api/admin.api";
import type { Trip, TripStatus } from "@/types/admin.types";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDate, formatNumber, safeText } from "@/lib/format";

const PAGE_LIMIT = 15;

// UI tone/colour per API status. Label comes from i18n.
const STATUS_TONE: Record<string, { bg: string; color: string }> = {
  "":              { bg: 'transparent',                    color: 'var(--ink-3)' },
  draft:           { bg: 'var(--sand)',                    color: 'var(--ink-3)' },
  pending:         { bg: 'rgba(217,119,6,.1)',             color: '#d97706' },
  pending_review:  { bg: 'rgba(217,119,6,.1)',             color: '#d97706' },
  approved:        { bg: 'rgba(45,74,62,.1)',              color: 'var(--forest)' },
  published:       { bg: 'rgba(45,74,62,.1)',              color: 'var(--forest)' },
  rejected:        { bg: 'rgba(180,94,66,.1)',             color: 'var(--terra)' },
  hidden:          { bg: 'var(--sand)',                    color: 'var(--ink-4)' },
  archived:        { bg: 'var(--sand)',                    color: 'var(--ink-4)' },
};

type ConfirmAction = "hide" | "delete" | null;
interface ConfirmState { action: ConfirmAction; trip: Trip | null; }

// Build the public trip URL from env or current host. Admin and web are
// deployed on different domains, so a relative href would 404 against the
// admin host.
function tripPublicUrl(trip: any): string {
  const slug =
    trip?.slug ??
    trip?.tripSlug ??
    trip?.id ??
    "";
  const envBase = process.env.NEXT_PUBLIC_WEB_URL || process.env.NEXT_PUBLIC_PUBLIC_SITE_URL;
  let base = envBase || "";
  if (!base && typeof window !== "undefined") {
    // Heuristic: replace "-admin-" with "-web-" in the cranl.net subdomain
    base = window.location.origin.replace("-admin-", "-web-");
  }
  return `${base.replace(/\/+$/, "")}/trips/${slug}`;
}

export default function TripsPage() {
  const t = useTranslations("trips");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");

  const statusLabel = (s: string): string => {
    if (!s) return t("tabs.all");
    // Map known statuses to status namespace, fallback to trips.tabs
    const map: Record<string, string> = {
      draft: "draft", pending: "pending", pending_review: "pending_review",
      approved: "published", published: "published", rejected: "rejected",
      hidden: "hidden", archived: "archived",
    };
    const key = map[s];
    if (key) return tStatus(key as any);
    return s;
  };

  const searchParams = useSearchParams();
  // Seed the search box from `?search=` so deep links from the Routes page
  // (and anywhere else) land with the filter already applied. Mount-only.
  const initialSearch = searchParams?.get("search") ?? "";

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState(initialSearch);
  const [statusFilter, setStatusFilter] = useState<string>("");
  const [confirm, setConfirm] = useState<ConfirmState>({ action: null, trip: null });
  const [sort, setSort] = useState({ key: "createdAt", dir: "desc" as "asc" | "desc" });

  // If user navigates between drill-down links without remount, sync state.
  useEffect(() => {
    const next = searchParams?.get("search") ?? "";
    if (next && next !== search) setSearch(next);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

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

  const STATUS_TABS = ["", "pending_review", "published", "rejected", "hidden", "draft"];

  function StatusBadge({ status }: { status: TripStatus | string }) {
    const tone = STATUS_TONE[status as string] ?? STATUS_TONE.draft;
    return (
      <span style={{ display: 'inline-flex', padding: '2px 8px', fontSize: 10, fontWeight: 500, background: tone.bg, color: tone.color, borderRadius: 2, letterSpacing: '0.02em' }}>
        {statusLabel(String(status))}
      </span>
    );
  }

  const pickAuthor = (tr: any): string =>
    tr?.author?.name ?? tr?.user?.full_name ?? tr?.user?.fullName ?? tr?.user?.username ?? tr?.user?.email ?? '';
  const pickDate = (tr: any): string | undefined =>
    tr?.createdAt ?? tr?.created_at ?? tr?.published_at ?? tr?.publishedAt ?? undefined;
  const pickViews = (tr: any): number | undefined =>
    tr?.viewsCount ?? tr?.view_count ?? tr?.views ?? undefined;
  const pickFrom = (tr: any): string =>
    tr?.fromCity ?? tr?.from_city?.name_ar ?? tr?.from_city?.name ?? tr?.departure_city?.name_ar ?? tr?.departure_city?.name ?? '';
  const pickTo = (tr: any): string =>
    tr?.toCity ?? tr?.to_city?.name_ar ?? tr?.to_city?.name ?? tr?.destination_city?.name_ar ?? tr?.destination_city?.name ?? '';

  const iconBtnStyle: React.CSSProperties = { padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', borderRadius: 2, display: 'flex', alignItems: 'center' };

  const columns: Column<Trip>[] = [
    {
      key: "route", header: t("columns.route"),
      render: (trip) => {
        const from = pickFrom(trip);
        const to = pickTo(trip);
        const hasTitle = !!trip.title && trip.title !== 'Untitled Trip';
        return (
          <div>
            <p style={{ fontWeight: 500, color: 'var(--ink)', fontSize: 13, maxWidth: 240, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {hasTitle ? trip.title : (from && to ? `${from} ← ${to}` : t("untitled"))}
            </p>
            {hasTitle && from && to && (
              <p style={{ fontSize: 11, color: 'var(--ink-4)', display: 'flex', alignItems: 'center', gap: 3, marginTop: 2 }}>
                <MapPin style={{ width: 10, height: 10 }} />{from} ← {to}
              </p>
            )}
          </div>
        );
      },
    },
    { key: "author", header: t("columns.author"), render: (trip) => <span style={{ fontSize: 13, color: 'var(--ink-2)' }}>{safeText(pickAuthor(trip))}</span> },
    { key: "status", header: t("columns.status"), render: (trip) => <StatusBadge status={trip.status} /> },
    { key: "createdAt", header: t("columns.publishedAt"), sortable: true, render: (trip) => <span style={{ fontSize: 12, color: 'var(--ink-3)' }} className="nums-latin">{pickDate(trip) ? formatDate(pickDate(trip)!) : '—'}</span> },
    { key: "viewsCount", header: t("columns.views"), sortable: true, render: (trip) => <span style={{ fontSize: 12, color: 'var(--ink-3)' }} className="nums-latin">{formatNumber(pickViews(trip), '—')}</span> },
    {
      key: "actions", header: "", width: "140px",
      render: (trip) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
          <a
            href={tripPublicUrl(trip)}
            target="_blank"
            rel="noopener noreferrer"
            style={iconBtnStyle}
            title={t("actions.view")}
          >
            <ExternalLink style={{ width: 15, height: 15 }} />
          </a>
          {trip.status !== "hidden"
            ? <button onClick={() => setConfirm({ action: "hide", trip })} style={iconBtnStyle} title={t("actions.hide")}><EyeOff style={{ width: 15, height: 15 }} /></button>
            : <button onClick={() => setConfirm({ action: null, trip: null })} style={iconBtnStyle} title={t("actions.show")}><Eye style={{ width: 15, height: 15 }} /></button>
          }
          <button
            onClick={() => featureMutation.mutate({ id: trip.id, featured: !(trip as any).isFeatured })}
            disabled={featureMutation.isPending}
            style={{ ...iconBtnStyle, color: (trip as any).isFeatured ? 'var(--forest)' : 'var(--ink-4)' }}
            title={(trip as any).isFeatured ? t("actions.unfeature") : t("actions.feature")}
          >
            <Star style={{ width: 15, height: 15, fill: (trip as any).isFeatured ? 'currentColor' : 'none' }} />
          </button>
          <button onClick={() => setConfirm({ action: "delete", trip })} style={{ ...iconBtnStyle, color: 'var(--terra)' }} title={t("actions.delete")}><Trash2 style={{ width: 15, height: 15 }} /></button>
        </div>
      ),
    },
  ];

  const confirmProps = (() => {
    if (!confirm.action || !confirm.trip) return null;
    if (confirm.action === "hide") return {
      title: t("confirm.hideTitle"),
      message: t("confirm.hideMessage", { from: confirm.trip.fromCity ?? "", to: confirm.trip.toCity ?? "" }),
      confirmLabel: t("confirm.hideConfirm"),
      variant: "warning" as const,
      isLoading: hideMutation.isPending,
      onConfirm: () => hideMutation.mutate(confirm.trip!.id),
    };
    return {
      title: t("confirm.deleteTitle"),
      message: t("confirm.deleteMessage"),
      confirmLabel: t("confirm.deleteConfirm"),
      variant: "danger" as const,
      isLoading: deleteMutation.isPending,
      onConfirm: () => deleteMutation.mutate(confirm.trip!.id),
    };
  })();

  return (
    <>
      <AdminTopbar title={t("title")} subtitle={t("count", { count: formatNumber(total) })} />
      <main className="admin-main">
        {/* Status filter tabs */}
        <div style={{ display: 'flex', gap: 4, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {STATUS_TABS.map((s) => {
            const active = statusFilter === s;
            return (
              <button key={s} onClick={() => { setStatusFilter(s); setPage(1); }}
                style={{ padding: '5px 14px', borderRadius: 2, fontSize: 12, fontWeight: active ? 500 : 400, whiteSpace: 'nowrap', background: active ? 'var(--ink)' : 'transparent', color: active ? 'var(--cream)' : 'var(--ink-3)', border: active ? '1px solid var(--ink)' : '1px solid var(--line)', cursor: 'pointer' }}>
                {statusLabel(s)}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div style={{ marginBottom: 16 }}>
          <div style={{ position: 'relative', maxWidth: 320 }}>
            <Search style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--ink-4)' }} />
            <input type="text" placeholder={t("searchPlaceholder")} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="form-input" style={{ paddingRight: 32 }} />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', display: 'flex' }}>
                <X style={{ width: 13, height: 13 }} />
              </button>
            )}
          </div>
        </div>

        <DataTable columns={columns} data={trips} isLoading={isLoading} sort={sort} onSort={handleSort} page={page} totalPages={totalPages} onPageChange={setPage} total={total} limit={PAGE_LIMIT} emptyMessage={t("empty")} />
      </main>

      {confirmProps && (
        <ConfirmModal isOpen onClose={() => setConfirm({ action: null, trip: null })} cancelLabel={tCommon("cancel")} {...confirmProps} />
      )}
    </>
  );
}
