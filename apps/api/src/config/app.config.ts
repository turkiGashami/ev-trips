import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  apiPrefix: process.env.API_PREFIX || 'api',
  allowedOrigins: process.env.ALLOWED_ORIGINS || 'http://localhost:3000',
  throttleShortLimit: parseInt(process.env.THROTTLE_SHORT_LIMIT || '10', 10),
  throttleMediumLimit: parseInt(process.env.THROTTLE_MEDIUM_LIMIT || '50', 10),
  throttleLongLimit: parseInt(process.env.THROTTLE_LONG_LIMIT || '100', 10),
  appName: process.env.APP_NAME || 'EV Trips Community',
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:4000',
  emailVerificationRequired: process.env.EMAIL_VERIFICATION_REQUIRED !== 'false',
  defaultLanguage: process.env.DEFAULT_LANGUAGE || 'en',
  supportedLanguages: (process.env.SUPPORTED_LANGUAGES || 'en,ar').split(','),
  maxFileSize: parseInt(process.env.MAX_FILE_SIZE || String(10 * 1024 * 1024), 10), // 10MB
  maxFilesPerUpload: parseInt(process.env.MAX_FILES_PER_UPLOAD || '10', 10),
}));
