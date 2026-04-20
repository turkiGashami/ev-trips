import { registerAs } from '@nestjs/config';

export default registerAs('jwt', () => ({
  secret: process.env.JWT_SECRET || 'ev-trips-super-secret-jwt-key-change-in-production',
  expiresIn: process.env.JWT_EXPIRES_IN || '15m',
  refreshSecret: process.env.JWT_REFRESH_SECRET || 'ev-trips-super-secret-refresh-key-change-in-production',
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  emailVerificationSecret: process.env.JWT_EMAIL_VERIFICATION_SECRET || 'ev-trips-email-verification-secret',
  emailVerificationExpiresIn: process.env.JWT_EMAIL_VERIFICATION_EXPIRES_IN || '24h',
  passwordResetSecret: process.env.JWT_PASSWORD_RESET_SECRET || 'ev-trips-password-reset-secret',
  passwordResetExpiresIn: process.env.JWT_PASSWORD_RESET_EXPIRES_IN || '1h',
}));
