'use client';

import React from 'react';
import { cn } from '../../lib/utils';

interface BatteryIndicatorProps {
  percentage: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

export function BatteryIndicator({
  percentage,
  size = 'md',
  showLabel = true,
  className,
}: BatteryIndicatorProps) {
  const clampedPct = Math.min(100, Math.max(0, percentage));

  const color =
    clampedPct > 60
      ? 'bg-emerald-500'
      : clampedPct > 30
      ? 'bg-amber-400'
      : 'bg-red-500';

  const textColor =
    clampedPct > 60
      ? 'text-emerald-600'
      : clampedPct > 30
      ? 'text-amber-500'
      : 'text-red-500';

  const sizes = {
    sm: { battery: 'w-8 h-4', nub: 'w-1 h-2', text: 'text-xs' },
    md: { battery: 'w-12 h-6', nub: 'w-1.5 h-3', text: 'text-sm' },
    lg: { battery: 'w-16 h-8', nub: 'w-2 h-4', text: 'text-base' },
  };

  const { battery, nub, text } = sizes[size];

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex items-center">
        <div className={cn('relative border-2 border-gray-400 rounded-sm', battery)}>
          <div
            className={cn('absolute inset-0.5 rounded-sm transition-all duration-300', color)}
            style={{ width: `${clampedPct}%` }}
          />
        </div>
        <div className={cn('bg-gray-400 rounded-e-sm', nub)} />
      </div>
      {showLabel && (
        <span className={cn('font-semibold tabular-nums', text, textColor)}>
          {clampedPct}%
        </span>
      )}
    </div>
  );
}

interface BatteryRangeProps {
  departure: number;
  arrival: number;
  className?: string;
}

export function BatteryRange({ departure, arrival, className }: BatteryRangeProps) {
  const arrivalColor =
    arrival > 60 ? 'text-emerald-600' : arrival > 30 ? 'text-amber-500' : 'text-red-500';
  const arrivalBg =
    arrival > 60 ? 'bg-emerald-500' : arrival > 30 ? 'bg-amber-400' : 'bg-red-500';

  return (
    <div className={cn('flex flex-col gap-1', className)}>
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
        <span>{departure}%</span>
        <span className={arrivalColor}>{arrival}%</span>
      </div>
      <div className="relative h-2 bg-gray-200 rounded-full overflow-hidden">
        {/* Full bar background */}
        <div
          className="absolute start-0 top-0 h-full bg-emerald-200 rounded-full"
          style={{ width: `${departure}%` }}
        />
        {/* Consumed portion */}
        <div
          className={cn('absolute start-0 top-0 h-full rounded-full', arrivalBg)}
          style={{ width: `${arrival}%` }}
        />
      </div>
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-400">بداية الرحلة</span>
        <span className="text-xs text-gray-400">نهاية الرحلة</span>
      </div>
    </div>
  );
}

export default BatteryIndicator;
