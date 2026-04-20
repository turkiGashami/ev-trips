import { ar } from './ar';
import { en } from './en';

export type Language = 'ar' | 'en';

const translations = { ar, en };

let currentLang: Language = 'ar';

export function setLanguage(lang: Language) {
  currentLang = lang;
}

export function t(key: string): string {
  const keys = key.split('.');
  let result: any = translations[currentLang];
  for (const k of keys) {
    result = result?.[k];
    if (result === undefined) break;
  }
  return result ?? key;
}

export { ar, en };
