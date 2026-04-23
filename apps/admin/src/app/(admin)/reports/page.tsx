"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { reportsApi } from "@/lib/api/admin.api";
import type { Report, ReportStatus, ReportType, ReportReason } from "@/types/admin.types";
import { formatDateTime, formatNumber, safeText } from "@/lib/format";

const PAGE_LIMIT = 15;

const STATUS_STYLE: Record<ReportStatus, { bg: string; color: string }> = {
  open:      { bg: 'rgba(217,119,6,.1)',  color: '#d97706' },
  resolved:  { bg: 'rgba(45,74,62,.1)',   color: 'var(--forest)' },
  dismissed: { bg: 'var(--sand)',          color: 'var(--ink-4)' },
};

const TYPE_STYLE: Record<ReportType, { bg: string; color: string }> = {
  trip:    { bg: 'rgba(107,142,156,.12)', color: 'var(--sky)' },
  comment: { bg: 'rgba(139,92,246,.1)',   color: '#7c3aed' },
  user:    { bg: 'rgba(180,94,66,.1)',    color: 'var(--terra)' },
};

type ActionType = "resolve" | "dismiss" | null;
interface ActionState { type: ActionType; report: Report | null; }

export default function ReportsPage() {
  const t = useTranslations("reports");
  const tCommon = useTranslations("common");

  function StatusBadge({ status }: { status: ReportStatus }) {
    const s = STATUS_STYLE[status];
    return <span style={{ display: 'inline-flex', padding: '2px 8px', fontSize: 10, fontWeight: 500, background: s.bg, color: s.color, borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t(`statusLabel.${status}` as any)}</span>;
  }

  function TypeBadge({ type }: { type: ReportType }) {
    const s = TYPE_STYLE[type];
    return <span style={{ display: 'inline-flex', padding: '2px 8px', fontSize: 10, fontWeight: 500, background: s.bg, color: s.color, borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{t(`type.${type}` as any)}</span>;
  }

  const reasonLabel = (r: ReportReason): string => {
    const known = ['spam', 'inappropriate', 'misleading', 'harassment', 'other'];
    if (known.includes(r as string)) return t(`reason.${r}` as any);
    return r as string;
  };

  const STATUS_FILTER_TABS = [
    { value: "", label: t("tabs.all") },
    { value: "open", label: t("tabs.open") },
    { value: "resolved", label: t("tabs.resolved") },
    { value: "dismissed", label: t("tabs.dismissed") },
  ];

  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("");
  const [action, setAction] = useState<ActionState>({ type: null, report: null });
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "reports", page, statusFilter],
    queryFn: () => reportsApi.list({ page, limit: PAGE_LIMIT, status: statusFilter || undefined }),
    placeholderData: (prev) => prev,
  });

  const reports = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "reports"] });

  const resolveMutation = useMutation({ mutationFn: (id: string) => reportsApi.resolve(id), onSuccess: () => { setAction({ type: null, report: null }); invalidate(); } });
  const dismissMutation = useMutation({ mutationFn: (id: string) => reportsApi.dismiss(id), onSuccess: () => { setAction({ type: null, report: null }); invalidate(); } });

  const iconBtnStyle: React.CSSProperties = { padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', borderRadius: 2, display: 'flex', alignItems: 'center' };

  const columns: Column<Report>[] = [
    { key: "reporter", header: t("columns.reporter"), render: (r) => <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink-2)' }}>{safeText(r.reporter?.name)}</span> },
    { key: "type", header: t("columns.type"), render: (r) => <TypeBadge type={r.type} /> },
    { key: "reason", header: t("columns.reason"), render: (r) => <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{reasonLabel(r.reason)}</span> },
    { key: "details", header: t("columns.details"), render: (r) => <span style={{ fontSize: 11, color: 'var(--ink-4)', maxWidth: 200, display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={safeText(r.details, '')}>{safeText(r.details)}</span> },
    { key: "status", header: t("columns.status"), render: (r) => <StatusBadge status={r.status} /> },
    { key: "createdAt", header: t("columns.createdAt"), sortable: true, render: (r) => <span style={{ fontSize: 12, color: 'var(--ink-3)', whiteSpace: 'nowrap' }}>{formatDateTime(r.createdAt)}</span> },
    {
      key: "actions", header: "", width: "100px",
      render: (r) => {
        if (r.status !== "open") return null;
        return (
          <div style={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
            <button onClick={() => setAction({ type: "resolve", report: r })} style={{ ...iconBtnStyle, color: 'var(--forest)' }} title={t("actions.resolve")}><CheckCircle style={{ width: 15, height: 15 }} /></button>
            <button onClick={() => setAction({ type: "dismiss", report: r })} style={iconBtnStyle} title={t("actions.dismiss")}><XCircle style={{ width: 15, height: 15 }} /></button>
          </div>
        );
      },
    },
  ];

  const confirmConfig = (() => {
    if (!action.type || !action.report) return null;
    if (action.type === "resolve") return {
      title: t("confirm.resolveTitle"), message: t("confirm.resolveMessage"), confirmLabel: t("actions.resolve"), cancelLabel: tCommon("cancel"), variant: "primary" as const, isLoading: resolveMutation.isPending, onConfirm: () => resolveMutation.mutate(action.report!.id),
    };
    return {
      title: t("confirm.dismissTitle"), message: t("confirm.dismissMessage"), confirmLabel: t("actions.dismiss"), cancelLabel: tCommon("cancel"), variant: "warning" as const, isLoading: dismissMutation.isPending, onConfirm: () => dismissMutation.mutate(action.report!.id),
    };
  })();

  return (
    <>
      <AdminTopbar title={t("title")} subtitle={t("count", { count: formatNumber(total) })} />
      <main className="admin-main">
        {isError && (
          <div style={{ background: 'rgba(180,94,66,0.08)', border: '1px solid rgba(180,94,66,0.3)', borderRadius: 3, padding: '10px 14px', fontSize: 13, color: 'var(--terra)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} /> {t("loadError")}
          </div>
        )}

        <div style={{ display: 'flex', gap: 4, marginBottom: 16, overflowX: 'auto', paddingBottom: 4 }}>
          {STATUS_FILTER_TABS.map((tab) => {
            const active = statusFilter === tab.value;
            return (
              <button key={tab.value} onClick={() => { setStatusFilter(tab.value); setPage(1); }}
                style={{ padding: '5px 14px', borderRadius: 2, fontSize: 12, fontWeight: active ? 500 : 400, whiteSpace: 'nowrap', background: active ? 'var(--ink)' : 'transparent', color: active ? 'var(--cream)' : 'var(--ink-3)', border: active ? '1px solid var(--ink)' : '1px solid var(--line)', cursor: 'pointer' }}>
                {tab.label}
              </button>
            );
          })}
        </div>

        <DataTable columns={columns} data={reports} isLoading={isLoading} page={page} totalPages={totalPages} onPageChange={setPage} total={total} limit={PAGE_LIMIT} emptyMessage={t("empty")} />
      </main>

      {confirmConfig && (
        <ConfirmModal isOpen onClose={() => setAction({ type: null, report: null })} {...confirmConfig} />
      )}
    </>
  );
}
