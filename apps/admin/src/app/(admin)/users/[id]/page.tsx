"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowRight, Star, ShieldCheck, ShieldOff, Ban, BadgeCheck,
  Calendar, Phone, Clock, MapPin,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { usersApi, tripsApi } from "@/lib/api/admin.api";
import type { Trip } from "@/types/admin.types";
import { formatNumber, formatDate, safeText } from "@/lib/format";

// ─── Field accessors (handle both camelCase and snake_case from API) ─────
const pickName = (u: any): string =>
  u?.name ?? u?.full_name ?? u?.fullName ?? u?.username ?? u?.email ?? '—';
const pickEmail = (u: any): string => u?.email ?? '—';
const pickPhone = (u: any): string | undefined => u?.phone ?? u?.phone_number;
const pickRole = (u: any): string => u?.role ?? 'user';
const pickStatus = (u: any): string => u?.status ?? 'active';
const pickAvatar = (u: any): string | undefined =>
  u?.avatar ?? u?.avatar_url ?? u?.avatarUrl ?? undefined;
const pickJoined = (u: any): string | undefined =>
  u?.joinedAt ?? u?.joined_at ?? u?.created_at ?? u?.createdAt;
const pickLastSeen = (u: any): string | undefined =>
  u?.lastActiveAt ?? u?.last_active_at ?? u?.last_seen_at ?? u?.lastSeenAt;
const pickTripsCount = (u: any): number =>
  u?.tripsCount ?? u?.trips_count ?? u?.total_trips ?? 0;
const pickBio = (u: any): string | undefined => u?.bio;
const pickCity = (u: any): string => {
  const c = u?.city;
  if (!c) return '';
  if (typeof c === 'string') return c;
  return c?.name_ar ?? c?.name ?? '';
};
const pickVehicles = (u: any): any[] => {
  const list = u?.vehicles ?? u?.user_vehicles ?? [];
  return Array.isArray(list) ? list : [];
};
const pickBadges = (u: any): string[] => {
  const list = u?.badges ?? u?.user_badges ?? [];
  return Array.isArray(list) ? list.map((b: any) => (typeof b === 'string' ? b : b?.name ?? b?.title ?? '')) : [];
};

const ROLE_KEYS: Record<string, string> = {
  super_admin: 'super_admin',
  admin: 'admin',
  moderator: 'moderator',
  user: 'user',
  verified: 'verified',
  premium: 'premium',
  guest: 'guest',
};
const STATUS_KEYS: Record<string, string> = {
  active: 'active',
  suspended: 'suspended',
  banned: 'banned',
  pending: 'pending',
};
const STATUS_TOKEN: Record<string, { bg: string; color: string }> = {
  active:    { bg: 'rgba(45,74,62,.1)',  color: 'var(--forest)' },
  suspended: { bg: 'rgba(180,94,66,.1)', color: 'var(--terra)' },
  banned:    { bg: 'var(--ink-2)',       color: 'var(--cream)' },
  pending:   { bg: 'var(--sand)',        color: 'var(--ink-3)' },
};
const ROLE_TOKEN: Record<string, { bg: string; color: string }> = {
  super_admin: { bg: 'rgba(45,74,62,.15)', color: 'var(--forest)' },
  admin:       { bg: 'rgba(45,74,62,.10)', color: 'var(--forest)' },
  moderator:   { bg: 'rgba(107,142,156,.12)', color: 'var(--sky)' },
  user:        { bg: 'var(--sand)', color: 'var(--ink-3)' },
  verified:    { bg: 'rgba(107,142,156,.12)', color: 'var(--sky)' },
  premium:     { bg: 'rgba(180,94,66,.10)', color: 'var(--terra)' },
};

function Pill({ text, tone }: { text: string; tone: { bg: string; color: string } }) {
  return (
    <span style={{
      display: 'inline-flex', padding: '3px 10px', fontSize: 11, fontWeight: 500,
      background: tone.bg, color: tone.color, borderRadius: 2,
    }}>
      {text}
    </span>
  );
}

