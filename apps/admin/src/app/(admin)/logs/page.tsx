"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, X, Info, AlertTriangle, AlertCircle, Bug, ShieldCheck, Filter } from "lucide-react";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { logsApi } from "@/lib/api/admin.api";
import type { SystemLog, LogLevel } from "@/types/admin.types";
import { useDebounce } from "@/hooks/useDebounce";
import { formatDateTime, formatNumber, safeText } from "@/lib/format";

const PAGE_LIMIT = 20;

const formatDate = (iso: unknown) => formatDateTime(iso);

const LEVEL_CONFIG: Record<LogLevel, { label: string; bg: string; color: string; icon: React.ReactNode }> = {
  info:  { label: "معلومات", bg: 'rgba(107,142,156,.12)', color: 'var(--sky)',   icon: <Info style={{ width: 12, height: 12 }} /> },
  warn:  { label: "تحذير",   bg: 'rgba(217,119,6,.1)',   color: '#d97706',       icon: <AlertTriangle style={{ width: 12, height: 12 }} /> },
  error: { label: "خطأ",     bg: 'rgba(180,94,66,.1)',   color: 'var(--terra)',  icon: <AlertCircle style={{ width: 12, height: 12 }} /> },
  debug: { label: "تتبع",    bg: 'rgba(139,92,246,.1)',  color: '#7c3aed',       icon: <Bug style={{ width: 12, height: 12 }} /> },
};

function LevelBadge({ level }: { level: LogLevel }) {
  const c = LEVEL_CONFIG[level] ?? { label: level, bg: 'var(--sand)', color: 'var(--ink-3)', icon: null };
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', fontSize: 10, fontWeight: 500, background: c.bg, color: c.color, borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
      {c.icon}{c.label}
    </span>
  );
}

function LogDetailModal({ log, onClose }: { log: SystemLog; onClose: () => void }) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 500, background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 4, boxShadow: '0 20px 40px rgba(0,0,0,0.15)', maxHeight: '80vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <ShieldCheck style={{ width: 16, height: 16, color: 'var(--forest)' }} />
            <h3 style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>تفاصيل السجل</h3>
          </div>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', display: 'flex' }}>
            <X style={{ width: 18, height: 18 }} />
          </button>
        </div>
        <div style={{ overflowY: 'auto', flex: 1, padding: '16px 20px' }} dir="rtl">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px 24px', fontSize: 12 }}>
            <div><p style={{ fontSize: 10, color: 'var(--ink-4)', marginBottom: 4 }}>المستوى</p><LevelBadge level={log.level} /></div>
            <div><p style={{ fontSize: 10, color: 'var(--ink-4)', marginBottom: 4 }}>الوقت</p><p style={{ color: 'var(--ink-2)', fontSize: 11 }}>{formatDate(log.createdAt)}</p></div>
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{ fontSize: 10, color: 'var(--ink-4)', marginBottom: 4 }}>الإجراء</p>
              <p style={{ color: 'var(--ink)', fontFamily: 'monospace', fontSize: 11, background: 'var(--sand)', padding: '6px 10px', borderRadius: 2 }}>{log.action}</p>
            </div>
            {log.adminName && <div><p style={{ fontSize: 10, color: 'var(--ink-4)', marginBottom: 4 }}>المشرف</p><p style={{ color: 'var(--ink-2)' }}>{safeText(log.adminName)}</p></div>}
            <div style={{ gridColumn: '1 / -1' }}>
              <p style={{ fontSize: 10, color: 'var(--ink-4)', marginBottom: 4 }}>الرسالة</p>
              <p style={{ color: 'var(--ink-2)', fontSize: 13, lineHeight: 1.6 }}>{safeText(log.message)}</p>
            </div>
            {log.meta && Object.keys(log.meta).length > 0 && (
              <div style={{ gridColumn: '1 / -1' }}>
                <p style={{ fontSize: 10, color: 'var(--ink-4)', marginBottom: 4 }}>البيانات الإضافية</p>
                <pre style={{ fontSize: 11, color: 'var(--ink-2)', background: 'var(--sand)', border: '1px solid var(--line)', borderRadius: 2, padding: '10px 12px', overflowX: 'auto', fontFamily: 'monospace', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {JSON.stringify(log.meta, null, 2)}
                </pre>
              </div>
            )}
          </div>
        </div>
        <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={onClose} style={{ padding: '6px 14px', fontSize: 12, background: 'none', border: '1px solid var(--line)', borderRadius: 2, cursor: 'pointer', color: 'var(--ink-3)' }}>إغلاق</button>
        </div>
      </div>
    </div>
  );
}

