export type BatteryLevel = 'high' | 'medium' | 'low' | 'critical';

export function getBatteryLevel(percentage: number): BatteryLevel {
  if (percentage > 60) return 'high';
  if (percentage > 30) return 'medium';
  if (percentage > 10) return 'low';
  return 'critical';
}

export function getBatteryColor(percentage: number): string {
  const level = getBatteryLevel(percentage);
  return {
    high: '#10B981',     // emerald-500
    medium: '#F59E0B',   // amber-400
    low: '#EF4444',      // red-500
    critical: '#DC2626', // red-600
  }[level];
}

export function getBatteryLabel(percentage: number, lang: 'ar' | 'en' = 'ar'): string {
  const level = getBatteryLevel(percentage);
  const labels = {
    ar: { high: 'ممتاز', medium: 'جيد', low: 'منخفض', critical: 'حرج' },
    en: { high: 'Great', medium: 'Good', low: 'Low', critical: 'Critical' },
  };
  return labels[lang][level];
}

export function calcConsumptionRate(
  departurePct: number,
  arrivalPct: number,
  distanceKm: number,
  batteryCapacityKwh: number,
): number | null {
  if (!distanceKm || !batteryCapacityKwh) return null;
  const consumed = ((departurePct - arrivalPct) / 100) * batteryCapacityKwh;
  return Math.round((consumed / distanceKm) * 100) / 100; // kWh/100km
}
