import { registerAs } from '@nestjs/config';

export default registerAs('storage', () => ({
  provider: process.env.STORAGE_PROVIDER || 's3', // 's3' | 'local'
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || '',
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || '',
    region: process.env.AWS_REGION || 'us-east-1',
    bucket: process.env.AWS_S3_BUCKET || 'ev-trips-community',
    endpoint: process.env.AWS_S3_ENDPOINT || undefined, // For MinIO or custom S3
    cdnUrl: process.env.AWS_CDN_URL || '',
  },
  local: {
    uploadDir: process.env.LOCAL_UPLOAD_DIR || './uploads',
    serveUrl: process.env.LOCAL_SERVE_URL || 'http://localhost:3000/uploads',
  },
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'video/mp4',
    'video/webm',
    'application/pdf',
  ],
  maxFileSizeMb: parseInt(process.env.MAX_FILE_SIZE_MB || '10', 10),
}));
