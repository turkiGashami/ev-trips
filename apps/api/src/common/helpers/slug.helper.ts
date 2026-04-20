import slugify from 'slugify';
import { v4 as uuidv4 } from 'uuid';

export function generateSlug(text: string, unique: boolean = false): string {
  const slug = slugify(text, {
    lower: true,
    strict: true,
    locale: 'en',
    trim: true,
  });

  if (unique) {
    const suffix = uuidv4().split('-')[0]; // Short 8-char suffix
    return `${slug}-${suffix}`;
  }

  return slug;
}

export function generateUniqueSlug(text: string): string {
  return generateSlug(text, true);
}

export function isValidSlug(slug: string): boolean {
  return /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
}

export function sanitizeForSlug(text: string): string {
  // Handle Arabic and other RTL characters by transliterating
  return text
    .replace(/[\u0600-\u06FF]/g, '') // Remove Arabic characters
    .replace(/[^\w\s-]/g, '')
    .trim();
}
