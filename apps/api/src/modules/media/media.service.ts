import { Injectable, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/gif'];
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/quicktime'];
const MAX_IMAGE_SIZE_MB = 10;
const MAX_VIDEO_SIZE_MB = 50;

export interface UploadResult {
  url: string;
  key: string;
  mimeType: string;
  sizeBytes: number;
}

@Injectable()
export class MediaService {
  private s3: S3Client;
  private bucket: string;
  private cdnBase: string;

  constructor(private config: ConfigService) {
    this.s3 = new S3Client({
      region: config.get('AWS_REGION', 'us-east-1'),
      credentials: {
        accessKeyId: config.get('AWS_ACCESS_KEY_ID', ''),
        secretAccessKey: config.get('AWS_SECRET_ACCESS_KEY', ''),
      },
      ...(config.get('AWS_ENDPOINT')
        ? { endpoint: config.get('AWS_ENDPOINT'), forcePathStyle: true }
        : {}),
    });
    this.bucket = config.get('AWS_S3_BUCKET', 'ev-trips-media');
    this.cdnBase = config.get('CDN_BASE_URL', `https://${this.bucket}.s3.amazonaws.com`);
  }

  validateFile(
    file: Express.Multer.File,
    type: 'image' | 'video' | 'any' | string[] = 'image',
    _maxMbOverride?: number,
  ): void {
    const allowedTypes = Array.isArray(type)
      ? type
      : type === 'image'
      ? ALLOWED_IMAGE_TYPES
      : type === 'video'
      ? ALLOWED_VIDEO_TYPES
      : [...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES];

    if (!allowedTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `File type not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      );
    }

    const maxSizeMB = _maxMbOverride
      ?? (ALLOWED_VIDEO_TYPES.includes(file.mimetype) ? MAX_VIDEO_SIZE_MB : MAX_IMAGE_SIZE_MB);
    const maxSizeBytes = maxSizeMB * 1024 * 1024;

    if (file.size > maxSizeBytes) {
      throw new BadRequestException(
        `File too large. Maximum size is ${maxSizeMB}MB`,
      );
    }
  }

  /** Alias for uploadToS3 — used by controllers */
  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    const result = await this.uploadToS3(file, folder);
    return result.url;
  }

  async uploadToS3(
    file: Express.Multer.File,
    folder: string,
  ): Promise<UploadResult> {
    this.validateFile(file, 'any');

    const ext = path.extname(file.originalname).toLowerCase();
    const key = `${folder}/${uuidv4()}${ext}`;

    await this.s3.send(
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        CacheControl: 'max-age=31536000',
      }),
    );

    return {
      url: `${this.cdnBase}/${key}`,
      key,
      mimeType: file.mimetype,
      sizeBytes: file.size,
    };
  }

  async deleteFromS3(key: string): Promise<void> {
    await this.s3.send(
      new DeleteObjectCommand({ Bucket: this.bucket, Key: key }),
    );
  }

  async generatePresignedUploadUrl(
    folder: string,
    filename: string,
    contentType: string,
    expiresInSeconds = 300,
  ): Promise<{ presignedUrl: string; key: string; publicUrl: string }> {
    if (![...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].includes(contentType)) {
      throw new BadRequestException('Content type not allowed');
    }

    const ext = path.extname(filename).toLowerCase();
    const key = `${folder}/${uuidv4()}${ext}`;

    const presignedUrl = await getSignedUrl(
      this.s3,
      new PutObjectCommand({
        Bucket: this.bucket,
        Key: key,
        ContentType: contentType,
      }),
      { expiresIn: expiresInSeconds },
    );

    return {
      presignedUrl,
      key,
      publicUrl: `${this.cdnBase}/${key}`,
    };
  }

  extractKeyFromUrl(url: string): string {
    return url.replace(`${this.cdnBase}/`, '');
  }
}
