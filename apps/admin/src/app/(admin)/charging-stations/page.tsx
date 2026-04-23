"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus, Pencil, Trash2, Search, X, Zap, MapPin, CheckCircle, XCircle, AlertTriangle } from "lucide-react";
import { useTranslations } from "next-intl";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { AdminButton } from "@/components/ui/AdminButton";
import { ConfirmModal } from "@/components/ui/ConfirmModal";
import { DataTable, type Column } from "@/components/ui/DataTable";
import { stationsApi } from "@/lib/api/admin.api";
import type { ChargingStation } from "@/types/admin.types";
import { useDebounce } from "@/hooks/useDebounce";
import { formatNumber, safeText } from "@/lib/format";

const PAGE_LIMIT = 15;

const CONNECTOR_LABELS: Record<string, string> = { ccs: "CCS", chademo: "CHAdeMO", type2: "Type 2", type1: "Type 1", gb_t: "GB/T", tesla: "Tesla" };
const CONNECTOR_OPTIONS = ["ccs", "chademo", "type2", "type1", "gb_t", "tesla"];

function ConnectorBadge({ type }: { type: string }) {
  return <span style={{ display: 'inline-flex', alignItems: 'center', padding: '1px 6px', fontSize: 10, fontWeight: 500, background: 'rgba(107,142,156,.12)', color: 'var(--sky)', borderRadius: 2 }}>{CONNECTOR_LABELS[type] ?? type.toUpperCase()}</span>;
}

interface StationFormData {
  name: string; nameAr: string; city: string; address: string; lat: string; lng: string;
  maxPowerKw: string; totalSlots: string; availableSlots: string; connectorTypes: string[];
  openHours: string; phone: string; website: string; isVerified: boolean; isActive: boolean;
}

const EMPTY_FORM: StationFormData = { name: "", nameAr: "", city: "", address: "", lat: "", lng: "", maxPowerKw: "", totalSlots: "", availableSlots: "", connectorTypes: [], openHours: "", phone: "", website: "", isVerified: false, isActive: true };

// Extract a city name from either a string or an object {name/name_ar/ar/en}.
// Prevents the notorious "[object Object]" rendering in inputs and cells.
function cityToText(value: unknown): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'object') {
    const v = value as any;
    return v.name_ar ?? v.nameAr ?? v.name ?? v.ar ?? v.en ?? '';
  }
  return '';
}

// Parse lat/lng from a Google Maps share URL. Supports:
//  • https://www.google.com/maps/@24.71,46.67,15z
//  • https://maps.google.com/?q=24.71,46.67
//  • https://www.google.com/maps/place/.../@24.71,46.67,15z
//  • https://www.google.com/maps/dir/.../!3d24.71!4d46.67
function parseGoogleMapsUrl(url: string): { lat: string; lng: string } | null {
  const patterns = [
    /@(-?\d+\.\d+),(-?\d+\.\d+)/,
    /[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/,
    /!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)/,
    /[?&]ll=(-?\d+\.\d+),(-?\d+\.\d+)/,
  ];
  for (const re of patterns) {
    const m = url.match(re);
    if (m) return { lat: m[1], lng: m[2] };
  }
  return null;
}

