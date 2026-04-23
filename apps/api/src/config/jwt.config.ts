import { registerAs } from '@nestjs/config';

/**
 * Known dev-only placeholders. If the environment still holds one of these in
 * production, the app refuses to boot so we never sign tokens with a secret
 * that is effectively public.
 */
const PLACEHOLDERS = {
  JWT_SECRET: 'ev-trips-super-secret-jwt-key-change-in-production',
  JWT_REFRESH_SECRET: 'ev-trips-super-secret-refresh-key-change-in-production',
  JWT_EMAIL_VERIFICATION_SECRET: 'ev-trips-email-verification-secret',
  JWT_PASSWORD_RESET_SECRET: 'ev-trips-password-reset-secret',
} as const;

function resolveSecret(name: keyof typeof PLACEHOLDERS): string {
  const placeholder = PLACEHOLDERS[name];
  const value = process.env[name];
  const isPlaceholder = !value || value === placeholder;

  if (process.env.NODE_ENV === 'production' && isPlaceholder) {
    throw new Error(
      `[jwt.config] ${name} must be set to a secure random value in production ` +
        `(current value is missing or matches the well-known dev placeholder).`,
    );
  }

  return value ?? placeholder;
}

export default registerAs('jwt', () => ({
  secret: resolveSecret('JWT_SECRET'),
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshSecret: resolveSecret('JWT_REFRESH_SECRET'),
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  emailVerificationSecret: resolveSecret('JWT_EMAIL_VERIFICATION_SECRET'),
  emailVerificationExpiresIn: process.env.JWT_EMAIL_VERIFICATION_EXPIRES_IN || '24h',
  passwordResetSecret: resolveSecret('JWT_PASSWORD_RESET_SECRET'),
  passwordResetExpiresIn: process.env.JWT_PASSWORD_RESET_EXPIRES_IN || '1h',
}));
