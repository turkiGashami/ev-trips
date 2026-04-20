'use client';

import React from 'react';
import { Zap, MapPin, Clock, Navigation } from 'lucide-react';
import { cn, batteryColor, batteryBgColor, formatDuration } from '../../lib/utils';

interface BatteryStatsProps {
  departureBattery: number;
  arrivalBattery: number;
  distanceKm?: number;
  durationMinutes?: number;
  stopCount: number;
  estimatedRangeDeparture?: number;
  remainingRangeArrival?: number;
}

export function BatteryStats({
  departureBattery,
  arrivalBattery,
  distanceKm,
  durationMinutes,
  stopCount,
  estimatedRangeDeparture,
  remainingRangeArrival,
}: BatteryStatsProps) {
  const consumed = departureBattery - arrivalBattery;

  return (
    <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-2xl p-5 text-white">
      {/* Main battery visual */}
      <div className="flex items-center gap-4 mb-4">
        <div className="flex flex-col items-center gap-1">
          <div className={cn('text-2xl font-bold', 'text-emerald-400')}>
            {departureBattery}%
          </div>
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <Navigation className="w-3 h-3" />
            بداية
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-2">
          <div className="relative h-4 bg-gray-700 rounded-full overflow-hidden">
            {/* departure level */}
            <div
              className="absolute start-0 top-0 h-full bg-emerald-500/30 rounded-full"
              style={{ width: `${departureBattery}%` }}
            />
            {/* arrival level */}
            <div
              className={cn('absolute start-0 top-0 h-full rounded-full transition-all', batteryBgColor(arrivalBattery))}
              style={{ width: `${arrivalBattery}%` }}
            />
            {/* consumed indicator */}
            <div
              className="absolute start-0 top-0 h-full bg-red-500/20"
              style={{ width: `${departureBattery}%`, marginInlineStart: `${arrivalBattery}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-400">
            <span>↑ أُستهلك {consumed}%</span>
            {distanceKm && <span>{distanceKm} كم</span>}
          </div>
        </div>

        <div className="flex flex-col items-center gap-1">
          <div className={cn('text-2xl font-bold', batteryColor(arrivalBattery))}>
            {arrivalBattery}%
          </div>
          <div className="text-xs text-gray-400 flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            وصول
          </div>
        </div>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gray-700">
        {durationMinutes && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-blue-400 mb-1">
              <Clock className="w-4 h-4" />
            </div>
            <div className="font-semibold">{formatDuration(durationMinutes)}</div>
            <div className="text-xs text-gray-400">المدة</div>
          </div>
        )}

        <div className="text-center">
          <div className="flex items-center justify-center gap-1 text-amber-400 mb-1">
            <Zap className="w-4 h-4" />
          </div>
          <div className="font-semibold">{stopCount}</div>
          <div className="text-xs text-gray-400">
            {stopCount === 0 ? 'بلا شحن' : 'توقف'}
          </div>
        </div>

        {distanceKm && (
          <div className="text-center">
            <div className="flex items-center justify-center gap-1 text-green-400 mb-1">
              <MapPin className="w-4 h-4" />
            </div>
            <div className="font-semibold">{distanceKm}</div>
            <div className="text-xs text-gray-400">كيلومتر</div>
          </div>
        )}
      </div>

      {/* Range info */}
      {(estimatedRangeDeparture || remainingRangeArrival) && (
        <div className="flex justify-between mt-3 pt-3 border-t border-gray-700 text-xs text-gray-400">
          {estimatedRangeDeparture && (
            <span>مدى عند الانطلاق: <span className="text-white">{estimatedRangeDeparture} كم</span></span>
          )}
          {remainingRangeArrival && (
            <span>مدى عند الوصول: <span className="text-white">{remainingRangeArrival} كم</span></span>
          )}
        </div>
      )}
    </div>
  );
}

export default BatteryStats;