function StationFormModal({ station, onClose, onSaved }: { station?: ChargingStation | null; onClose: () => void; onSaved: () => void }) {
  const t = useTranslations("stations");
  const tCommon = useTranslations("common");
  const [form, setForm] = useState<StationFormData>(station ? {
    name: station.name, nameAr: station.nameAr ?? "", city: cityToText(station.city), address: station.address,
    lat: String(station.lat), lng: String(station.lng), maxPowerKw: String(station.maxPowerKw),
    totalSlots: String(station.totalSlots), availableSlots: String(station.availableSlots),
    connectorTypes: station.connectorTypes ?? [], openHours: station.openHours ?? "",
    phone: station.phone ?? "", website: station.website ?? "", isVerified: station.isVerified, isActive: station.isActive,
  } : EMPTY_FORM);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [mapsUrl, setMapsUrl] = useState("");
  const [mapsParsed, setMapsParsed] = useState<null | 'ok' | 'fail'>(null);

  const applyMapsUrl = (value: string) => {
    setMapsUrl(value);
    if (!value.trim()) { setMapsParsed(null); return; }
    const coords = parseGoogleMapsUrl(value.trim());
    if (coords) {
      setForm((f) => ({ ...f, lat: coords.lat, lng: coords.lng }));
      setMapsParsed('ok');
    } else {
      setMapsParsed('fail');
    }
  };

  const toggleConnector = (c: string) => setForm((f) => ({ ...f, connectorTypes: f.connectorTypes.includes(c) ? f.connectorTypes.filter((x) => x !== c) : [...f.connectorTypes, c] }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const payload = { ...form, cityId: form.city.toLowerCase().replace(/\s+/g, "-"), lat: parseFloat(form.lat) || 0, lng: parseFloat(form.lng) || 0, maxPowerKw: parseFloat(form.maxPowerKw) || 0, totalSlots: parseInt(form.totalSlots) || 0, availableSlots: parseInt(form.availableSlots) || 0 };
      if (station) await stationsApi.update(station.id, payload);
      else await stationsApi.create(payload);
      onSaved();
    } catch { /* handle */ } finally { setIsSubmitting(false); }
  };

  const field = (label: string, node: React.ReactNode) => (
    <div><label className="form-label">{label}</label>{node}</div>
  );

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={onClose} />
      <div style={{ position: 'relative', width: '100%', maxWidth: 640, background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 4, boxShadow: '0 20px 40px rgba(0,0,0,0.15)', maxHeight: '90vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px 20px', borderBottom: '1px solid var(--line)' }}>
          <h3 style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)' }}>{station ? t("editStationTitle") : t("addStationTitle")}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-3)', display: 'flex' }}><X style={{ width: 18, height: 18 }} /></button>
        </div>

        <form onSubmit={handleSubmit} id="station-form" style={{ overflowY: 'auto', flex: 1 }}>
          <div style={{ padding: '16px 20px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            {field(t("form.nameEn"), <input type="text" required placeholder={t("form.nameEnPlaceholder")} value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="form-input" dir="ltr" />)}
            {field(t("form.nameAr"), <input type="text" placeholder={t("form.nameArPlaceholder")} value={form.nameAr} onChange={(e) => setForm((f) => ({ ...f, nameAr: e.target.value }))} className="form-input" />)}
            {field(t("form.city"), <input type="text" required placeholder={t("form.cityPlaceholder")} value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} className="form-input" />)}
            {field(t("form.address"), <input type="text" placeholder={t("form.addressPlaceholder")} value={form.address} onChange={(e) => setForm((f) => ({ ...f, address: e.target.value }))} className="form-input" />)}
            <div style={{ gridColumn: '1 / -1' }}>
              {field(
                t("form.mapsUrl"),
                <>
                  <input
                    type="url"
                    placeholder={t("form.mapsUrlPlaceholder")}
                    value={mapsUrl}
                    onChange={(e) => applyMapsUrl(e.target.value)}
                    onPaste={(e) => {
                      const pasted = e.clipboardData.getData('text');
                      if (pasted) setTimeout(() => applyMapsUrl(pasted), 0);
                    }}
                    className="form-input"
                    dir="ltr"
                  />
                  {mapsParsed === 'ok' && (
                    <p style={{ fontSize: 11, color: 'var(--forest)', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <CheckCircle style={{ width: 11, height: 11 }} /> {t("form.mapsOk")}
                    </p>
                  )}
                  {mapsParsed === 'fail' && (
                    <p style={{ fontSize: 11, color: 'var(--terra)', marginTop: 4 }}>
                      {t("form.mapsFail")}
                    </p>
                  )}
                </>
              )}
            </div>
            {field(t("form.lat"), <input type="number" step="any" placeholder="24.6877" value={form.lat} onChange={(e) => setForm((f) => ({ ...f, lat: e.target.value }))} className="form-input" dir="ltr" />)}
            {field(t("form.lng"), <input type="number" step="any" placeholder="46.7220" value={form.lng} onChange={(e) => setForm((f) => ({ ...f, lng: e.target.value }))} className="form-input" dir="ltr" />)}
            {field(t("form.maxPower"), <input type="number" placeholder="150" value={form.maxPowerKw} onChange={(e) => setForm((f) => ({ ...f, maxPowerKw: e.target.value }))} className="form-input" dir="ltr" />)}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              {field(t("form.totalSlots"), <input type="number" placeholder="8" value={form.totalSlots} onChange={(e) => setForm((f) => ({ ...f, totalSlots: e.target.value }))} className="form-input" dir="ltr" />)}
              {field(t("form.availableSlots"), <input type="number" placeholder="4" value={form.availableSlots} onChange={(e) => setForm((f) => ({ ...f, availableSlots: e.target.value }))} className="form-input" dir="ltr" />)}
            </div>
            <div style={{ gridColumn: '1 / -1' }}>
              <label className="form-label">{t("form.connectors")}</label>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {CONNECTOR_OPTIONS.map((c) => {
                  const selected = form.connectorTypes.includes(c);
                  return (
                    <button key={c} type="button" onClick={() => toggleConnector(c)}
                      style={{ padding: '4px 10px', fontSize: 11, fontWeight: 500, borderRadius: 2, background: selected ? 'var(--ink)' : 'transparent', color: selected ? 'var(--cream)' : 'var(--ink-3)', border: selected ? '1px solid var(--ink)' : '1px solid var(--line)', cursor: 'pointer' }}>
                      {CONNECTOR_LABELS[c]}
                    </button>
                  );
                })}
              </div>
            </div>
            {field(t("form.openHours"), <input type="text" placeholder={t("form.openHoursPlaceholder")} value={form.openHours} onChange={(e) => setForm((f) => ({ ...f, openHours: e.target.value }))} className="form-input" />)}
            {field(t("form.phone"), <input type="tel" placeholder="+966 5xxxxxxxx" value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} className="form-input" dir="ltr" />)}
            <div style={{ gridColumn: '1 / -1' }}>
              {field(t("form.website"), <input type="url" placeholder="https://..." value={form.website} onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))} className="form-input" dir="ltr" />)}
            </div>
            <div style={{ gridColumn: '1 / -1', display: 'flex', alignItems: 'center', gap: 20 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={form.isActive} onChange={(e) => setForm((f) => ({ ...f, isActive: e.target.checked }))} style={{ width: 14, height: 14 }} />
                <span style={{ color: 'var(--ink-2)' }}>{t("form.isActive")}</span>
              </label>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={form.isVerified} onChange={(e) => setForm((f) => ({ ...f, isVerified: e.target.checked }))} style={{ width: 14, height: 14 }} />
                <span style={{ color: 'var(--ink-2)' }}>{t("form.isVerified")}</span>
              </label>
            </div>
          </div>
        </form>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 8, padding: '12px 20px', borderTop: '1px solid var(--line)' }}>
          <AdminButton variant="ghost" onClick={onClose} disabled={isSubmitting}>{tCommon("cancel")}</AdminButton>
          <AdminButton variant="primary" type="submit" form="station-form" isLoading={isSubmitting}>{station ? t("form.saveEdits") : t("form.addStation")}</AdminButton>
        </div>
      </div>
    </div>
  );
}

