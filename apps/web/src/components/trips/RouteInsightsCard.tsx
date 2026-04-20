'use client';

import React from 'react';
import { Zap, TrendingUp, Route, Users } from 'lucide-react';

interface RouteInsights {
  route_slug: string;
  origin_city: string;
  destination_city: string;
  total_trips: number;
  avg_consumption_pct: number;
  avg_distance_km: number;
  avg_duration_min: number;
  min_consumption_pct: number;
  max_consumption_pct: number;
}

export function RouteInsightsCard({ insights }: { insights: RouteInsights }) {
  const avgHours = Math.floor((insights.avg_duration_min ?? 0) / 60);
  const avgMins = Math.round((insights.avg_duration_min ?? 0) % 60);

  return (
    <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-6 text-white">
      <div className="flex items-center gap-2 mb-4">
        <Route className="w-5 h-5 text-primary-400" />
        <h3 className="font-bold text-lg">
          {insights.origin_city} ← {insights.destination_city}
        </h3>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <StatBox
          icon={<Users className="w-4 h-4" />}
          value={insights.total_trips?.toString() ?? '0'}
          label="رحلة مسجلة"
          color="text-blue-400"
        />
        <StatBox
          icon={<Zap className="w-4 h-4" />}
          value={`${Math.round(insights.avg_consumption_pct ?? 0)}%`}
          label="متوسط الاستهلاك"
          color="text-primary-400"
        />
        <StatBox
          icon={<TrendingUp className="w-4 h-4" />}
          value={`${Math.round(insights.avg_distance_km ?? 0)} كم`}
          label="متوسط المسافة"
          color="text-purple-400"
        />
        <StatBox
          icon={<TrendingUp className="w-4 h-4" />}
          value={`${avgHours}س ${avgMins}د`}
          label="متوسط المدة"
          color="text-amber-400"
        />
      </div>

      {/* Consumption range */}
      <div className="bg-white/10 rounded-xl p-3">
        <p className="text-xs text-gray-400 mb-2">نطاق الاستهلاك</p>
        <div className="flex items-center gap-2">
          <span className="text-sm font-bold text-green-400">{insights.min_consumption_pct}%</span>
          <div className="flex-1 h-2 bg-white/20 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-green-400 to-red-400 rounded-full"
              style={{ width: `${insights.max_consumption_pct}%` }}
            />
          </div>
          <span className="text-sm font-bold text-red-400">{insights.max_consumption_pct}%</span>
        </div>
      </div>
    </div>
  );
}

function StatBox({
  icon, value, label, color,
}: {
  icon: React.ReactNode;
  value: string;
  label: string;
  color: string;
}) {
  return (
    <div className="bg-white/5 rounded-xl p-3">
      <div className={`flex items-center gap-1.5 mb-1 ${color}`}>
        {icon}
        <span className="text-xs">{label}</span>
      </div>
      <p className="text-xl font-bold text-white">{value}</p>
    </div>
  );
}

export default RouteInsightsCard;