const LEVEL_TABS = [
  { value: "", label: "الكل" }, { value: "info", label: "معلومات" },
  { value: "warn", label: "تحذير" }, { value: "error", label: "خطأ" }, { value: "debug", label: "تتبع" },
];

export default function LogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [levelFilter, setLevelFilter] = useState("");
  const [selectedLog, setSelectedLog] = useState<SystemLog | null>(null);
  const debouncedSearch = useDebounce(search, 400);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "logs", page, debouncedSearch, levelFilter],
    queryFn: () => logsApi.list({ page, limit: PAGE_LIMIT, search: debouncedSearch || undefined, level: levelFilter || undefined }),
    placeholderData: (prev) => prev,
    refetchInterval: 30_000,
  });

  const logs = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const iconBtnStyle: React.CSSProperties = { padding: 5, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', borderRadius: 2, display: 'flex', alignItems: 'center' };

  const columns: Column<SystemLog>[] = [
    { key: "level", header: "المستوى", width: "100px", render: (log) => <LevelBadge level={log.level} /> },
    { key: "adminName", header: "المشرف", render: (log) => <span style={{ fontSize: 12, color: 'var(--ink-2)' }}>{log.adminName ?? <span style={{ color: 'var(--ink-4)' }}>النظام</span>}</span> },
    { key: "action", header: "الإجراء", render: (log) => <span style={{ fontSize: 11, color: 'var(--ink)', fontFamily: 'monospace', background: 'var(--sand)', padding: '2px 6px', borderRadius: 2, whiteSpace: 'nowrap' }}>{safeText(log.action)}</span> },
    { key: "message", header: "الرسالة", render: (log) => <span style={{ fontSize: 12, color: 'var(--ink-2)', display: 'block', maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={safeText(log.message)}>{safeText(log.message)}</span> },
    { key: "createdAt", header: "التوقيت", sortable: true, render: (log) => <span style={{ fontSize: 11, color: 'var(--ink-4)', whiteSpace: 'nowrap', fontFamily: 'monospace' }}>{formatDate(log.createdAt)}</span> },
    {
      key: "details", header: "", width: "60px",
      render: (log) => log.meta && Object.keys(log.meta).length > 0 ? (
        <button onClick={(e) => { e.stopPropagation(); setSelectedLog(log); }} style={iconBtnStyle} title="عرض التفاصيل">
          <Filter style={{ width: 13, height: 13 }} />
        </button>
      ) : null,
    },
  ];

  return (
    <>
      <AdminTopbar title="سجلات النشاط" subtitle={`${formatNumber(total)} سجل`} />
      <main className="admin-main" dir="rtl">
        {isError && (
          <div style={{ background: 'rgba(180,94,66,0.08)', border: '1px solid rgba(180,94,66,0.3)', borderRadius: 3, padding: '10px 14px', fontSize: 13, color: 'var(--terra)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertCircle style={{ width: 14, height: 14, flexShrink: 0 }} /> حدث خطأ أثناء تحميل السجلات.
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'var(--sand)', border: '1px solid var(--line)', borderRadius: 3, padding: '8px 12px', marginBottom: 16, fontSize: 12, color: 'var(--ink-3)' }}>
          <ShieldCheck style={{ width: 14, height: 14, flexShrink: 0 }} />
          هذه السجلات للقراءة فقط. تُحدَّث تلقائياً كل 30 ثانية.
        </div>

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {LEVEL_TABS.map((tab) => {
              const active = levelFilter === tab.value;
              return (
                <button key={tab.value} onClick={() => { setLevelFilter(tab.value); setPage(1); }}
                  style={{ padding: '4px 12px', borderRadius: 2, fontSize: 12, fontWeight: active ? 500 : 400, background: active ? 'var(--ink)' : 'transparent', color: active ? 'var(--cream)' : 'var(--ink-3)', border: active ? '1px solid var(--ink)' : '1px solid var(--line)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
                  {tab.label}
                </button>
              );
            })}
          </div>
          <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300, marginInlineStart: 'auto' }}>
            <Search style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--ink-4)' }} />
            <input type="text" placeholder="البحث في السجلات…" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} dir="rtl" className="form-input" style={{ paddingRight: 32 }} />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', display: 'flex' }}>
                <X style={{ width: 13, height: 13 }} />
              </button>
            )}
          </div>
        </div>

        <DataTable columns={columns} data={logs} isLoading={isLoading} page={page} totalPages={totalPages} onPageChange={setPage} total={total} limit={PAGE_LIMIT} emptyMessage="لا توجد سجلات تطابق المعايير المحددة" onRowClick={(log) => setSelectedLog(log)} />
      </main>

      {selectedLog && <LogDetailModal log={selectedLog} onClose={() => setSelectedLog(null)} />}
    </>
  );
}
