import axios from 'axios';
import FormData from 'form-data';
import crypto from 'crypto';
import { env } from '../config/env';
import { logger } from '../utils/logger';

export interface IStorageProvider {
  uploadMedia(buffer: Buffer, filename: string, mimeType: string): Promise<string>;
  uploadMetadata(metadata: Record<string, any>, name?: string): Promise<string>;
  fetchMetadata(cid: string): Promise<any>;
}

/**
 * Local Deterministic Provider:
 * Used when Pinata credentials are not provided (e.g. offline testing or initial local run).
 * Generates deterministic base58-like content identifiers and maintains an in-memory cache.
 */
export class LocalDeterministicStorageProvider implements IStorageProvider {
  private memoryCache: Map<string, any> = new Map();

  private generateMockCID(data: Buffer | string): string {
    const hash = crypto.createHash('sha256').update(data).digest('hex');
    // Prepend standard IPFS v1 CID prefix structure (bafy...)
    return `bafybeishield${hash.substring(0, 46)}`;
  }

  async uploadMedia(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
    const cid = this.generateMockCID(buffer);
    this.memoryCache.set(cid, {
      type: 'media',
      filename,
      mimeType,
      size: buffer.length,
      uploadedAt: new Date().toISOString(),
    });
    logger.info('LocalDeterministicStorageProvider: pinned media', { cid, filename });
    return cid;
  }

  async uploadMetadata(metadata: Record<string, any>, name?: string): Promise<string> {
    const raw = JSON.stringify(metadata);
    const cid = this.generateMockCID(raw);
    this.memoryCache.set(cid, metadata);
    logger.info('LocalDeterministicStorageProvider: pinned metadata', { cid, name });
    return cid;
  }

  async fetchMetadata(cid: string): Promise<any> {
    if (this.memoryCache.has(cid)) {
      return this.memoryCache.get(cid);
    }
    return null;
  }
}

/**
 * Production Pinata Storage Provider:
 * Communicates with Pinata Cloud via REST API using Bearer JWT authentication.
 */
export class PinataStorageProvider implements IStorageProvider {
  private jwt: string;
  private gateway: string;
  private readonly pinataUrl = 'https://api.pinata.cloud';

  constructor(jwt: string, gateway: string) {
    this.jwt = jwt;
    this.gateway = gateway;
  }

  async uploadMedia(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
    const form = new FormData();
    form.append('file', buffer, {
      filename,
      contentType: mimeType,
    });

    const metadata = JSON.stringify({
      name: `DeepfakeShield_Media_${filename}`,
      keyvalues: {
        platform: 'DeepfakeShield',
        timestamp: Date.now().toString(),
      },
    });
    form.append('pinataMetadata', metadata);

    const options = JSON.stringify({
      cidVersion: 1,
    });
    form.append('pinataOptions', options);

    try {
      const response = await axios.post(`${this.pinataUrl}/pinning/pinFileToIPFS`, form, {
        headers: {
          Authorization: `Bearer ${this.jwt}`,
          ...form.getHeaders(),
        },
        maxBodyLength: Infinity,
        timeout: 60000,
      });

      const cid = response.data.IpfsHash;
      logger.info('Pinata: media uploaded successfully', { cid, filename });
      return cid;
    } catch (error: any) {
      logger.error('Pinata uploadMedia failed', error?.response?.data || error.message);
      throw new Error(`IPFS media upload failed: ${error?.response?.data?.error?.details || error.message}`);
    }
  }

  async uploadMetadata(metadata: Record<string, any>, name?: string): Promise<string> {
    const body = {
      pinataOptions: {
        cidVersion: 1,
      },
      pinataMetadata: {
        name: name || `DeepfakeShield_Metadata_${metadata.fileHash || Date.now()}`,
        keyvalues: {
          type: 'provenance_metadata',
          hash: metadata.fileHash || 'unknown',
        },
      },
      pinataContent: metadata,
    };

    try {
      const response = await axios.post(`${this.pinataUrl}/pinning/pinJSONToIPFS`, body, {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${this.jwt}`,
        },
        timeout: 30000,
      });

      const cid = response.data.IpfsHash;
      logger.info('Pinata: metadata pinned successfully', { cid });
      return cid;
    } catch (error: any) {
      logger.error('Pinata uploadMetadata failed', error?.response?.data || error.message);
      throw new Error(`IPFS metadata upload failed: ${error?.response?.data?.error?.details || error.message}`);
    }
  }

  async fetchMetadata(cid: string): Promise<any> {
    const gatewayUrl = `${this.gateway}/${cid}`;
    try {
      const response = await axios.get(gatewayUrl, { timeout: 15000 });
      return response.data;
    } catch (error: any) {
      logger.warn('Pinata gateway fetchMetadata failed, falling back to public IPFS gateway', {
        cid,
        error: error.message,
      });

      try {
        const fallbackUrl = `https://ipfs.io/ipfs/${cid}`;
        const fallbackRes = await axios.get(fallbackUrl, { timeout: 15000 });
        return fallbackRes.data;
      } catch (err: any) {
        logger.error('Failed to fetch IPFS metadata from all gateways', { cid, error: err.message });
        return null;
      }
    }
  }
}

/**
 * Service Facade selecting the appropriate storage provider
 */
export class IpfsService implements IStorageProvider {
  private provider: IStorageProvider;

  constructor() {
    if (env.PINATA_JWT && env.PINATA_JWT.trim().length > 10) {
      logger.info('IPFS Service initialized with PinataStorageProvider');
      this.provider = new PinataStorageProvider(env.PINATA_JWT, env.PINATA_GATEWAY);
    } else {
      logger.warn(
        'PINATA_JWT is not configured. Initializing LocalDeterministicStorageProvider for local offline operation.'
      );
      this.provider = new LocalDeterministicStorageProvider();
    }
  }

  // Allow dynamic replacement of provider for testing
  public setProvider(provider: IStorageProvider): void {
    this.provider = provider;
  }

  async uploadMedia(buffer: Buffer, filename: string, mimeType: string): Promise<string> {
    return this.provider.uploadMedia(buffer, filename, mimeType);
  }

  async uploadMetadata(metadata: Record<string, any>, name?: string): Promise<string> {
    return this.provider.uploadMetadata(metadata, name);
  }

  async fetchMetadata(cid: string): Promise<any> {
    return this.provider.fetchMetadata(cid);
  }
}

export const ipfsService = new IpfsService();