export default function ChargingStationsPage() {
  const t = useTranslations("stations");
  const tCommon = useTranslations("common");
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [formModal, setFormModal] = useState<{ open: boolean; station: ChargingStation | null }>({ open: false, station: null });
  const [deleteTarget, setDeleteTarget] = useState<ChargingStation | null>(null);

  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin", "stations", page, debouncedSearch],
    queryFn: () => stationsApi.list({ page, limit: PAGE_LIMIT, search: debouncedSearch || undefined }),
    placeholderData: (prev) => prev,
  });

  const stations = data?.data ?? [];
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;
  const invalidate = () => queryClient.invalidateQueries({ queryKey: ["admin", "stations"] });

  const deleteMutation = useMutation({ mutationFn: (id: string) => stationsApi.delete(id), onSuccess: () => { setDeleteTarget(null); invalidate(); } });
  const toggleMutation = useMutation({ mutationFn: (id: string) => stationsApi.toggleActive(id), onSuccess: () => invalidate() });

  const iconBtnStyle: React.CSSProperties = { padding: 6, background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', borderRadius: 2, display: 'flex', alignItems: 'center' };

  const columns: Column<ChargingStation>[] = [
    {
      key: "name", header: t("columns.name"),
      render: (s) => (
        <div>
          <p style={{ fontWeight: 500, color: 'var(--ink)', fontSize: 13 }}>{s.nameAr || s.name}</p>
          {s.nameAr && <p style={{ fontSize: 10, color: 'var(--ink-4)', fontFamily: 'monospace' }}>{s.name}</p>}
        </div>
      ),
    },
    {
      key: "city", header: t("columns.city"),
      render: (s) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--ink-3)' }}>
          <MapPin style={{ width: 12, height: 12, flexShrink: 0 }} />{safeText(cityToText(s.city))}
        </div>
      ),
    },
    { key: "connectorTypes", header: t("columns.connectors"), render: (s) => <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>{s.connectorTypes?.map((c) => <ConnectorBadge key={c} type={c} />)}</div> },
    { key: "maxPowerKw", header: t("columns.power"), render: (s) => <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--ink-3)' }}><Zap style={{ width: 12, height: 12, color: '#d97706' }} />{formatNumber(s.maxPowerKw)} kW</div> },
    { key: "slots", header: t("columns.slots"), render: (s) => <span style={{ fontSize: 12, color: 'var(--ink-3)' }}>{formatNumber(s.availableSlots)} / {formatNumber(s.totalSlots)}</span> },
    {
      key: "status", header: t("columns.status"),
      render: (s) => (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', fontSize: 10, fontWeight: 500, background: s.isActive ? 'rgba(45,74,62,.1)' : 'var(--sand)', color: s.isActive ? 'var(--forest)' : 'var(--ink-4)', borderRadius: 2 }}>
            {s.isActive ? <CheckCircle style={{ width: 10, height: 10 }} /> : <XCircle style={{ width: 10, height: 10 }} />}
            {s.isActive ? t("activeLabel") : t("inactiveLabel")}
          </span>
          {s.isVerified && (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, padding: '2px 8px', fontSize: 10, fontWeight: 500, background: 'rgba(107,142,156,.12)', color: 'var(--sky)', borderRadius: 2 }}>
              <CheckCircle style={{ width: 10, height: 10 }} />{t("verifiedLabel")}
            </span>
          )}
        </div>
      ),
    },
    {
      key: "actions", header: "", width: "100px",
      render: (s) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end' }}>
          <button onClick={() => setFormModal({ open: true, station: s })} style={iconBtnStyle} title={t("actions.edit")}><Pencil style={{ width: 14, height: 14 }} /></button>
          <button onClick={() => toggleMutation.mutate(s.id)} style={iconBtnStyle} title={s.isActive ? t("actions.disable") : t("actions.enable")}>
            {s.isActive ? <XCircle style={{ width: 14, height: 14 }} /> : <CheckCircle style={{ width: 14, height: 14 }} />}
          </button>
          <button onClick={() => setDeleteTarget(s)} style={{ ...iconBtnStyle, color: 'var(--terra)' }} title={t("actions.delete")}><Trash2 style={{ width: 14, height: 14 }} /></button>
        </div>
      ),
    },
  ];

  return (
    <>
      <AdminTopbar title={t("title")} subtitle={t("count", { count: formatNumber(total) })} />
      <main className="admin-main">
        {isError && (
          <div style={{ background: 'rgba(180,94,66,0.08)', border: '1px solid rgba(180,94,66,0.3)', borderRadius: 3, padding: '10px 14px', fontSize: 13, color: 'var(--terra)', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
            <AlertTriangle style={{ width: 14, height: 14, flexShrink: 0 }} /> {t("loadError")}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: 8, marginBottom: 16 }}>
          <div style={{ position: 'relative', flex: '1 1 200px', maxWidth: 320 }}>
            <Search style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 14, height: 14, color: 'var(--ink-4)' }} />
            <input type="text" placeholder={t("searchPlaceholder")} value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} className="form-input" style={{ paddingRight: 32 }} />
            {search && <button onClick={() => setSearch("")} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--ink-4)', display: 'flex' }}><X style={{ width: 13, height: 13 }} /></button>}
          </div>
          <AdminButton variant="primary" leftIcon={<Plus style={{ width: 14, height: 14 }} />} onClick={() => setFormModal({ open: true, station: null })}>{t("addStation")}</AdminButton>
        </div>

        <DataTable columns={columns} data={stations} isLoading={isLoading} page={page} totalPages={totalPages} onPageChange={setPage} total={total} limit={PAGE_LIMIT} emptyMessage={t("empty")} />
      </main>

      {formModal.open && (
        <StationFormModal station={formModal.station} onClose={() => setFormModal({ open: false, station: null })} onSaved={() => { setFormModal({ open: false, station: null }); invalidate(); }} />
      )}

      {deleteTarget && (
        <ConfirmModal isOpen onClose={() => setDeleteTarget(null)} onConfirm={() => deleteMutation.mutate(deleteTarget.id)}
          title={t("confirm.deleteTitle")} message={t("confirm.deleteMessage", { name: deleteTarget.nameAr || deleteTarget.name })}
          confirmLabel={tCommon("delete")} cancelLabel={tCommon("cancel")} variant="danger" isLoading={deleteMutation.isPending} />
      )}
    </>
  );
}
