"use client";

import { useState, useEffect, useCallback } from "react";
import { Search, X } from "lucide-react";
import { useTranslations } from "next-intl";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { UserRow } from "@/components/users/UserRow";
import { usersApi } from "@/lib/api/admin.api";
import type { PlatformUser } from "@/types/admin.types";
import { AdminButton } from "@/components/ui/AdminButton";
import { useDebounce } from "@/hooks/useDebounce";
import { formatNumber } from "@/lib/format";

const BADGES = ["Early Adopter", "Top Contributor", "Road Master", "EV Pioneer", "Community Star"];

interface ActionModal {
  type: "suspend" | "ban" | "verify" | "activate" | "badge" | null;
  user: PlatformUser | null;
}

export default function UsersPage() {
  const t = useTranslations("users");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const tRoles = useTranslations("roles");
  const tDashboard = useTranslations("dashboard");

  const STATUS_OPTIONS = [
    { value: "", label: tCommon("allStatuses") },
    { value: "active", label: tStatus("active") },
    { value: "suspended", label: tStatus("suspended") },
    { value: "banned", label: tStatus("banned") },
    { value: "pending", label: tStatus("pending") },
  ];

  const ROLE_OPTIONS = [
    { value: "", label: t("allRoles") },
    { value: "super_admin", label: tRoles("super_admin") },
    { value: "admin", label: tRoles("admin") },
    { value: "moderator", label: tRoles("moderator") },
    { value: "user", label: tRoles("user") },
    { value: "verified", label: tRoles("verified") },
    { value: "premium", label: tRoles("premium") },
  ];

  const [users, setUsers] = useState<PlatformUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [sortKey, setSortKey] = useState("joinedAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");
  const [modal, setModal] = useState<ActionModal>({ type: null, user: null });
  const [reason, setReason] = useState("");
  const [selectedBadge, setSelectedBadge] = useState(BADGES[0]);
  const [actionLoading, setActionLoading] = useState(false);

  const debouncedSearch = useDebounce(search, 400);

  const load = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res: any = await usersApi.list({ page, limit: 15, search: debouncedSearch || undefined, status: statusFilter || undefined, role: roleFilter || undefined, sortBy: sortKey, sortDir });
      const items = Array.isArray(res?.data) ? res.data : Array.isArray(res?.data?.data) ? res.data.data : [];
      const meta = res?.meta ?? res?.data?.meta ?? {};
      const totalVal = meta.total ?? res?.total ?? items.length;
      const totalPagesVal = meta.totalPages ?? res?.totalPages ?? 1;
      setUsers(items);
      setTotal(totalVal);
      setTotalPages(totalPagesVal);
    } catch (err: any) {
      setUsers([]);
      setTotal(0);
      setTotalPages(1);
      setError(err?.response?.data?.message || err?.message || t("loadError"));
    } finally {
      setIsLoading(false);
    }
  }, [page, debouncedSearch, statusFilter, roleFilter, sortKey, sortDir, t]);

  useEffect(() => { load(); }, [load]);
  useEffect(() => { setPage(1); }, [debouncedSearch, statusFilter, roleFilter]);

  const handleSort = (key: string) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  };

  const closeModal = () => { setModal({ type: null, user: null }); setReason(""); };

  const handleAction = async () => {
    if (!modal.user || !modal.type) return;
    setActionLoading(true);
    try {
      if (modal.type === "suspend") await usersApi.suspend(modal.user.id, reason);
      else if (modal.type === "ban") await usersApi.ban(modal.user.id, reason);
      else if (modal.type === "verify") await usersApi.verify(modal.user.id);
      else if (modal.type === "activate") await usersApi.activate(modal.user.id);
      else if (modal.type === "badge") await usersApi.assignBadge(modal.user.id, selectedBadge);
      closeModal();
      load();
    } catch { /* handled */ } finally { setActionLoading(false); }
  };

  const COLUMNS = [
    { key: "name", label: t("columns.user") },
    { key: "email", label: t("columns.email") },
    { key: "role", label: t("columns.role") },
    { key: "status", label: t("columns.status") },
    { key: "joinedAt", label: t("columns.joined") },
    { key: "tripsCount", label: t("columns.trips") },
    { key: "actions", label: "" },
  ];

  return (
    <>
      <AdminTopbar title={t("title")} subtitle={t("count", { count: formatNumber(total) })} />
      <main className="admin-main">
        {/* Filters */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 300 }}>
            <Search style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--ink-4)' }} />
            <input type="text" placeholder={t("searchPlaceholder")} value={search} onChange={(e) => setSearch(e.target.value)} className="form-input" style={{ paddingRight: 32 }} />
            {search && (
              <button onClick={() => setSearch("")} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', display: 'flex' }}>
                <X style={{ width: 13, height: 13 }} />
              </button>
            )}
          </div>
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="form-select" style={{ width: 'auto' }}>
            {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)} className="form-select" style={{ width: 'auto' }}>
            {ROLE_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {error && !isLoading && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(180,94,66,.08)', border: '1px solid var(--terra)', borderRadius: 2, color: 'var(--terra)', fontSize: 13 }}>
            <strong>{tDashboard("error")}:</strong> {error}
            <button onClick={() => load()} style={{ marginInlineStart: 12, padding: '2px 10px', background: 'var(--terra)', color: 'var(--cream)', border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 12 }}>{tCommon("retry")}</button>
          </div>
        )}

        {/* Table */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  {COLUMNS.map((col) => (
                    <th key={col.key} onClick={() => col.key !== "actions" && handleSort(col.key)} style={{ cursor: col.key !== "actions" ? 'pointer' : 'default', userSelect: 'none' }}>
                      {col.label}
                      {sortKey === col.key && <span style={{ marginInlineStart: 4, color: 'var(--forest)' }}>{sortDir === "asc" ? "↑" : "↓"}</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 8 }).map((_, i) => (
                      <tr key={i}>
                        {COLUMNS.map((_, j) => <td key={j}><div className="skeleton" style={{ height: 14 }} /></td>)}
                      </tr>
                    ))
                  : users.length === 0
                  ? <tr><td colSpan={7} style={{ textAlign: 'center', padding: '48px 16px', color: 'var(--ink-4)' }}>{t("empty")}</td></tr>
                  : users.map((user) => (
                      <UserRow key={user.id} user={user}
                        onSuspend={(u) => setModal({ type: "suspend", user: u })}
                        onBan={(u) => setModal({ type: "ban", user: u })}
                        onVerify={(u) => setModal({ type: "verify", user: u })}
                        onActivate={(u) => setModal({ type: "activate", user: u })}
                        onAssignBadge={(u) => setModal({ type: "badge", user: u })}
                      />
                    ))
                }
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', borderTop: '1px solid var(--line)' }}>
              <p style={{ fontSize: 11, color: 'var(--ink-4)' }}>
                {t("pagination.pageOf", { page, total: totalPages })} {t("pagination.countTotal", { count: formatNumber(total) })}
              </p>
              <div style={{ display: 'flex', gap: 4 }}>
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: '4px 10px', fontSize: 12, background: 'none', border: '1px solid var(--line)', borderRadius: 2, cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1, color: 'var(--ink-3)' }}>{tCommon("previous")}</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ padding: '4px 10px', fontSize: 12, background: 'none', border: '1px solid var(--line)', borderRadius: 2, cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1, color: 'var(--ink-3)' }}>{tCommon("next")}</button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Action Modal */}
      {modal.type && modal.user && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={closeModal} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 440, margin: '0 16px', background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 4, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
              <h3 style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>
                {modal.type === "badge" ? t("modal.badge") : modal.type === "suspend" ? t("modal.suspend") : modal.type === "ban" ? t("modal.ban") : modal.type === "verify" ? t("modal.verify") : t("modal.activate")}
              </h3>
              <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>{(modal.user as any).name ?? (modal.user as any).full_name ?? (modal.user as any).username ?? (modal.user as any).email ?? '—'}</p>
            </div>
            <div style={{ padding: '16px 20px' }}>
              {(modal.type === "suspend" || modal.type === "ban") && (
                <div>
                  <label className="form-label">{t("modal.reasonLabel")}</label>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("modal.reasonPlaceholder")} rows={3} className="form-textarea" />
                </div>
              )}
              {modal.type === "badge" && (
                <div>
                  <label className="form-label">{t("modal.badgeLabel")}</label>
                  <select value={selectedBadge} onChange={(e) => setSelectedBadge(e.target.value)} className="form-select">{BADGES.map(b => <option key={b} value={b}>{b}</option>)}</select>
                </div>
              )}
              {(modal.type === "verify" || modal.type === "activate") && (
                <p style={{ fontSize: 13, color: 'var(--ink-2)' }}>{t("modal.confirmGeneric")}</p>
              )}
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: '1px solid var(--line)' }}>
              <AdminButton variant="ghost" onClick={closeModal}>{tCommon("cancel")}</AdminButton>
              <AdminButton
                variant={modal.type === "ban" ? "danger" : "primary"}
                onClick={handleAction}
                isLoading={actionLoading}
                disabled={actionLoading || ((modal.type === "suspend" || modal.type === "ban") && !reason.trim())}
              >
                {tCommon("confirm")}
              </AdminButton>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
