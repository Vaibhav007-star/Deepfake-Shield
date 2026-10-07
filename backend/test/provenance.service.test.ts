import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ProvenanceService } from '../src/services/provenance.service';
import { blockchainService } from '../src/services/blockchain.service';
import { ipfsService, IStorageProvider } from '../src/services/ipfs.service';

describe('ProvenanceService', () => {
  let provenanceService: ProvenanceService;

  beforeEach(() => {
    provenanceService = new ProvenanceService();
    vi.restoreAllMocks();
  });

  describe('Verification Flow', () => {
    it('should return NOT_REGISTERED when hash is not present on chain', async () => {
      vi.spyOn(blockchainService, 'verifyMedia').mockResolvedValue(null);

      const result = await provenanceService.verifyMedia({
        hash: '0x1111111111111111111111111111111111111111111111111111111111111111',
      });

      expect(result.status).toBe('NOT_REGISTERED');
      expect(result.message).toContain('No matching provenance record was found');
    });

    it('should return AUTHENTIC when hash exists on blockchain and matches', async () => {
      const mockRecord = {
        fileHash: '0x2222222222222222222222222222222222222222222222222222222222222222',
        ipfsCID: 'bafybeihsamplecid',
        creator: '0x1234567890123456789012345678901234567890',
        timestamp: 1726000000,
        isVerified: true,
      };

      vi.spyOn(blockchainService, 'verifyMedia').mockResolvedValue(mockRecord);
      vi.spyOn(ipfsService, 'fetchMetadata').mockResolvedValue({
        fileName: 'verified_photo.jpg',
        fileSize: 1024,
      });

      const result = await provenanceService.verifyMedia({
        hash: mockRecord.fileHash,
      });

      expect(result.status).toBe('AUTHENTIC');
      expect(result.record?.creator).toBe(mockRecord.creator);
      expect(result.record?.ipfsCID).toBe(mockRecord.ipfsCID);
      expect(result.record?.isVerified).toBe(true);
      expect(result.metadata?.fileName).toBe('verified_photo.jpg');
    });

    it('should return MODIFIED when the current file hash differs from a registered expected hash', async () => {
      const expectedHash = '0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
      const modifiedBuffer = Buffer.from('Altered deepfake video file');

      // The expected original hash exists on-chain
      vi.spyOn(blockchainService, 'verifyMedia').mockImplementation(async (queryHash) => {
        if (queryHash.toLowerCase() === expectedHash.toLowerCase()) {
          return {
            fileHash: expectedHash,
            ipfsCID: 'bafybeioriginal',
            creator: '0xCreatorAddress',
            timestamp: 1720000000,
            isVerified: true,
          };
        }
        return null;
      });

      const result = await provenanceService.verifyMedia({
        buffer: modifiedBuffer,
        expectedHash: expectedHash,
      });

      expect(result.status).toBe('MODIFIED');
      expect(result.message).toContain('does not match the registered provenance record');
      expect(result.record?.creator).toBe('0xCreatorAddress');
    });
  });

  describe('Registration Flow & Error Handling', () => {
    it('should handle IPFS failure gracefully during registration', async () => {
      vi.spyOn(blockchainService, 'mediaExists').mockResolvedValue(false);
      vi.spyOn(ipfsService, 'uploadMedia').mockRejectedValue(new Error('IPFS Gateway timeout'));

      const buffer = Buffer.from('Media to upload');

      await expect(
        provenanceService.registerMedia(buffer, 'test.png', 'image/png')
      ).rejects.toThrow('IPFS Gateway timeout');
    });

    it('should handle blockchain transaction failure gracefully during registration', async () => {
      vi.spyOn(blockchainService, 'mediaExists').mockResolvedValue(false);
      vi.spyOn(ipfsService, 'uploadMedia').mockResolvedValue('bafymedia');
      vi.spyOn(ipfsService, 'uploadMetadata').mockResolvedValue('bafymeta');
      vi.spyOn(blockchainService, 'registerMedia').mockRejectedValue(new Error('Insufficient gas'));

      const buffer = Buffer.from('Media to upload');

      await expect(
        provenanceService.registerMedia(buffer, 'test.png', 'image/png')
      ).rejects.toThrow('Insufficient gas');
    });
  });
});
