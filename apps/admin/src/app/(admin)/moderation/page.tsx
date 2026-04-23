"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CheckCircle, XCircle, Battery, MapPin, User, Clock, ChevronLeft, ChevronRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { AdminButton } from "@/components/ui/AdminButton";
import { tripsApi } from "@/lib/api/admin.api";
import type { Trip } from "@/types/admin.types";
import { formatDateTime, formatNumber, safeText } from "@/lib/format";

const PAGE_LIMIT = 10;

function RejectModal({ trip, onClose, onConfirm, isLoading }: { trip: Trip; onClose: () => void; onConfirm: (reason: string) => void; isLoading: boolean }) {
  const t = useTranslations("moderation");
  const tCommon = useTranslations("common");
  const [reason, setReason] = useState("");
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 440, background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 4, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(180,94,66,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <XCircle style={{ width: 18, height: 18, color: 'var(--terra)' }} />
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{t("rejectModal.title")}</h3>
            <p style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{trip.fromCity} ← {trip.toCity}</p>
          </div>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <label className="form-label">{t("rejectModal.reasonLabel")}</label>
          <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("rejectModal.reasonPlaceholder")} rows={4} className="form-textarea" />
          <p style={{ marginTop: 6, fontSize: 11, color: 'var(--ink-4)' }}>{t("rejectModal.hint")}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: '1px solid var(--line)' }}>
          <AdminButton variant="ghost" onClick={onClose} disabled={isLoading}>{tCommon("cancel")}</AdminButton>
          <AdminButton variant="danger" onClick={() => onConfirm(reason)} isLoading={isLoading} disabled={!reason.trim()}>{t("rejectModal.confirm")}</AdminButton>
        </div>
      </div>
    </div>
  );
}

function ApproveModal({ trip, onClose, onConfirm, isLoading }: { trip: Trip; onClose: () => void; onConfirm: () => void; isLoading: boolean }) {
  const t = useTranslations("moderation");
  const tCommon = useTranslations("common");
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 440, background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 4, boxShadow: '0 20px 40px rgba(0,0,0,0.15)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
          <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'rgba(45,74,62,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <CheckCircle style={{ width: 18, height: 18, color: 'var(--forest)' }} />
          </div>
          <div>
            <h3 style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{t("approveModal.title")}</h3>
            <p style={{ fontSize: 11, color: 'var(--ink-3)', marginTop: 2 }}>{trip.fromCity} ← {trip.toCity}</p>
          </div>
        </div>
        <div style={{ padding: '16px 20px' }}>
          <p style={{ fontSize: 13, color: 'var(--ink-2)' }}>{t("approveModal.message")}</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: '1px solid var(--line)' }}>
          <AdminButton variant="ghost" onClick={onClose} disabled={isLoading}>{tCommon("cancel")}</AdminButton>
          <AdminButton variant="primary" onClick={onConfirm} isLoading={isLoading}>{t("approveModal.confirm")}</AdminButton>
        </div>
      </div>
    </div>
  );
}

function TripCard({ trip, onApprove, onReject }: { trip: Trip; onApprove: (t: Trip) => void; onReject: (t: Trip) => void }) {
  const t = useTranslations("moderation");
  const hasBatteryDelta = typeof trip.endBatteryPercent === 'number' && typeof trip.startBatteryPercent === 'number';
  const batteryDelta = hasBatteryDelta ? (trip.endBatteryPercent as number) - (trip.startBatteryPercent as number) : 0;
  return (
    <div className="card" style={{ padding: 20 }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontWeight: 500, fontSize: 14, color: 'var(--ink)' }}>
            <MapPin style={{ width: 14, height: 14, color: 'var(--forest)', flexShrink: 0 }} />
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.fromCity}</span>
            <span style={{ color: 'var(--ink-4)', flexShrink: 0 }}>←</span>
            <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{trip.toCity}</span>
          </div>
          {trip.title && <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>{trip.title}</p>}
        </div>
        <span style={{ flexShrink: 0, padding: '2px 8px', fontSize: 10, fontWeight: 500, background: 'rgba(217,119,6,0.1)', color: '#d97706', borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{t("pendingBadge")}</span>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', marginBottom: 12, fontSize: 12, color: 'var(--ink-3)' }}>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><User style={{ width: 12, height: 12 }} />{safeText(trip.author?.name)}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock style={{ width: 12, height: 12 }} />{formatDateTime(trip.createdAt)}</span>
        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin style={{ width: 12, height: 12 }} />{formatNumber(trip.distanceKm)} {t("km")}</span>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 14, padding: '10px 12px', background: 'var(--sand)', border: '1px solid var(--line)', borderRadius: 3 }}>
        <Battery style={{ width: 14, height: 14, color: 'var(--forest)', flexShrink: 0 }} />
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2px 14px', fontSize: 12 }}>
          <span style={{ color: 'var(--ink-3)' }}>{t("batteryStart")} <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>{formatNumber(trip.startBatteryPercent)}%</strong></span>
          <span style={{ color: 'var(--ink-3)' }}>{t("batteryEnd")} <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>{formatNumber(trip.endBatteryPercent)}%</strong></span>
          {hasBatteryDelta && (
            <span style={{ fontWeight: 500, color: batteryDelta < 0 ? 'var(--terra)' : 'var(--forest)' }}>
              ({batteryDelta > 0 ? "+" : ""}{batteryDelta}%)
            </span>
          )}
          {(trip.chargingStops?.length ?? 0) > 0 && (
            <span style={{ color: 'var(--ink-3)' }}>{t("stations")} <strong style={{ color: 'var(--ink)', fontWeight: 500 }}>{formatNumber(trip.chargingStops?.length)}</strong></span>
          )}
        </div>
      </div>

      {trip.vehicle && (
        <p style={{ fontSize: 11, color: 'var(--ink-4)', marginBottom: 14 }}>
          {t("vehicle")} {safeText(trip.vehicle?.brand?.name, '')} {safeText(trip.vehicle?.model?.name, '')} {safeText(trip.vehicle?.model?.year, '')}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'flex-end' }}>
        <AdminButton variant="danger" size="sm" leftIcon={<XCircle style={{ width: 14, height: 14 }} />} onClick={() => onReject(trip)}>{t("reject")}</AdminButton>
        <AdminButton variant="primary" size="sm" leftIcon={<CheckCircle style={{ width: 14, height: 14 }} />} onClick={() => onApprove(trip)}>{t("approve")}</AdminButton>
      </div>
    </div>
  );
}