export default function UserDetailPage() {
  const t = useTranslations("users");
  const tCommon = useTranslations("common");
  const tStatus = useTranslations("status");
  const tRoles = useTranslations("roles");
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [trips, setTrips] = useState<Trip[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [actionModal, setActionModal] = useState<"suspend" | "ban" | "verify" | "activate" | "role" | "badge" | null>(null);
  const [reason, setReason] = useState("");
  const [newRole, setNewRole] = useState("user");
  const [selectedBadge, setSelectedBadge] = useState("Early Adopter");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [userData, tripsData] = await Promise.all([
          usersApi.get(id),
          tripsApi.list({ page: 1, limit: 10 }).catch(() => ({ data: [] } as any)),
        ]);
        // The API returns { success, data: { ... } } — unwrap one layer if needed.
        const actual = (userData as any)?.data?.data ?? (userData as any)?.data ?? userData;
        setUser(actual);
        const tripsList = (tripsData as any)?.data ?? [];
        setTrips(Array.isArray(tripsList) ? tripsList : []);
      } catch {
        setUser(null);
        setTrips([]);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, [id]);

  const handleAction = async () => {
    if (!user) return;
    setActionLoading(true);
    try {
      if (actionModal === "suspend") await usersApi.suspend(user.id, reason);
      else if (actionModal === "ban") await usersApi.ban(user.id, reason);
      else if (actionModal === "verify") await usersApi.verify(user.id);
      else if (actionModal === "activate") await usersApi.activate(user.id);
      else if (actionModal === "badge") await usersApi.assignBadge(user.id, selectedBadge);
      setActionModal(null);
      setReason("");
      const updated = await usersApi.get(user.id).catch(() => user);
      const actual = (updated as any)?.data?.data ?? (updated as any)?.data ?? updated;
      setUser(actual);
    } catch {
      // surface a toast later
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <AdminTopbar title={t("detailTitle")} />
        <main className="admin-main">
          <div style={{ textAlign: 'center', padding: '64px 0', color: 'var(--ink-4)', fontSize: 13 }}>
            {tCommon("loading")}
          </div>
        </main>
      </>
    );
  }

  if (!user) {
    return (
      <>
        <AdminTopbar title={t("detailTitle")} />
        <main className="admin-main">
          <div style={{ textAlign: 'center', padding: '48px 16px', background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 4 }}>
            <p style={{ color: 'var(--ink-4)', fontSize: 13 }}>{t("loadDetailError")}</p>
          </div>
        </main>
      </>
    );
  }

  const displayName = pickName(user);
  const email = pickEmail(user);
  const phone = pickPhone(user);
  const role = pickRole(user);
  const status = pickStatus(user);
  const avatar = pickAvatar(user);
  const joined = pickJoined(user);
  const lastSeen = pickLastSeen(user);
  const tripsCount = pickTripsCount(user);
  const bio = pickBio(user);
  const city = pickCity(user);
  const vehicles = pickVehicles(user);
  const badges = pickBadges(user);

  const pillBtn = (colorBg: string, colorText: string): React.CSSProperties => ({
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '6px 14px', fontSize: 12, fontWeight: 500,
    background: colorBg, color: colorText, border: `1px solid ${colorText}`,
    borderRadius: 2, cursor: 'pointer',
  });

  return (
    <>
      <AdminTopbar title={t("detailTitle")} subtitle={displayName} />
      <main className="admin-main">
        {/* Back */}
        <button
          onClick={() => router.back()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--ink-3)', background: 'none', border: 'none', cursor: 'pointer', marginBottom: 16 }}
        >
          <ArrowRight style={{ width: 14, height: 14 }} />
          {t("detail.backToUsers")}
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1fr) minmax(0, 2fr)', gap: 16 }}>
          {/* Profile column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 4, padding: 20 }}>
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', marginBottom: 16 }}>
                <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--sand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, fontWeight: 600, color: 'var(--ink-2)', marginBottom: 12, overflow: 'hidden' }}>
                  {avatar ? (
                    <Image src={avatar} alt={displayName} width={80} height={80} style={{ objectFit: 'cover', width: '100%', height: '100%' }} />
                  ) : (
                    (displayName?.charAt(0) ?? '?').toUpperCase()
                  )}
                </div>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }}>{safeText(displayName)}</h2>
                <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 2 }}>{safeText(email)}</p>
                <div style={{ display: 'flex', gap: 6, marginTop: 10 }}>
                  <Pill text={STATUS_KEYS[status] ? tStatus(STATUS_KEYS[status] as any) : status} tone={STATUS_TOKEN[status] ?? STATUS_TOKEN.active} />
                  <Pill text={ROLE_KEYS[role] ? tRoles(ROLE_KEYS[role] as any) : role} tone={ROLE_TOKEN[role] ?? ROLE_TOKEN.user} />
                </div>
              </div>

              {/* Badges */}
              {badges.length > 0 && (
                <div style={{ marginBottom: 14 }}>
                  <p className="eyebrow" style={{ marginBottom: 8 }}>{t("detail.badges")}</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {badges.map((b) => (
                      <span key={b} style={{ padding: '3px 10px', fontSize: 11, fontWeight: 500, background: 'rgba(180,94,66,.08)', color: 'var(--terra)', border: '1px solid rgba(180,94,66,.25)', borderRadius: 2 }}>
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Info */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: 13 }}>
                {phone && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-3)' }}>
                    <Phone style={{ width: 14, height: 14, flexShrink: 0, color: 'var(--ink-4)' }} />
                    <span dir="ltr" className="nums-latin">{safeText(phone)}</span>
                  </div>
                )}
                {city && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-3)' }}>
                    <MapPin style={{ width: 14, height: 14, flexShrink: 0, color: 'var(--ink-4)' }} />
                    {city}
                  </div>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-3)' }}>
                  <Calendar style={{ width: 14, height: 14, flexShrink: 0, color: 'var(--ink-4)' }} />
                  <span>{t("detail.joinedOn")} <span className="nums-latin">{joined ? formatDate(joined) : '—'}</span></span>
                </div>
                {lastSeen && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--ink-3)' }}>
                    <Clock style={{ width: 14, height: 14, flexShrink: 0, color: 'var(--ink-4)' }} />
                    <span>{t("detail.lastActive")} <span className="nums-latin">{formatDate(lastSeen)}</span></span>
                  </div>
                )}
              </div>

              {bio && (
                <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--line)' }}>
                  <p className="eyebrow" style={{ marginBottom: 6 }}>{t("detail.bio")}</p>
                  <p style={{ fontSize: 13, color: 'var(--ink-2)', lineHeight: 1.6 }}>{safeText(bio)}</p>
                </div>
              )}
            </div>

            {/* Stats */}
            <div style={{ background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 4, padding: 18, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{t("detail.tripsCount")}</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }} className="nums-latin">{formatNumber(tripsCount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{t("detail.badges")}</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }} className="nums-latin">{formatNumber(badges.length)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, color: 'var(--ink-3)' }}>{t("detail.vehicles")}</span>
                <span style={{ fontSize: 16, fontWeight: 600, color: 'var(--ink)' }} className="nums-latin">{formatNumber(vehicles.length)}</span>
              </div>
            </div>

            {/* Vehicles */}
            {vehicles.length > 0 && (
              <div style={{ background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 4, padding: 18 }}>
                <p className="eyebrow" style={{ marginBottom: 10 }}>{t("detail.vehicles")}</p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {vehicles.map((v: any) => {
                    const brand = v?.brand?.name ?? v?.brand_name ?? '';
                    const model = v?.model?.name ?? v?.model_name ?? '';
                    const year = v?.year ?? v?.model?.year ?? '';
                    const isDefault = v?.is_default ?? v?.isPrimary ?? false;
                    return (
                      <div key={v.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 10, background: 'var(--sand)', borderRadius: 2 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)' }}>
                            {safeText([brand, model].filter(Boolean).join(' '))}
                            {year && <span className="nums-latin" style={{ marginInlineStart: 6, color: 'var(--ink-3)' }}>({year})</span>}
                          </p>
                        </div>
                        {isDefault && (
                          <span style={{ fontSize: 10, color: 'var(--forest)', fontWeight: 500 }}>{t("detail.default")}</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Main content column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Actions */}
            <div style={{ background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 4, padding: 18 }}>
              <h3 className="heading-3" style={{ marginBottom: 12 }}>{t("detail.adminActions")}</h3>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {status !== "active" && (
                  <button onClick={() => setActionModal("activate")} style={{ ...pillBtn('var(--forest)', 'var(--cream)'), border: '1px solid var(--forest)' }}>
                    <BadgeCheck style={{ width: 14, height: 14 }} /> {t("actions.activate")}
                  </button>
                )}
                {status !== "suspended" && (
                  <button onClick={() => setActionModal("suspend")} style={pillBtn('rgba(217,119,6,.08)', '#d97706')}>
                    <ShieldOff style={{ width: 14, height: 14 }} /> {t("actions.suspend")}
                  </button>
                )}
                {status !== "banned" && (
                  <button onClick={() => setActionModal("ban")} style={pillBtn('rgba(180,94,66,.10)', 'var(--terra)')}>
                    <Ban style={{ width: 14, height: 14 }} /> {t("actions.ban")}
                  </button>
                )}
                <button onClick={() => setActionModal("verify")} style={pillBtn('rgba(107,142,156,.12)', 'var(--sky)')}>
                  <ShieldCheck style={{ width: 14, height: 14 }} /> {t("actions.verify")}
                </button>
                <button onClick={() => setActionModal("badge")} style={pillBtn('rgba(180,94,66,.08)', 'var(--terra)')}>
                  <Star style={{ width: 14, height: 14 }} /> {t("actions.assignBadge")}
                </button>
              </div>
            </div>

            {/* Trips */}
            <div style={{ background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 4 }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--line)' }}>
                <h3 className="heading-3">{t("detail.recentTrips")}</h3>
              </div>
              {trips.length === 0 ? (
                <div style={{ padding: '40px 16px', textAlign: 'center', color: 'var(--ink-4)', fontSize: 13 }}>{t("detail.noTrips")}</div>
              ) : (
                <div>
                  {trips.slice(0, 5).map((trip: any, idx) => {
                    const from = trip?.fromCity ?? trip?.from_city?.name_ar ?? trip?.from_city?.name ?? trip?.departure_city?.name_ar ?? '';
                    const to = trip?.toCity ?? trip?.to_city?.name_ar ?? trip?.to_city?.name ?? trip?.destination_city?.name_ar ?? '';
                    const created = trip?.createdAt ?? trip?.created_at ?? trip?.published_at;
                    const distance = trip?.distanceKm ?? trip?.distance_km;
                    return (
                      <div key={trip.id} style={{ padding: '12px 18px', display: 'flex', alignItems: 'center', gap: 12, borderBottom: idx < Math.min(trips.length, 5) - 1 ? '1px solid var(--line)' : 'none' }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <Link href={`/trips/${trip.id}`} style={{ fontSize: 13, fontWeight: 500, color: 'var(--ink)', textDecoration: 'none', display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {from && to ? `${from} ← ${to}` : safeText(trip.title)}
                          </Link>
                          <p style={{ fontSize: 11, color: 'var(--ink-4)', marginTop: 2 }} className="nums-latin">
                            {created ? formatDate(created) : '—'}
                            {distance ? ` · ${formatNumber(distance)} ${t("detail.km")}` : ''}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Action Modal */}
      {actionModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)' }} onClick={() => { setActionModal(null); setReason(""); }} />
          <div style={{ position: 'relative', width: '100%', maxWidth: 440, background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 4 }}>
            <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--line)' }}>
              <h3 className="heading-3">
                {actionModal === "badge" ? t("modal.badge")
                  : actionModal === "role" ? t("modal.role")
                  : actionModal === "suspend" ? t("modal.suspend")
                  : actionModal === "ban" ? t("modal.ban")
                  : actionModal === "verify" ? t("modal.verify")
                  : t("modal.activate")}
              </h3>
            </div>
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(actionModal === "suspend" || actionModal === "ban") && (
                <div>
                  <label className="form-label">{t("modal.reasonLabel")}</label>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} placeholder={t("modal.reasonShortPlaceholder")} rows={3} className="form-textarea" />
                </div>
              )}
              {actionModal === "badge" && (
                <div>
                  <label className="form-label">{t("modal.badgeSelect")}</label>
                  <select value={selectedBadge} onChange={(e) => setSelectedBadge(e.target.value)} className="form-select">
                    {["Early Adopter", "Top Contributor", "Road Master", "EV Pioneer", "Community Star"].map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
              )}
              {actionModal === "role" && (
                <div>
                  <label className="form-label">{t("modal.newRoleLabel")}</label>
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="form-select">
                    <option value="user">{tRoles("user")}</option>
                    <option value="verified">{tRoles("verified")}</option>
                    <option value="premium">{tRoles("premium")}</option>
                  </select>
                </div>
              )}
              {(actionModal === "verify" || actionModal === "activate") && (
                <p style={{ fontSize: 13, color: 'var(--ink-2)' }}>
                  {actionModal === "verify"
                    ? t("modal.confirmVerify", { name: safeText(displayName) })
                    : t("modal.confirmActivate", { name: safeText(displayName) })}
                </p>
              )}
            </div>
            <div style={{ padding: '12px 20px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button onClick={() => { setActionModal(null); setReason(""); }}
                style={{ background: 'transparent', color: 'var(--ink-2)', border: '1px solid var(--line)', borderRadius: 2, padding: '7px 16px', fontSize: 13, cursor: 'pointer' }}>
                {tCommon("cancel")}
              </button>
              <button onClick={handleAction} disabled={actionLoading || ((actionModal === "suspend" || actionModal === "ban") && !reason.trim())}
                style={{ background: actionModal === "ban" ? 'var(--terra)' : 'var(--forest)', color: 'var(--cream)', border: `1px solid ${actionModal === "ban" ? 'var(--terra)' : 'var(--forest)'}`, borderRadius: 2, padding: '7px 16px', fontSize: 13, fontWeight: 500, cursor: actionLoading ? 'not-allowed' : 'pointer' }}>
                {actionLoading ? tCommon("confirming") : tCommon("confirm")}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
