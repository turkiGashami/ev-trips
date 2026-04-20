import { TrendingUp, TrendingDown, Minus } from "lucide-react";
import { formatNumber, safeFixed } from "@/lib/format";

interface StatsCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ReactNode;
  growthPercent?: number;
  accentColor?: string;
  isLoading?: boolean;
}

export function StatsCard({
  title, value, subtitle, icon,
  growthPercent,
  accentColor = 'var(--forest)',
  isLoading = false,
}: StatsCardProps) {
  const isPositive = growthPercent !== undefined && growthPercent > 0;
  const isNegative = growthPercent !== undefined && growthPercent < 0;
  const growthColor = isPositive ? 'var(--forest)' : isNegative ? 'var(--terra)' : 'var(--ink-3)';

  return (
    <div className="card" style={{ padding: '20px 24px' }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 16 }}>
        <p className="eyebrow">{title}</p>
        <span style={{ color: accentColor, opacity: 0.7 }}>{icon}</span>
      </div>

      {isLoading ? (
        <div className="skeleton" style={{ height: 36, width: 100, marginBottom: 12 }} />
      ) : (
        <p style={{ fontSize: 'clamp(1.75rem, 3vw, 2.25rem)', fontWeight: 500, letterSpacing: '-0.03em', color: 'var(--ink)', lineHeight: 1, marginBottom: 10, fontVariantNumeric: 'tabular-nums' }}>
          {typeof value === "number" ? formatNumber(value) : value}
        </p>
      )}

      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        {growthPercent !== undefined && (
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 3, fontSize: 11, fontWeight: 500, color: growthColor }}>
            {isPositive ? <TrendingUp style={{ width: 12, height: 12 }} />
              : isNegative ? <TrendingDown style={{ width: 12, height: 12 }} />
              : <Minus style={{ width: 12, height: 12 }} />}
            {safeFixed(Math.abs(growthPercent), 1)}%
          </span>
        )}
        {subtitle && <span style={{ fontSize: 11, color: 'var(--ink-4)' }}>{subtitle}</span>}
      </div>
    </div>
  );
}