type ActiveModal = { type: "approve"; trip: Trip } | { type: "reject"; trip: Trip } | null;

export default function ModerationPage() {
  const t = useTranslations("moderation");
  const [page, setPage] = useState(1);
  const [activeModal, setActiveModal] = useState<ActiveModal>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "trips", "pending", page],
    queryFn: () => tripsApi.list({ status: "pending", page, limit: PAGE_LIMIT }),
    placeholderData: (prev) => prev,
  });

  const trips = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "trips", "pending"] });

  const approveMutation = useMutation({ mutationFn: (id: string) => tripsApi.approve(id), onSuccess: () => { setActiveModal(null); invalidate(); } });
  const rejectMutation = useMutation({ mutationFn: ({ id, reason }: { id: string; reason: string }) => tripsApi.reject(id, reason), onSuccess: () => { setActiveModal(null); invalidate(); } });

  return (
    <>
      <AdminTopbar title={t("title")} subtitle={t("count", { count: formatNumber(total) })} />
      <main className="admin-main">
        {isError && (
          <div style={{ background: 'rgba(180,94,66,0.08)', border: '1px solid rgba(180,94,66,0.3)', borderRadius: 3, padding: '10px 14px', fontSize: 13, color: 'var(--terra)', marginBottom: 16 }}>
            {t("loadError")}
          </div>
        )}

        {isLoading && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="card" style={{ padding: 20 }}>
                <div className="skeleton" style={{ height: 18, width: '75%', marginBottom: 10 }} />
                <div className="skeleton" style={{ height: 14, width: '50%', marginBottom: 12 }} />
                <div className="skeleton" style={{ height: 52, marginBottom: 12 }} />
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                  <div className="skeleton" style={{ height: 28, width: 60 }} />
                  <div className="skeleton" style={{ height: 28, width: 60 }} />
                </div>
              </div>
            ))}
          </div>
        )}

        {!isLoading && trips.length === 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '80px 0', color: 'var(--ink-4)' }}>
            <CheckCircle style={{ width: 48, height: 48, marginBottom: 12, color: 'var(--forest)', opacity: 0.4 }} />
            <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--ink-2)', marginBottom: 4 }}>{t("emptyTitle")}</p>
            <p style={{ fontSize: 13 }}>{t("emptySubtitle")}</p>
          </div>
        )}

        {!isLoading && trips.length > 0 && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(280px,1fr))', gap: 16 }}>
              {trips.map((trip) => (
                <TripCard key={trip.id} trip={trip}
                  onApprove={(tr) => setActiveModal({ type: "approve", trip: tr })}
                  onReject={(tr) => setActiveModal({ type: "reject", trip: tr })}
                />
              ))}
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 20, padding: '0 4px' }}>
                <p style={{ fontSize: 11, color: 'var(--ink-4)' }}>{t("pageOf", { page, total: totalPages, count: formatNumber(total) })}</p>
                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} style={{ padding: 6, background: 'none', border: 'none', cursor: page <= 1 ? 'not-allowed' : 'pointer', opacity: page <= 1 ? 0.4 : 1, color: 'var(--ink-3)', display: 'flex' }}>
                    <ChevronRight style={{ width: 16, height: 16 }} />
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => i + 1).map((p) => (
                    <button key={p} onClick={() => setPage(p)} style={{ width: 28, height: 28, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, background: p === page ? 'var(--ink)' : 'transparent', color: p === page ? 'var(--cream)' : 'var(--ink-3)', border: p === page ? '1px solid var(--ink)' : '1px solid transparent', borderRadius: 2, cursor: 'pointer' }}>
                      {p}
                    </button>
                  ))}
                  <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} style={{ padding: 6, background: 'none', border: 'none', cursor: page >= totalPages ? 'not-allowed' : 'pointer', opacity: page >= totalPages ? 0.4 : 1, color: 'var(--ink-3)', display: 'flex' }}>
                    <ChevronLeft style={{ width: 16, height: 16 }} />
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {activeModal?.type === "approve" && (
        <ApproveModal trip={activeModal.trip} onClose={() => setActiveModal(null)} onConfirm={() => approveMutation.mutate(activeModal.trip.id)} isLoading={approveMutation.isPending} />
      )}
      {activeModal?.type === "reject" && (
        <RejectModal trip={activeModal.trip} onClose={() => setActiveModal(null)} onConfirm={(reason) => rejectMutation.mutate({ id: activeModal.trip.id, reason })} isLoading={rejectMutation.isPending} />
      )}
    </>
  );
}
