import { hashingService } from './hashing.service';
import { ipfsService } from './ipfs.service';
import { blockchainService } from './blockchain.service';
import { logger } from '../utils/logger';
import {
  MediaMetadata,
  RegistrationResult,
  VerificationResult,
  VerificationStatus,
} from '../types/provenance';

export class ProvenanceService {
  /**
   * Hashes media without performing blockchain registration.
   */
  async hashMedia(
    buffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<{
    algorithm: string;
    hash: string;
    rawHash: string;
    size: number;
    filename: string;
    mimeType: string;
    perceptualAnalysis: any;
  }> {
    const hashResult = hashingService.calculateSha256(buffer);
    const pHashResult = await hashingService.calculatePerceptualHash(buffer, mimeType);

    return {
      algorithm: hashResult.algorithm,
      hash: hashResult.hash,
      rawHash: hashResult.rawHash,
      size: hashResult.size,
      filename,
      mimeType,
      perceptualAnalysis: pHashResult,
    };
  }

  /**
   * Complete registration pipeline:
   * 1. Authoritative SHA-256 calculation
   * 2. Perceptual analysis interface hook
   * 3. IPFS media upload
   * 4. IPFS metadata bundle upload
   * 5. Smart contract registration transaction
   */
  async registerMedia(
    buffer: Buffer,
    filename: string,
    mimeType: string,
    creatorAddress?: string
  ): Promise<RegistrationResult> {
    logger.info('ProvenanceService: registering media', { filename, mimeType, size: buffer.length });

    // 1. Calculate authoritative server-side cryptographic hash
    const hashResult = hashingService.calculateSha256(buffer);
    const pHashResult = await hashingService.calculatePerceptualHash(buffer, mimeType);

    // 2. Check if already registered on blockchain
    const exists = await blockchainService.mediaExists(hashResult.hash);
    if (exists) {
      const existingRecord = await blockchainService.verifyMedia(hashResult.hash);
      const existingMetadata = existingRecord?.ipfsCID
        ? await ipfsService.fetchMetadata(existingRecord.ipfsCID)
        : null;

      return {
        status: 'ALREADY_REGISTERED',
        hash: hashResult.hash,
        ipfsCID: existingRecord?.ipfsCID || '',
        transactionHash: 'EXISTING_RECORD',
        blockNumber: 0,
        contractAddress: blockchainService.getContractAddress(),
        metadata: existingMetadata || {
          schemaVersion: '1.0',
          fileHash: hashResult.hash,
          hashAlgorithm: 'SHA-256',
          fileName: filename,
          mimeType: mimeType,
          fileSize: buffer.length,
          createdAt: existingRecord?.timestamp ? new Date(existingRecord.timestamp * 1000).toISOString() : new Date().toISOString(),
          creator: existingRecord?.creator || creatorAddress || blockchainService.getSignerAddress(),
          ipfsCID: existingRecord?.ipfsCID || '',
          blockchain: 'EVM Compatible',
          contractAddress: blockchainService.getContractAddress(),
          perceptualHash: pHashResult.pHash,
        },
      };
    }

    // 3. Upload media file to IPFS
    const mediaCID = await ipfsService.uploadMedia(buffer, filename, mimeType);

    // 4. Construct provenance metadata
    const metadata: MediaMetadata = {
      schemaVersion: '1.0',
      fileHash: hashResult.hash,
      hashAlgorithm: 'SHA-256',
      fileName: filename,
      mimeType: mimeType,
      fileSize: buffer.length,
      createdAt: new Date().toISOString(),
      creator: creatorAddress || blockchainService.getSignerAddress(),
      ipfsCID: mediaCID,
      blockchain: 'EVM Compatible',
      contractAddress: blockchainService.getContractAddress(),
      perceptualHash: pHashResult.pHash,
    };

    // 5. Upload metadata bundle to IPFS
    const metadataCID = await ipfsService.uploadMetadata(
      metadata,
      `Metadata_${filename}_${Date.now()}`
    );

    // 6. Anchor to blockchain registry
    const tx = await blockchainService.registerMedia(hashResult.hash, metadataCID);

    return {
      status: 'REGISTERED',
      hash: hashResult.hash,
      ipfsCID: metadataCID,
      transactionHash: tx.txHash,
      blockNumber: tx.blockNumber,
      contractAddress: blockchainService.getContractAddress(),
      metadata,
    };
  }

  /**
   * Verification pipeline:
   * Accepts either a file Buffer or a pre-calculated hash.
   * Compares against the blockchain registry and returns detailed provenance status.
   */
  async verifyMedia(
    input: { buffer?: Buffer; hash?: string; expectedHash?: string; filename?: string; mimeType?: string }
  ): Promise<VerificationResult> {
    let calculatedHash: string;
    let pHashResult = null;

    if (input.buffer) {
      const hashRes = hashingService.calculateSha256(input.buffer);
      calculatedHash = hashRes.hash;
      pHashResult = await hashingService.calculatePerceptualHash(input.buffer, input.mimeType);
    } else if (input.hash) {
      calculatedHash = input.hash.startsWith('0x') ? input.hash : `0x${input.hash}`;
    } else {
      throw new Error('Either file buffer or hash must be provided for verification');
    }

    logger.info('ProvenanceService: verifying media', {
      hash: calculatedHash,
      expectedHash: input.expectedHash,
    });

    // Check for explicit modification flag (e.g. user provided expected prior hash)
    if (input.expectedHash) {
      const formattedExpected = input.expectedHash.startsWith('0x')
        ? input.expectedHash
        : `0x${input.expectedHash}`;

      if (formattedExpected.toLowerCase() !== calculatedHash.toLowerCase()) {
        const expectedRecord = await blockchainService.verifyMedia(formattedExpected);
        if (expectedRecord && expectedRecord.isVerified) {
          return {
            status: 'MODIFIED',
            hash: calculatedHash,
            message:
              'The current file fingerprint does not match the registered provenance record. The content has been altered.',
            record: {
              creator: expectedRecord.creator,
              timestamp: expectedRecord.timestamp,
              ipfsCID: expectedRecord.ipfsCID,
              isVerified: true,
              formattedDate: new Date(expectedRecord.timestamp * 1000).toUTCString(),
            },
            perceptualAnalysis: pHashResult || {
              implemented: false,
              pHash: null,
              similarityScore: null,
              note: 'Cryptographic hash mismatch indicates file modification.',
            },
          };
        }
      }
    }

    // Query on-chain registry for current hash
    const onChainRecord = await blockchainService.verifyMedia(calculatedHash);

    if (onChainRecord && onChainRecord.isVerified) {
      // Fetch metadata from IPFS if CID is present
      let metadata: MediaMetadata | null = null;
      if (onChainRecord.ipfsCID) {
        try {
          metadata = await ipfsService.fetchMetadata(onChainRecord.ipfsCID);
        } catch (err) {
          logger.warn('Could not fetch IPFS metadata for verified record', { cid: onChainRecord.ipfsCID });
        }
      }

      return {
        status: 'AUTHENTIC',
        hash: calculatedHash,
        message: 'This file matches a registered on-chain provenance record.',
        record: {
          creator: onChainRecord.creator,
          timestamp: onChainRecord.timestamp,
          ipfsCID: onChainRecord.ipfsCID,
          isVerified: true,
          formattedDate: new Date(onChainRecord.timestamp * 1000).toUTCString(),
        },
        metadata,
        perceptualAnalysis: pHashResult || {
          implemented: false,
          pHash: null,
          similarityScore: null,
          note: 'Exact SHA-256 match confirmed against decentralized ledger.',
        },
      };
    }

    // Not registered on blockchain
    return {
      status: 'NOT_REGISTERED',
      hash: calculatedHash,
      message: 'No matching provenance record was found on the configured blockchain registry.',
      perceptualAnalysis: pHashResult || {
        implemented: false,
        pHash: null,
        similarityScore: null,
        note: 'No prior fingerprint found on ledger to compare against.',
      },
    };
  }
}

export const provenanceService = new ProvenanceService();
