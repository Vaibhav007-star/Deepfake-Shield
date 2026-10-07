import multer from 'multer';
import { Request } from 'express';
import { env } from '../config/env';

// Allowed MIME types across images, video, and audio
const ALLOWED_MIME_TYPES = new Set([
  // Images
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/tiff',
  'image/svg+xml',
  // Videos
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-msvideo',
  'video/mpeg',
  // Audio
  'audio/mpeg',
  'audio/mp3',
  'audio/wav',
  'audio/x-wav',
  'audio/ogg',
  'audio/mp4',
  'audio/webm',
  'audio/flac',
  'audio/aac',
]);

const fileFilter = (
  _req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
    cb(null, true);
  } else {
    const error: any = new Error(
      `Unsupported media type: '${file.mimetype}'. Supported formats: Images (JPEG, PNG, WebP, GIF), Videos (MP4, WebM, MOV), Audio (MP3, WAV, OGG, FLAC, AAC).`
    );
    error.statusCode = 400;
    error.code = 'INVALID_MEDIA_TYPE';
    cb(error);
  }
};

// Use memoryStorage for direct streaming to crypto & IPFS, preventing local disk pollution
const storage = multer.memoryStorage();

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: env.MAX_FILE_SIZE_MB * 1024 * 1024,
    files: 1,
  },
  fileFilter,
});

/**
 * Sanitizes an untrusted filename to prevent path traversal or injection.
 */
export function sanitizeFilename(filename: string): string {
  return filename
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .replace(/\.{2,}/g, '.')
    .substring(0, 150);
}
