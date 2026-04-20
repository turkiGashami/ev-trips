"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeft, Map, Star, ShieldCheck, ShieldOff, Ban, BadgeCheck,
  Calendar, Phone, Mail, Clock, Edit2
} from "lucide-react";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { UserStatusBadge } from "@/components/users/UserStatusBadge";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { usersApi, tripsApi } from "@/lib/api/admin.api";
import type { PlatformUser, Trip } from "@/types/admin.types";
import { formatNumber, safeText } from "@/lib/format";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

export default function UserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [user, setUser] = useState<PlatformUser | null>(null);
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
          tripsApi.list({ page: 1, limit: 10 }),
        ]);
        setUser(userData);
        setTrips(tripsData.data);
      } catch {
        // mock
        const mock: PlatformUser = {
          id,
          name: "Ahmed Al-Ghamdi",
          email: "ahmed@example.com",
          phone: "+966 50 123 4567",
          avatar: undefined,
          status: "active",
          role: "verified",
          badges: ["Early Adopter", "Top Contributor"],
          tripsCount: 24,
          joinedAt: new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString(),
          lastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
          bio: "EV enthusiast driving a Tesla Model 3. Love exploring Saudi Arabia with zero emissions.",
          vehicles: [
            {
              id: "v1",
              userId: id,
              brandId: "b1",
              brand: { id: "b1", name: "Tesla", logo: undefined },
              modelId: "m1",
              model: { id: "m1", name: "Model 3", year: 2023 },
              color: "Red",
              isPrimary: true,
            },
          ],
        };
        setUser(mock);
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
      setUser(updated);
    } catch {
      // handle error
    } finally {
      setActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <>
        <AdminTopbar title="User Detail" />
        <main className="admin-main">
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        </main>
      </>
    );
  }

  if (!user) return null;

  return (
    <>
      <AdminTopbar title="User Detail" subtitle={safeText(user.name)} />
      <main className="admin-main">
        {/* Back */}
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-200 transition-colors mb-5"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Users
        </button>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
          {/* Profile Card */}
          <div className="xl:col-span-1 space-y-4">
            <div className="card p-6">
              <div className="flex flex-col items-center text-center mb-5">
                <div className="w-20 h-20 rounded-full bg-slate-700 flex items-center justify-center text-2xl font-bold text-slate-200 mb-3 overflow-hidden">
                  {user.avatar ? (
                    <Image src={user.avatar} alt={safeText(user.name, '')} width={80} height={80} className="object-cover" />
                  ) : (
                    (user.name?.charAt(0) ?? '?').toUpperCase()
                  )}
                </div>
                <h2 className="text-lg font-bold text-slate-100">{safeText(user.name)}</h2>
                <p className="text-sm text-slate-400 mt-0.5">{safeText(user.email)}</p>
                <div className="flex gap-2 mt-3">
                  <UserStatusBadge status={user.status} />
                  <StatusBadge status={user.role} />
                </div>
              </div>

              {/* Badges */}
              {(user.badges?.length ?? 0) > 0 && (
                <div className="mb-4">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-2">Badges</p>
                  <div className="flex flex-wrap gap-1.5">
                    {user.badges?.map((b) => (
                      <span key={b} className="px-2.5 py-1 rounded-full bg-amber-500/15 text-amber-400 text-xs font-medium ring-1 ring-amber-500/30">
                        {b}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Info */}
              <div className="space-y-2.5 text-sm">
                {user.phone && (
                  <div className="flex items-center gap-2.5 text-slate-400">
                    <Phone className="w-4 h-4 flex-shrink-0 text-slate-600" />
                    {safeText(user.phone)}
                  </div>
                )}
                <div className="flex items-center gap-2.5 text-slate-400">
                  <Calendar className="w-4 h-4 flex-shrink-0 text-slate-600" />
                  Joined {dayjs(user.joinedAt).format("MMM D, YYYY")}
                </div>
                {user.lastActiveAt && (
                  <div className="flex items-center gap-2.5 text-slate-400">
                    <Clock className="w-4 h-4 flex-shrink-0 text-slate-600" />
                    Active {dayjs(user.lastActiveAt).fromNow()}
                  </div>
                )}
              </div>

              {user.bio && (
                <div className="mt-4 pt-4 border-t border-slate-700/40">
                  <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-1.5">Bio</p>
                  <p className="text-sm text-slate-400 leading-relaxed">{safeText(user.bio)}</p>
                </div>
              )}
            </div>

            {/* Stats */}
            <div className="card p-5 grid grid-cols-1 gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Total Trips</span>
                <span className="text-lg font-bold text-slate-100">{formatNumber(user.tripsCount)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Badges Earned</span>
                <span className="text-lg font-bold text-slate-100">{formatNumber(user.badges?.length)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Vehicles</span>
                <span className="text-lg font-bold text-slate-100">{formatNumber(user.vehicles?.length)}</span>
              </div>
            </div>

            {/* Vehicles */}
            {user.vehicles && user.vehicles.length > 0 && (
              <div className="card p-5">
                <p className="text-xs text-slate-500 uppercase tracking-wide font-medium mb-3">Vehicles</p>
                <div className="space-y-2">
                  {user.vehicles.map((v) => (
                    <div key={v.id} className="flex items-center gap-3 p-3 bg-slate-800/50 rounded-lg">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-200">
                          {safeText(v.brand?.name, '')} {safeText(v.model?.name, '')} ({safeText(v.model?.year, '—')})
                        </p>
                        {v.color && <p className="text-xs text-slate-500">{safeText(v.color)}</p>}
                      </div>
                      {v.isPrimary && (
                        <span className="text-[10px] text-emerald-400 font-medium">Primary</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Main Content */}
          <div className="xl:col-span-2 space-y-5">
            {/* Action Buttons */}
            <div className="card p-5">
              <h3 className="text-sm font-semibold text-slate-200 mb-4">Admin Actions</h3>
              <div className="flex flex-wrap gap-2">
                {user.status !== "active" && (
                  <button onClick={() => setActionModal("activate")} className="btn-primary btn-sm">
                    <BadgeCheck className="w-3.5 h-3.5" /> Activate
                  </button>
                )}
                {user.status !== "suspended" && (
                  <button onClick={() => setActionModal("suspend")} className="btn btn-sm bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30">
                    <ShieldOff className="w-3.5 h-3.5" /> Suspend
                  </button>
                )}
                {user.status !== "banned" && (
                  <button onClick={() => setActionModal("ban")} className="btn-danger btn-sm">
                    <Ban className="w-3.5 h-3.5" /> Ban
                  </button>
                )}
                <button onClick={() => setActionModal("verify")} className="btn btn-sm bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 border border-blue-500/30">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verify
                </button>
                <button onClick={() => setActionModal("badge")} className="btn btn-sm bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 border border-amber-500/30">
                  <Star className="w-3.5 h-3.5" /> Award Badge
                </button>
              </div>
            </div>

            {/* Trips */}
            <div className="card">
              <div className="card-header">
                <h3 className="text-sm font-semibold text-slate-200">Recent Trips</h3>
              </div>
              {trips.length === 0 ? (
                <div className="px-5 py-10 text-center text-slate-500 text-sm">No trips found</div>
              ) : (
                <div className="divide-y divide-slate-700/40">
                  {trips.slice(0, 5).map((trip) => (
                    <div key={trip.id} className="px-5 py-4 flex items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <Link href={`/trips/${trip.id}`} className="text-sm font-medium text-slate-200 hover:text-emerald-400 truncate block">
                          {safeText(trip.fromCity)} → {safeText(trip.toCity)}
                        </Link>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {dayjs(trip.createdAt).format("MMM D, YYYY")} · {formatNumber(trip.distanceKm)} km
                        </p>
                      </div>
                      <StatusBadge status={trip.status} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Action Modal */}
      {actionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-md shadow-2xl">
            <div className="px-6 py-5 border-b border-slate-700/60">
              <h3 className="font-semibold text-slate-100 capitalize">
                {actionModal === "badge" ? "Award Badge" : actionModal === "role" ? "Change Role" : `${actionModal} User`}
              </h3>
            </div>
            <div className="px-6 py-5 space-y-4">
              {(actionModal === "suspend" || actionModal === "ban") && (
                <div>
                  <label className="form-label">Reason *</label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Provide a reason…"
                    rows={3}
                    className="form-textarea"
                  />
                </div>
              )}
              {actionModal === "badge" && (
                <div>
                  <label className="form-label">Badge</label>
                  <select value={selectedBadge} onChange={(e) => setSelectedBadge(e.target.value)} className="form-select">
                    {["Early Adopter", "Top Contributor", "Road Master", "EV Pioneer", "Community Star"].map(b => (
                      <option key={b} value={b}>{b}</option>
                    ))}
                  </select>
                </div>
              )}
              {actionModal === "role" && (
                <div>
                  <label className="form-label">New Role</label>
                  <select value={newRole} onChange={(e) => setNewRole(e.target.value)} className="form-select">
                    <option value="user">User</option>
                    <option value="verified">Verified</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
              )}
              {(actionModal === "verify" || actionModal === "activate") && (
                <p className="text-sm text-slate-400">Confirm you want to {actionModal} {safeText(user.name)}?</p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-slate-700/60 flex justify-end gap-3">
              <button onClick={() => { setActionModal(null); setReason(""); }} className="btn-secondary btn-sm">Cancel</button>
              <button
                onClick={handleAction}
                disabled={actionLoading || ((actionModal === "suspend" || actionModal === "ban") && !reason.trim())}
                className={`btn btn-sm ${actionModal === "ban" ? "btn-danger" : "btn-primary"}`}
              >
                {actionLoading ? "Processing…" : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
