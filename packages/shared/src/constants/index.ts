export const APP_NAME = 'EV Trips Community';
export const APP_NAME_AR = 'مجتمع رحلات EV';

export const SAUDI_CITIES = [
  { id: 'riyadh', name: 'Riyadh', name_ar: 'الرياض', slug: 'riyadh' },
  { id: 'jeddah', name: 'Jeddah', name_ar: 'جدة', slug: 'jeddah' },
  { id: 'dammam', name: 'Dammam', name_ar: 'الدمام', slug: 'dammam' },
  { id: 'mecca', name: 'Mecca', name_ar: 'مكة المكرمة', slug: 'mecca' },
  { id: 'madinah', name: 'Madinah', name_ar: 'المدينة المنورة', slug: 'madinah' },
  { id: 'khobar', name: 'Al Khobar', name_ar: 'الخبر', slug: 'khobar' },
  { id: 'abha', name: 'Abha', name_ar: 'أبها', slug: 'abha' },
  { id: 'tabuk', name: 'Tabuk', name_ar: 'تبوك', slug: 'tabuk' },
  { id: 'taif', name: 'Taif', name_ar: 'الطائف', slug: 'taif' },
  { id: 'yanbu', name: 'Yanbu', name_ar: 'ينبع', slug: 'yanbu' },
  { id: 'jubail', name: 'Jubail', name_ar: 'الجبيل', slug: 'jubail' },
  { id: 'qassim', name: 'Al Qassim', name_ar: 'القصيم', slug: 'qassim' },
];

export const CHARGER_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  ac_level1: { ar: 'AC مستوى 1', en: 'AC Level 1' },
  ac_level2: { ar: 'AC مستوى 2', en: 'AC Level 2' },
  dc_fast: { ar: 'DC سريع', en: 'DC Fast' },
  supercharger: { ar: 'سوبرتشارجر', en: 'Supercharger' },
  ccs: { ar: 'CCS', en: 'CCS' },
  chademo: { ar: 'CHAdeMO', en: 'CHAdeMO' },
  type2: { ar: 'Type 2', en: 'Type 2' },
};

export const WEATHER_LABELS: Record<string, { ar: string; en: string }> = {
  sunny: { ar: 'مشمس', en: 'Sunny' },
  cloudy: { ar: 'غائم', en: 'Cloudy' },
  rainy: { ar: 'ممطر', en: 'Rainy' },
  foggy: { ar: 'ضبابي', en: 'Foggy' },
  windy: { ar: 'عاصف', en: 'Windy' },
  extreme_heat: { ar: 'حر شديد', en: 'Extreme Heat' },
  cold: { ar: 'بارد', en: 'Cold' },
  sandstorm: { ar: 'عاصفة رملية', en: 'Sandstorm' },
};

export const DRIVING_STYLE_LABELS: Record<string, { ar: string; en: string }> = {
  eco: { ar: 'اقتصادي', en: 'Eco' },
  calm: { ar: 'هادئ', en: 'Calm' },
  normal: { ar: 'عادي', en: 'Normal' },
  sporty: { ar: 'رياضي', en: 'Sporty' },
  aggressive: { ar: 'قوي', en: 'Aggressive' },
};

export const AC_USAGE_LABELS: Record<string, { ar: string; en: string }> = {
  off: { ar: 'مطفأ', en: 'Off' },
  partial: { ar: 'جزئي', en: 'Partial' },
  full: { ar: 'كامل', en: 'Full' },
};

export const LUGGAGE_LEVEL_LABELS: Record<string, { ar: string; en: string }> = {
  none: { ar: 'بلا أمتعة', en: 'None' },
  light: { ar: 'خفيف', en: 'Light' },
  medium: { ar: 'متوسط', en: 'Medium' },
  heavy: { ar: 'ثقيل', en: 'Heavy' },
  full: { ar: 'محمل بالكامل', en: 'Full Load' },
};

export const PAGINATION_DEFAULT_LIMIT = 20;
export const MAX_TRIP_MEDIA = 10;
export const MAX_AVATAR_SIZE_MB = 5;
export const MAX_MEDIA_SIZE_MB = 10;
