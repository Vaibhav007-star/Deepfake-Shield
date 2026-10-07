import crypto from 'crypto';
import fs from 'fs';
import { logger } from '../utils/logger';

export interface HashResult {
  algorithm: 'SHA-256';
  hash: string;       // bytes32 hex formatted with 0x prefix
  rawHash: string;    // 64-char hex string without 0x
  size: number;
}

export interface PerceptualHashResult {
  implemented: boolean;
  algorithm: string;
  pHash: string | null;
  note: string;
}

export interface IPerceptualHasher {
  calculatePerceptualHash(bufferOrPath: Buffer | string, mimeType?: string): Promise<PerceptualHashResult>;
}

export class PerceptualHasherHook implements IPerceptualHasher {
  /**
   * Hook/Interface for future perceptual hashing (DCT-based pHash, blockhash, or dHash).
   * As specified, we clearly isolate this layer and do NOT fabricate false pHash results
   * without a dedicated image-processing binary (e.g. sharp/opencv/c2pa).
   */
  async calculatePerceptualHash(
    _bufferOrPath: Buffer | string,
    mimeType?: string
  ): Promise<PerceptualHashResult> {
    logger.debug('pHash hook invoked', { mimeType });
    return {
      implemented: false,
      algorithm: 'pHash-DCT-64bit (Extensible Interface)',
      pHash: null,
      note: 'Perceptual hashing interface is connected. In production, integrate sharp/c2pa/opencv to calculate perceptual distance alongside exact cryptographic SHA-256.',
    };
  }
}

export class HashingService {
  private perceptualHasher: IPerceptualHasher;

  constructor(perceptualHasher: IPerceptualHasher = new PerceptualHasherHook()) {
    this.perceptualHasher = perceptualHasher;
  }

  /**
   * Calculates deterministic SHA-256 cryptographic hash from a Buffer.
   * Ensures independent server-side validation.
   */
  public calculateSha256(buffer: Buffer): HashResult {
    if (!buffer || buffer.length === 0) {
      throw new Error('Cannot hash empty or invalid buffer');
    }

    const hash = crypto.createHash('sha256').update(buffer).digest('hex');
    return {
      algorithm: 'SHA-256',
      hash: `0x${hash}`,
      rawHash: hash,
      size: buffer.length,
    };
  }

  /**
   * Calculates deterministic SHA-256 cryptographic hash from a file path.
   */
  public async calculateSha256FromFile(filePath: string): Promise<HashResult> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`File does not exist at path: ${filePath}`);
    }

    const stats = await fs.promises.stat(filePath);
    if (stats.size === 0) {
      throw new Error('Cannot hash an empty file');
    }

    return new Promise((resolve, reject) => {
      const hashStream = crypto.createHash('sha256');
      const fileStream = fs.createReadStream(filePath);

      fileStream.on('data', (data) => hashStream.update(data));
      fileStream.on('end', () => {
        const hash = hashStream.digest('hex');
        resolve({
          algorithm: 'SHA-256',
          hash: `0x${hash}`,
          rawHash: hash,
          size: stats.size,
        });
      });
      fileStream.on('error', (err) => {
        logger.error('Error streaming file for hashing', err);
        reject(err);
      });
    });
  }

  /**
   * Invokes the perceptual hashing interface.
   */
  public async calculatePerceptualHash(
    bufferOrPath: Buffer | string,
    mimeType?: string
  ): Promise<PerceptualHashResult> {
    return this.perceptualHasher.calculatePerceptualHash(bufferOrPath, mimeType);
  }
}

export const hashingService = new HashingService();
