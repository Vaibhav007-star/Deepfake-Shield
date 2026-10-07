import { Request, Response, NextFunction } from 'express';
import { provenanceService } from '../services/provenance.service';
import { sanitizeFilename } from '../middleware/upload.middleware';
import { ApiResponse, VerificationResult } from '../types/provenance';
import { logger } from '../utils/logger';

export class VerificationController {
  /**
   * POST /api/media/verify
   * Verifies authenticity against on-chain provenance records.
   * Supports either multipart file upload or JSON payload with `{ hash, expectedHash? }`.
   */
  async verify(
    req: Request,
    res: Response<ApiResponse<VerificationResult>>,
    next: NextFunction
  ): Promise<void> {
    try {
      const expectedHash = req.body.expectedHash || req.query.expectedHash;

      // Scenario A: File uploaded
      if (req.file) {
        const safeFilename = sanitizeFilename(req.file.originalname);
        logger.info('Verifying uploaded file', {
          filename: safeFilename,
          size: req.file.size,
          expectedHash,
        });

        const result = await provenanceService.verifyMedia({
          buffer: req.file.buffer,
          filename: safeFilename,
          mimeType: req.file.mimetype,
          expectedHash: typeof expectedHash === 'string' ? expectedHash : undefined,
        });

        res.status(200).json({
          success: true,
          data: result,
        });
        return;
      }

      // Scenario B: Direct hash passed in body
      const inputHash = req.body.hash;
      if (inputHash && typeof inputHash === 'string') {
        logger.info('Verifying media by hash', { hash: inputHash, expectedHash });

        const result = await provenanceService.verifyMedia({
          hash: inputHash,
          expectedHash: typeof expectedHash === 'string' ? expectedHash : undefined,
        });

        res.status(200).json({
          success: true,
          data: result,
        });
        return;
      }

      // Neither file nor hash provided
      res.status(400).json({
        success: false,
        error: {
          code: 'MISSING_VERIFICATION_INPUT',
          message: 'Please provide either a media file upload or a cryptographic hash to verify.',
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const verificationController = new VerificationController();
