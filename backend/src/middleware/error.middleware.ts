import { Request, Response, NextFunction } from 'express';
import multer from 'multer';
import { logger } from '../utils/logger';
import { ApiResponse } from '../types/provenance';
import { env } from '../config/env';

export function errorHandler(
  err: any,
  req: Request,
  res: Response<ApiResponse>,
  _next: NextFunction
): void {
  logger.error('Unhandled request error occurred', {
    path: req.path,
    method: req.method,
    message: err.message,
  });

  // Handle Multer file limit errors
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(413).json({
        success: false,
        error: {
          code: 'FILE_TOO_LARGE',
          message: `File exceeds maximum allowed limit of ${env.MAX_FILE_SIZE_MB}MB.`,
        },
      });
      return;
    }

    res.status(400).json({
      success: false,
      error: {
        code: 'UPLOAD_ERROR',
        message: err.message,
      },
    });
    return;
  }

  // Handle custom validation or bad request errors (including 400 invalid media types)
  if (
    err.status === 400 ||
    err.statusCode === 400 ||
    err.name === 'ValidationError' ||
    err.code === 'INVALID_MEDIA_TYPE' ||
    err.message?.includes('Unsupported media type')
  ) {
    res.status(400).json({
      success: false,
      error: {
        code: err.code || 'INVALID_INPUT',
        message: err.message,
      },
    });
    return;
  }

  // Handle default 500 internal errors
  const isDev = env.NODE_ENV === 'development';
  res.status(500).json({
    success: false,
    error: {
      code: 'INTERNAL_SERVER_ERROR',
      message: isDev ? err.message : 'An unexpected error occurred during processing.',
      details: isDev ? err.stack : undefined,
    },
  });
}
