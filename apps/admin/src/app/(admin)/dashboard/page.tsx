"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Users, Map, ShieldCheck, Flag, Zap, Clock } from "lucide-react";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { MetricsChart } from "@/components/dashboard/MetricsChart";
import { dashboardApi } from "@/lib/api/admin.api";
import type { DashboardStats, GrowthDataPoint, RecentActivity } from "@/types/admin.types";
import { formatNumber } from "@/lib/format";
import dayjs from "dayjs";
import relativeTime from "dayjs/plugin/relativeTime";
dayjs.extend(relativeTime);

const POPULAR_ROUTES = [
  { from: "الرياض", to: "جدة",     trips: 342, avgBattery: 78 },
  { from: "الرياض", to: "الدمام",  trips: 218, avgBattery: 82 },
  { from: "جدة",   to: "مكة",     trips: 197, avgBattery: 91 },
  { from: "الرياض", to: "تبوك",   trips: 89,  avgBattery: 65 },
  { from: "الدمام", to: "الخبر",  trips: 156, avgBattery: 88 },
];

function batteryColor(pct: number) {
  if (pct >= 70) return 'var(--forest)';
  if (pct >= 40) return 'var(--ink-2)';
  return 'var(--terra)';
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [growth, setGrowth] = useState<GrowthDataPoint[]>([]);
  const [activity, setActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [statsData, growthData, activityData] = await Promise.all([
        dashboardApi.getStats(),
        dashboardApi.getGrowth(30),
        dashboardApi.getRecentActivity(10),
      ]);
      setStats(statsData);
      setGrowth(growthData);
      setActivity(activityData);
    } catch (err: any) {
      setStats(null);
      setGrowth([]);
      setActivity([]);
      setError(err?.response?.data?.message || err?.message || t("genericError"));
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <>
      <AdminTopbar title={t("title")} subtitle={t("subtitle")} />
      <main className="admin-main">

        {error && !isLoading && (
          <div style={{ marginBottom: 16, padding: '12px 16px', background: 'rgba(180,94,66,.08)', border: '1px solid var(--terra)', borderRadius: 2, color: 'var(--terra)', fontSize: 13 }}>
            <strong>{t("error")}:</strong> {error}
            <button onClick={() => load()} style={{ marginInlineStart: 12, padding: '2px 10px', background: 'var(--terra)', color: 'var(--cream)', border: 'none', borderRadius: 2, cursor: 'pointer', fontSize: 12 }}>{t("retry")}</button>
          </div>
        )}

        {/* Stats grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
          <StatsCard title={t("totalUsers")}       value={stats?.totalUsers ?? 0}       growthPercent={stats?.usersGrowthPercent}      subtitle={t("vsLastMonth")}   icon={<Users style={{ width: 18, height: 18 }} />}                                isLoading={isLoading} />
          <StatsCard title={t("tripsToday")}       value={stats?.tripsToday ?? 0}       growthPercent={stats?.tripsTodayGrowthPercent} subtitle={t("vsYesterday")}   icon={<Map style={{ width: 18, height: 18 }} />}        accentColor="var(--sky)"  isLoading={isLoading} />
          <StatsCard title={t("pendingModeration")} value={stats?.pendingModeration ?? 0}                                                subtitle={t("needsAction")}    icon={<ShieldCheck style={{ width: 18, height: 18 }} />} accentColor="var(--terra)" isLoading={isLoading} />
          <StatsCard title={t("openReports")}      value={stats?.openReports ?? 0}                                                       subtitle={t("needsAttention")} icon={<Flag style={{ width: 18, height: 18 }} />}       accentColor="var(--terra)" isLoading={isLoading} />
        </div>

        {/* Charts + Activity */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 16, marginBottom: 24 }}>
          {/* Growth chart */}
          <div className="card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <p className="eyebrow">{t("growthEyebrow")}</p>
                <h2 style={{ fontSize: 14, fontWeight: 500, color: 'var(--ink)', marginTop: 4 }}>{t("growthTitle")}</h2>
              </div>
            </div>
            <div style={{ padding: 20 }}>
              <MetricsChart data={growth} isLoading={isLoading} />
            </div>
          </div>

          {/* Recent Activity */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div className="card-header">
              <p className="eyebrow">{t("recentActivity")}</p>
            </div>
            <div>
              {isLoading
                ? Array.from({ length: 5 }).map((_, i) => (
                    <div key={i} style={{ display: 'flex', gap: 12, padding: '12px 20px', borderBottom: '1px solid var(--line-soft)' }}>
                      <div className="skeleton" style={{ width: 28, height: 28, borderRadius: '50%', flexShrink: 0 }} />
                      <div style={{ flex: 1 }}>
                        <div className="skeleton" style={{ height: 12, width: '75%', marginBottom: 6 }} />
                        <div className="skeleton" style={{ height: 10, width: '50%' }} />
                      </div>
                    </div>
                  ))
                : activity.map((item, idx) => (
                    <div key={item.id} style={{ display: 'flex', gap: 12, padding: '12px 20px', borderBottom: idx < activity.length - 1 ? '1px solid var(--line-soft)' : 'none' }}>
                      <div style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--sand)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        {item.type === 'user_joined'    && <Users    style={{ width: 12, height: 12, color: 'var(--sky)' }} />}
                        {item.type === 'trip_submitted' && <Map      style={{ width: 12, height: 12, color: 'var(--forest)' }} />}
                        {item.type === 'report_filed'   && <Flag     style={{ width: 12, height: 12, color: 'var(--terra)' }} />}
                        {item.type === 'trip_approved'  && <ShieldCheck style={{ width: 12, height: 12, color: 'var(--forest)' }} />}
                        {!['user_joined','trip_submitted','report_filed','trip_approved'].includes(item.type) && <Clock style={{ width: 12, height: 12, color: 'var(--ink-3)' }} />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: 12, color: 'var(--ink-2)', lineHeight: 1.4, marginBottom: 3 }}>{item.description}</p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--ink-3)' }}>{item.actorName}</span>
                          <span style={{ color: 'var(--line)' }}>·</span>
                          <span style={{ fontSize: 11, color: 'var(--ink-4)', flexShrink: 0 }}>{dayjs(item.createdAt).fromNow()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
            </div>
          </div>
        </div>

        {/* Popular Routes */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div>
              <p className="eyebrow">{t("popularRoutes")}</p>
              <p style={{ fontSize: 12, color: 'var(--ink-3)', marginTop: 4 }}>
                {t("popularRoutesSubtitle")}
                <span style={{ marginInlineStart: 8, padding: '1px 6px', fontSize: 10, background: 'var(--sand)', color: 'var(--ink-4)', borderRadius: 2, textTransform: 'uppercase', letterSpacing: '0.08em' }}>{t("demo")}</span>
              </p>
            </div>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t("route")}</th>
                  <th>{t("tripCount")}</th>
                  <th>{t("avgBatteryRemaining")}</th>
                  <th>{t("popularity")}</th>
                </tr>
              </thead>
              <tbody>
                {POPULAR_ROUTES.map((route) => (
                  <tr key={`${route.from}-${route.to}`}>
                    <td>
                      <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{route.from}</span>
                      <span style={{ color: 'var(--ink-4)', margin: '0 8px' }}>←</span>
                      <span style={{ fontWeight: 500, color: 'var(--ink)' }}>{route.to}</span>
                    </td>
                    <td style={{ fontVariantNumeric: 'tabular-nums' }}>{route.trips}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={{ flex: 1, maxWidth: 100, height: 4, background: 'var(--line)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: batteryColor(route.avgBattery), width: `${route.avgBattery}%`, borderRadius: 2 }} />
                        </div>
                        <span style={{ fontSize: 12, color: batteryColor(route.avgBattery), fontVariantNumeric: 'tabular-nums' }}>{route.avgBattery}%</span>
                      </div>
                    </td>
                    <td>
                      <div style={{ width: 120, height: 4, background: 'var(--line)', borderRadius: 2, overflow: 'hidden' }}>
                        <div style={{ height: '100%', background: 'var(--ink-3)', width: `${(route.trips / POPULAR_ROUTES[0].trips) * 100}%`, borderRadius: 2 }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Secondary stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px' }}>
            <div style={{ width: 40, height: 40, background: 'var(--sand)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Zap style={{ width: 18, height: 18, color: 'var(--ink-2)' }} />
            </div>
            <div>
              <p className="eyebrow">{t("chargingStations")}</p>
              <p style={{ fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.03em', marginTop: 4 }}>{formatNumber(stats?.totalStations, '—')}</p>
            </div>
          </div>
          <div className="card" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '20px 24px' }}>
            <div style={{ width: 40, height: 40, background: 'var(--sand)', border: '1px solid var(--line)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Map style={{ width: 18, height: 18, color: 'var(--ink-2)' }} />
            </div>
            <div>
              <p className="eyebrow">{t("totalTrips")}</p>
              <p style={{ fontSize: 28, fontWeight: 500, color: 'var(--ink)', letterSpacing: '-0.03em', marginTop: 4 }}>{formatNumber(stats?.totalTrips, '—')}</p>
            </div>
          </div>
        </div>

      </main>
    </>
  );
}
