"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import type { AnalyticsSeriesPoint, AnalyticsMetricKey } from "@/types/admin.types";
import { formatNumber, safeFixed } from "@/lib/format";

const METRIC_COLORS: Record<AnalyticsMetricKey, string> = {
  users:    "#3b82f6", // blue
  trips:    "#10b981", // emerald
  comments: "#a855f7", // violet
  vehicles: "#f59e0b", // amber
};

interface Props {
  data: AnalyticsSeriesPoint[];
  metrics: AnalyticsMetricKey[];
  labels: Record<AnalyticsMetricKey, string>;
  isLoading?: boolean;
  emptyText?: string;
  loadingText?: string;
}

const CustomTooltip = ({
  active,
  payload,
  label,
  labels,
}: {
  active?: boolean;
  payload?: Array<{ color: string; name: string; value: number; dataKey: string }>;
  label?: string;
  labels: Record<string, string>;
}) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "var(--ink)",
        color: "var(--cream)",
        border: "1px solid var(--ink-2)",
        borderRadius: 4,
        padding: "8px 12px",
        fontSize: 11,
        boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
      }}
    >
      <p style={{ marginBottom: 6, color: "var(--ink-4)", fontWeight: 500 }}>{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
          <span style={{ width: 8, height: 8, borderRadius: "50%", background: entry.color, flexShrink: 0 }} />
          <span style={{ flex: 1 }}>{labels[entry.dataKey] ?? entry.name}:</span>
          <span style={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
            {formatNumber(entry.value)}
          </span>
        </div>
      ))}
    </div>
  );
};

export function AnalyticsChart({
  data,
  metrics,
  labels,
  isLoading = false,
  emptyText = "No data",
  loadingText = "Loading…",
}: Props) {
  if (isLoading) {
    return (
      <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)", fontSize: 13 }}>
        {loadingText}
      </div>
    );
  }
  if (!data.length) {
    return (
      <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--ink-3)", fontSize: 13 }}>
        {emptyText}
      </div>
    );
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data} margin={{ top: 8, right: 8, left: -12, bottom: 8 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--line)" vertical={false} />
        <XAxis
          dataKey="date"
          tick={{ fill: "var(--ink-3)", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          interval="preserveStartEnd"
          minTickGap={32}
          tickFormatter={(v: string) => {
            // Show MM-DD; recharts hands us the raw date string.
            const parts = v.split("-");
            return parts.length === 3 ? `${parts[1]}-${parts[2]}` : v;
          }}
        />
        <YAxis
          tick={{ fill: "var(--ink-3)", fontSize: 10 }}
          axisLine={false}
          tickLine={false}
          tickFormatter={(v: number) => (v >= 1000 ? `${safeFixed(v / 1000, 1)}k` : String(v))}
          allowDecimals={false}
        />
        <Tooltip content={<CustomTooltip labels={labels} />} />
        <Legend
          wrapperStyle={{ fontSize: 11, paddingTop: 8 }}
          formatter={(value: string) => (
            <span style={{ color: "var(--ink-2)" }}>
              {(labels as Record<string, string>)[value] ?? value}
            </span>
          )}
        />
        {metrics.map((m) => (
          <Line
            key={m}
            type="monotone"
            dataKey={m}
            stroke={METRIC_COLORS[m]}
            strokeWidth={2}
            dot={false}
            activeDot={{ r: 4, fill: METRIC_COLORS[m], strokeWidth: 0 }}
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
