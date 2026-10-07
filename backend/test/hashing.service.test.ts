import { describe, it, expect } from 'vitest';
import { HashingService } from '../src/services/hashing.service';
import crypto from 'crypto';

describe('HashingService', () => {
  const hashingService = new HashingService();

  it('should calculate deterministic SHA-256 for a buffer with 0x prefix', () => {
    const testData = Buffer.from('Deepfake Shield Test Media Buffer');
    const result = hashingService.calculateSha256(testData);

    const expectedRaw = crypto.createHash('sha256').update(testData).digest('hex');
    expect(result.algorithm).toBe('SHA-256');
    expect(result.rawHash).toBe(expectedRaw);
    expect(result.hash).toBe(`0x${expectedRaw}`);
    expect(result.size).toBe(testData.length);
    expect(result.hash.length).toBe(66);
  });

  it('should produce identical hashes for identical inputs', () => {
    const buf1 = Buffer.from('Identical Input Data');
    const buf2 = Buffer.from('Identical Input Data');

    const res1 = hashingService.calculateSha256(buf1);
    const res2 = hashingService.calculateSha256(buf2);

    expect(res1.hash).toBe(res2.hash);
  });

  it('should produce completely distinct hashes for slightly different inputs (avalanche effect)', () => {
    const buf1 = Buffer.from('Deepfake Shield Authentic 1');
    const buf2 = Buffer.from('Deepfake Shield Authentic 2');

    const res1 = hashingService.calculateSha256(buf1);
    const res2 = hashingService.calculateSha256(buf2);

    expect(res1.hash).not.toBe(res2.hash);
  });

  it('should throw an error when provided an empty buffer', () => {
    const emptyBuf = Buffer.alloc(0);
    expect(() => hashingService.calculateSha256(emptyBuf)).toThrow('Cannot hash empty or invalid buffer');
  });

  it('should calculate perceptual hash hook response clearly indicating interface separation', async () => {
    const buf = Buffer.from('Image data');
    const pHashResult = await hashingService.calculatePerceptualHash(buf, 'image/jpeg');

    expect(pHashResult.implemented).toBe(false);
    expect(pHashResult.pHash).toBeNull();
    expect(pHashResult.note).toContain('Perceptual hashing interface is connected');
  });
});
