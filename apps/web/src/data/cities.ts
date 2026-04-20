export interface CityOption {
  id: string;
  nameAr: string;
  nameEn: string;
  aliases: string[];
}

export const SAUDI_CITIES: CityOption[] = [
  { id: 'riyadh',   nameAr: 'الرياض',            nameEn: 'Riyadh',          aliases: ['ar riyadh', 'arriyad', 'riyad'] },
  { id: 'jeddah',   nameAr: 'جدة',               nameEn: 'Jeddah',          aliases: ['jiddah', 'jedda', 'jidda'] },
  { id: 'makkah',   nameAr: 'مكة المكرمة',        nameEn: 'Makkah',          aliases: ['مكة', 'مكه', 'mecca', 'mekka', 'makka'] },
  { id: 'madinah',  nameAr: 'المدينة المنورة',    nameEn: 'Madinah',         aliases: ['المدينة', 'medina', 'al madinah', 'medinah'] },
  { id: 'dammam',   nameAr: 'الدمام',             nameEn: 'Dammam',          aliases: ['ad dammam'] },
  { id: 'khobar',   nameAr: 'الخبر',              nameEn: 'Al Khobar',       aliases: ['khobar', 'al-khobar'] },
  { id: 'ahsa',     nameAr: 'الأحساء',            nameEn: 'Al-Ahsa',         aliases: ['hofuf', 'ahsa', 'al hasa', 'al-hasa', 'hufuf'] },
  { id: 'taif',     nameAr: 'الطائف',             nameEn: 'Taif',            aliases: ['at taif', 'at-taif'] },
  { id: 'tabuk',    nameAr: 'تبوك',               nameEn: 'Tabuk',           aliases: [] },
  { id: 'abha',     nameAr: 'أبها',               nameEn: 'Abha',            aliases: [] },
  { id: 'qassim',   nameAr: 'القصيم',             nameEn: 'Qassim',          aliases: ['buraydah', 'buraidah', 'unaizah'] },
  { id: 'hail',     nameAr: 'حائل',               nameEn: 'Hail',            aliases: ["ha'il"] },
  { id: 'yanbu',    nameAr: 'ينبع',               nameEn: 'Yanbu',           aliases: ['yenbo', 'yanbou'] },
  { id: 'jubail',   nameAr: 'الجبيل',             nameEn: 'Jubail',          aliases: ['al jubail', 'al-jubail'] },
  { id: 'khamis',   nameAr: 'خميس مشيط',          nameEn: 'Khamis Mushait',  aliases: ['khamis', 'khamis-mushait'] },
  { id: 'najran',   nameAr: 'نجران',              nameEn: 'Najran',          aliases: [] },
  { id: 'jazan',    nameAr: 'جازان',              nameEn: 'Jazan',           aliases: ['jizan', 'gizan'] },
  { id: 'qatif',    nameAr: 'القطيف',             nameEn: 'Qatif',           aliases: ['al qatif'] },
  { id: 'arar',     nameAr: 'عرعر',               nameEn: 'Arar',            aliases: [] },
  { id: 'sakaka',   nameAr: 'سكاكا',              nameEn: 'Sakaka',          aliases: ['al jouf', 'aljouf'] },
  { id: 'bisha',    nameAr: 'بيشة',               nameEn: 'Bisha',           aliases: [] },
  { id: 'wajh',     nameAr: 'الوجه',              nameEn: 'Al Wajh',         aliases: ['wajh'] },
  { id: 'dhahran',  nameAr: 'الظهران',            nameEn: 'Dhahran',         aliases: ['az zahran'] },
];

export function searchCities(query: string): CityOption[] {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return SAUDI_CITIES.filter(
    (c) =>
      c.nameAr.includes(q) ||
      c.nameEn.toLowerCase().includes(q) ||
      c.aliases.some((a) => a.toLowerCase().includes(q)),
  );
}
