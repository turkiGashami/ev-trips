'use client';

import React from 'react';
import { Zap, Navigation, MapPin, ArrowDown } from 'lucide-react';
import { cn, formatDuration } from '../../lib/utils';

interface Stop {
  id: string;
  order: number;
  station_name: string;
  charger_type?: string;
  provider_name?: string;
  battery_before: number;
  battery_after: number;
  charging_duration_minutes?: number;
  cost_sar?: number;
  notes?: string;
  // segment data (leg BEFORE this stop)
  distance_from_prev_km?: number;
  duration_from_prev_minutes?: number;
}

interface TripTimelineProps {
  departureBattery: number;
  arrivalBattery: number;
  departureCity: string;
  destinationCity: string;
  stops: Stop[];
  distanceKm?: number;
  durationMinutes?: number;
}

function batteryColor(pct: number) {
  if (pct >= 50) return 'text-[var(--forest)]';
  if (pct >= 25) return 'text-[var(--ink)]';
  return 'text-[var(--terra)]';
}

function batteryBg(pct: number) {
  if (pct >= 50) return 'bg-[var(--forest)]';
  if (pct >= 25) return 'bg-[var(--ink)]/60';
  return 'bg-[var(--terra)]';
}

function SegmentConnector({
  distanceKm, durationMinutes, batteryDrop,
}: { distanceKm?: number; durationMinutes?: number; batteryDrop?: number }) {
  if (!distanceKm && !durationMinutes) return (
    <div className="ms-5 h-8 w-0.5 bg-[var(--line)]" />
  );
  return (
    <div className="ms-4 flex items-stretch gap-3 py-1">
      <div className="flex flex-col items-center">
        <div className="w-0.5 flex-1 bg-[var(--line)]" />
        <ArrowDown className="h-3 w-3 text-[var(--ink-3)] my-0.5 shrink-0" />
        <div className="w-0.5 flex-1 bg-[var(--line)]" />
      </div>
      <div className="flex items-center gap-4 py-2 px-3 bg-[var(--sand)]/60 border border-[var(--line)] rounded-[2px] text-xs text-[var(--ink-3)] nums-latin">
        {distanceKm != null && <span>{distanceKm} كم</span>}
        {durationMinutes != null && <span>{formatDuration(durationMinutes)}</span>}
        {batteryDrop !== undefined && batteryDrop > 0 && (
          <span className="text-[var(--terra)]">−{batteryDrop}%</span>
        )}
      </div>
    </div>
  );
}

function WaypointDot({ type }: { type: 'departure' | 'stop' | 'arrival' }) {
  if (type === 'departure') return (
    <div className="w-10 h-10 rounded-full bg-[var(--forest)] flex items-center justify-center shrink-0">
      <Navigation className="w-4 h-4 text-white" />
    </div>
  );
  if (type === 'arrival') return (
    <div className="w-10 h-10 rounded-full bg-[var(--terra)] flex items-center justify-center shrink-0">
      <MapPin className="w-4 h-4 text-white" />
    </div>
  );
  return (
    <div className="w-10 h-10 rounded-full bg-[var(--sand)] border-2 border-[var(--ink)] flex items-center justify-center shrink-0">
      <Zap className="w-4 h-4 text-[var(--ink)]" />
    </div>
  );
}

