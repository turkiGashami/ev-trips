"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { Users, Map, MessageSquare, Car, ArrowUp, ArrowDown, Minus } from "lucide-react";
import { AdminTopbar } from "@/components/layout/AdminTopbar";
import { AnalyticsChart } from "@/components/dashboard/AnalyticsChart";
import { dashboardApi } from "@/lib/api/admin.api";
import { formatNumber } from "@/lib/format";
import type { AnalyticsTimeSeries, AnalyticsMetricKey } from "@/types/admin.types";

const RANGES = [
  { key: "7d", days: 7 },
  { key: "30d", days: 30 },
  { key: "90d", days: 90 },
  { key: "365d", days: 365 },
] as const;

type RangeKey = (typeof RANGES)[number]["key"];

const METRICS: AnalyticsMetricKey[] = ["users", "trips", "comments", "vehicles"];

const ICONS: Record<AnalyticsMetricKey, React.ReactNode> = {
  users:    <Users    style={{ width: 18, height: 18 }} />,
  trips:    <Map      style={{ width: 18, height: 18 }} />,
  comments: <MessageSquare style={{ width: 18, height: 18 }} />,
  vehicles: <Car      style={{ width: 18, height: 18 }} />,
};

const ACCENTS: Record<AnalyticsMetricKey, string> = {
  users:    "#3b82f6",
  trips:    "#10b981",
  comments: "#a855f7",
  vehicles: "#f59e0b",
};

export default function AnalyticsPage() {
  const t = useTranslations("analytics");
  const [range, setRange] = useState<RangeKey>("30d");
  const [data, setData] = useState<AnalyticsTimeSeries | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [enabled, setEnabled] = useState<Record<AnalyticsMetricKey, boolean>>({
    users: true,
    trips: true,
    comments: true,
    vehicles: true,
  });

  const days = useMemo(() => RANGES.find((r) => r.key === range)?.days ?? 30, [range]);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);
    dashboardApi
      .getAnalyticsTimeSeries(days)
      .then((res) => {
        if (cancelled) return;
        setData(res);
        if (!res) setError(t("loadError"));
      })
      .catch((err: any) => {
        if (cancelled) return;
        setError(err?.response?.data?.message || err?.message || t("loadError"));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [days, t]);

  const labels: Record<AnalyticsMetricKey, string> = {
    users:    t("metrics.users"),
    trips:    t("metrics.trips"),
    comments: t("metrics.comments"),
    vehicles: t("metrics.vehicles"),
  };

  const enabledMetrics = METRICS.filter((m) => enabled[m]);

  return (
    <>
      <AdminTopbar title={t("title")} subtitle={t("subtitle")} />
      <main className="admin-main">
        {/* Range selector */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 16,
          }}
        >
          <div style={{ display: "inline-flex", border: "1px solid var(--line)", borderRadius: 2, overflow: "hidden", background: "var(--cream)" }}>
            {RANGES.map((r) => (
              <button
                key={r.key}
                onClick={() => setRange(r.key)}
                style={{
                  padding: "8px 16px",
                  fontSize: 12,
                  fontWeight: 500,
                  border: "none",
                  background: range === r.key ? "var(--ink)" : "transparent",
                  color: range === r.key ? "var(--cream)" : "var(--ink-2)",
                  cursor: "pointer",
                  borderInlineEnd: r.key !== RANGES[RANGES.length - 1].key ? "1px solid var(--line)" : "none",
                  transition: "background 0.15s",
                }}
              >
                {t(`ranges.${r.key}`)}
              </button>
            ))}
          </div>

          {data && !isLoading && (
            <div style={{ fontSize: 11, color: "var(--ink-3)" }}>
              {t("comparingWindow", { days: data.days })}
            </div>
          )}
        </div>

        {error && (
          <div
            style={{
              marginBottom: 16,
              padding: "12px 16px",
              background: "rgba(180,94,66,.08)",
              border: "1px solid var(--terra)",
              borderRadius: 2,
              color: "var(--terra)",
              fontSize: 13,
            }}
          >
            {error}
          </div>
        )}

        {/* Summary cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 16, marginBottom: 24 }}>
          {METRICS.map((m) => {
            const item = data?.summary?.[m];
            const isOn = enabled[m];
            return (
              <button
                key={m}
                type="button"
                onClick={() => setEnabled((p) => ({ ...p, [m]: !p[m] }))}
                title={isOn ? t("toggleHide") : t("toggleShow")}
                className="card"
                style={{
                  padding: "20px 24px",
                  textAlign: "start",
                  border: isOn ? "1px solid var(--line)" : "1px dashed var(--line)",
                  background: isOn ? "var(--cream)" : "transparent",
                  cursor: "pointer",
                  opacity: isOn ? 1 : 0.55,
                  transition: "opacity 0.15s, border-color 0.15s",
                }}
              >
                <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12 }}>
                  <p className="eyebrow">{labels[m]}</p>
                  <span style={{ color: ACCENTS[m], opacity: 0.8 }}>{ICONS[m]}</span>
                </div>
                {isLoading ? (
                  <div className="skeleton" style={{ height: 32, width: 90, marginBottom: 8 }} />
                ) : (
                  <p style={{ fontSize: 28, fontWeight: 500, color: "var(--ink)", letterSpacing: "-0.03em", lineHeight: 1, marginBottom: 8, fontVariantNumeric: "tabular-nums" }}>
                    {formatNumber(item?.current ?? 0)}
                  </p>
                )}
                <DeltaBadge delta={item?.deltaPercent ?? null} previous={item?.previous ?? 0} t={t} />
              </button>
            );
          })}
        </div>

        {/* Chart */}
        <div className="card">
          <div className="card-header" style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div>
              <p className="eyebrow">{t("chartEyebrow")}</p>
              <h2 style={{ fontSize: 14, fontWeight: 500, color: "var(--ink)", marginTop: 4 }}>
                {t("chartTitle", { days: data?.days ?? days })}
              </h2>
            </div>
            <p style={{ fontSize: 11, color: "var(--ink-3)" }}>{t("chartHelp")}</p>
          </div>
          <div style={{ padding: 16 }}>
            <AnalyticsChart
              data={data?.series ?? []}
              metrics={enabledMetrics}
              labels={labels}
              isLoading={isLoading}
              emptyText={t("noData")}
              loadingText={t("loading")}
            />
          </div>
        </div>
      </main>
    </>
  );
}

function DeltaBadge({
  delta,
  previous,
  t,
}: {
  delta: number | null;
  previous: number;
  t: ReturnType<typeof useTranslations>;
}) {
  if (delta == null) {
    return (
      <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "var(--ink-3)" }}>
        <Minus style={{ width: 11, height: 11 }} />
        <span>{t("noPrevious")}</span>
      </div>
    );
  }
  const positive = delta > 0;
  const negative = delta < 0;
  const color = positive ? "var(--forest)" : negative ? "var(--terra)" : "var(--ink-3)";
  const Icon = positive ? ArrowUp : negative ? ArrowDown : Minus;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color }}>
      <Icon style={{ width: 11, height: 11 }} />
      <span style={{ fontWeight: 500, fontVariantNumeric: "tabular-nums" }}>
        {Math.abs(delta)}%
      </span>
      <span style={{ color: "var(--ink-3)" }}>
        {t("vsPrevious", { value: formatNumber(previous) })}
      </span>
    </div>
  );
}
