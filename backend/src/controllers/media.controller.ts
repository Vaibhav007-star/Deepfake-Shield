import { Request, Response, NextFunction } from 'express';
import { provenanceService } from '../services/provenance.service';
import { sanitizeFilename } from '../middleware/upload.middleware';
import { ApiResponse } from '../types/provenance';
import { logger } from '../utils/logger';

export class MediaController {
  /**
   * POST /api/media/hash
   * Computes authoritative SHA-256 fingerprint without registering to blockchain.
   */
  async hashMedia(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FILE',
            message: 'No media file provided for hashing. Please upload a file.',
          },
        });
        return;
      }

      const safeFilename = sanitizeFilename(req.file.originalname);
      const result = await provenanceService.hashMedia(
        req.file.buffer,
        safeFilename,
        req.file.mimetype
      );

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * POST /api/media/register
   * Full pipeline: hash -> IPFS media pin -> IPFS metadata pin -> blockchain anchor.
   */
  async registerMedia(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      if (!req.file) {
        res.status(400).json({
          success: false,
          error: {
            code: 'MISSING_FILE',
            message: 'No media file provided for registration.',
          },
        });
        return;
      }

      const safeFilename = sanitizeFilename(req.file.originalname);
      const creatorAddress = req.body.creator || undefined;

      logger.info('Registering media request received', {
        filename: safeFilename,
        size: req.file.size,
        creator: creatorAddress,
      });

      const result = await provenanceService.registerMedia(
        req.file.buffer,
        safeFilename,
        req.file.mimetype,
        creatorAddress
      );

      res.status(201).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * GET /api/media/:hash
   * Queries existing record and provenance metadata by hash.
   */
  async getMediaByHash(req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> {
    try {
      const { hash } = req.params;
      if (!hash) {
        res.status(400).json({
          success: false,
          error: {
            code: 'INVALID_HASH',
            message: 'Hash parameter is required.',
          },
        });
        return;
      }

      const result = await provenanceService.verifyMedia({ hash });

      if (result.status === 'NOT_REGISTERED') {
        res.status(404).json({
          success: false,
          error: {
            code: 'MEDIA_NOT_FOUND',
            message: 'No provenance record was found for this file hash.',
          },
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: result,
      });
    } catch (error) {
      next(error);
    }
  }
}

export const mediaController = new MediaController();