export function TripTimeline({
  departureBattery,
  arrivalBattery,
  departureCity,
  destinationCity,
  stops,
  distanceKm,
  durationMinutes,
}: TripTimelineProps) {
  const sorted = [...stops].sort((a, b) => a.order - b.order);

  // Distribute total distance/duration across segments if per-segment data is missing
  const totalLegs = sorted.length + 1;
  const autoSegmentKm = distanceKm ? Math.round(distanceKm / totalLegs) : undefined;
  const autoSegmentMin = durationMinutes ? Math.round(durationMinutes / totalLegs) : undefined;

  return (
    <div className="space-y-0">
      {/* Departure */}
      <div className="flex items-start gap-4">
        <WaypointDot type="departure" />
        <div className="flex-1 pt-1.5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-[var(--ink)] tracking-tight">{departureCity}</p>
              <p className="text-xs text-[var(--ink-3)] mt-0.5">نقطة الانطلاق</p>
            </div>
            <div className="text-end shrink-0">
              <div className={cn('text-xl font-medium nums-latin', batteryColor(departureBattery))}>
                {departureBattery}%
              </div>
              <p className="text-[10px] text-[var(--ink-3)]">البطارية</p>
            </div>
          </div>
          <div className="mt-2 h-1 bg-[var(--line)] rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full', batteryBg(departureBattery))} style={{ width: `${departureBattery}%` }} />
          </div>
        </div>
      </div>

      {sorted.length === 0 && (
        <SegmentConnector distanceKm={distanceKm} durationMinutes={durationMinutes} batteryDrop={departureBattery - arrivalBattery} />
      )}

      {/* Stops */}
      {sorted.map((stop, idx) => {
        const prevBattery = idx === 0 ? departureBattery : sorted[idx - 1].battery_after;
        const segKm = stop.distance_from_prev_km ?? autoSegmentKm;
        const segMin = stop.duration_from_prev_minutes ?? autoSegmentMin;

        return (
          <React.Fragment key={stop.id}>
            <SegmentConnector
              distanceKm={segKm}
              durationMinutes={segMin}
              batteryDrop={prevBattery - stop.battery_before}
            />

            <div className="flex items-start gap-4">
              <WaypointDot type="stop" />
              <div className="flex-1 min-w-0 border border-[var(--line)] bg-[var(--sand)]/30 p-4 rounded-[2px]">
                {/* Stop header */}
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--ink)] text-sm tracking-tight truncate">{stop.station_name}</p>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      {stop.charger_type && (
                        <span className="text-[10px] font-medium px-2 py-0.5 bg-[var(--ink)] text-[var(--cream)] rounded-[2px]">
                          {stop.charger_type}
                        </span>
                      )}
                      {stop.provider_name && (
                        <span className="text-[10px] text-[var(--ink-3)]">{stop.provider_name}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-[10px] text-[var(--ink-3)] shrink-0 nums-latin">محطة {stop.order}</span>
                </div>

                {/* Battery bar */}
                <div className="flex items-center gap-2 mb-3">
                  <span className={cn('text-sm font-medium nums-latin shrink-0', batteryColor(stop.battery_before))}>
                    {stop.battery_before}%
                  </span>
                  <div className="flex-1 relative h-1.5 bg-[var(--line)] rounded-full overflow-hidden">
                    <div className={cn('absolute inset-y-0 start-0 rounded-full', batteryBg(stop.battery_before))}
                         style={{ width: `${stop.battery_before}%` }} />
                    <div className="absolute inset-y-0 start-0 rounded-full bg-[var(--forest)] transition-all"
                         style={{ width: `${stop.battery_after}%` }} />
                  </div>
                  <span className={cn('text-sm font-medium nums-latin shrink-0', batteryColor(stop.battery_after))}>
                    {stop.battery_after}%
                  </span>
                </div>
                <p className="text-[10px] text-[var(--ink-3)] mb-3">
                  شحن +{stop.battery_after - stop.battery_before}%
                </p>

                {/* Stop stats */}
                <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs border-t border-[var(--line)] pt-3">
                  {stop.charging_duration_minutes && (
                    <div>
                      <span className="text-[var(--ink-3)]">مدة الشحن  </span>
                      <span className="text-[var(--ink)] font-medium nums-latin">{formatDuration(stop.charging_duration_minutes)}</span>
                    </div>
                  )}
                  {stop.cost_sar !== undefined && (
                    <div>
                      <span className="text-[var(--ink-3)]">التكلفة  </span>
                      <span className="text-[var(--ink)] font-medium nums-latin">{stop.cost_sar} ر.س</span>
                    </div>
                  )}
                </div>
                {stop.notes && (
                  <p className="text-xs text-[var(--ink-3)] mt-3 border-t border-[var(--line)] pt-3">{stop.notes}</p>
                )}
              </div>
            </div>
          </React.Fragment>
        );
      })}

      {/* Last segment connector (last stop → arrival) */}
      {sorted.length > 0 && (() => {
        const last = sorted[sorted.length - 1];
        const segKm = autoSegmentKm;
        const segMin = autoSegmentMin;
        return (
          <SegmentConnector
            distanceKm={segKm}
            durationMinutes={segMin}
            batteryDrop={last.battery_after - arrivalBattery}
          />
        );
      })()}

      {/* Arrival */}
      <div className="flex items-start gap-4">
        <WaypointDot type="arrival" />
        <div className="flex-1 pt-1.5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-medium text-[var(--ink)] tracking-tight">{destinationCity}</p>
              <p className="text-xs text-[var(--ink-3)] mt-0.5">الوصول</p>
            </div>
            <div className="text-end shrink-0">
              <div className={cn('text-xl font-medium nums-latin', batteryColor(arrivalBattery))}>
                {arrivalBattery}%
              </div>
              <p className="text-[10px] text-[var(--ink-3)]">متبقي</p>
            </div>
          </div>
          <div className="mt-2 h-1 bg-[var(--line)] rounded-full overflow-hidden">
            <div className={cn('h-full rounded-full', batteryBg(arrivalBattery))} style={{ width: `${arrivalBattery}%` }} />
          </div>
        </div>
      </div>
    </div>
  );
}

export default TripTimeline;
