import { describe, it, expect, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app';
import { blockchainService } from '../src/services/blockchain.service';

describe('Backend API Endpoints', () => {
  const app = createApp();

  describe('GET /api/health', () => {
    it('should return 200 and healthy status', async () => {
      const res = await request(app).get('/api/health');
      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.status).toBe('UP');
    });
  });

  describe('POST /api/media/hash', () => {
    it('should compute hash for uploaded image buffer', async () => {
      const testBuffer = Buffer.from('test image bytes for hashing');
      const res = await request(app)
        .post('/api/media/hash')
        .attach('file', testBuffer, 'sample.jpg');

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.hash).toMatch(/^0x[a-f0-9]{64}$/i);
      expect(res.body.data.algorithm).toBe('SHA-256');
      expect(res.body.data.filename).toBe('sample.jpg');
    });

    it('should return 400 when no file is attached', async () => {
      const res = await request(app).post('/api/media/hash');
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MISSING_FILE');
    });

    it('should reject unsupported file mime types with 400', async () => {
      const executableBuffer = Buffer.from('unsupported binary');
      const res = await request(app)
        .post('/api/media/hash')
        .attach('file', executableBuffer, 'malicious.exe');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.message).toContain('Unsupported media type');
    });
  });

  describe('POST /api/media/verify', () => {
    it('should return 400 if neither file nor hash is provided', async () => {
      const res = await request(app).post('/api/media/verify').send({});
      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('MISSING_VERIFICATION_INPUT');
    });

    it('should verify a valid hash payload against the registry', async () => {
      vi.spyOn(blockchainService, 'verifyMedia').mockResolvedValue(null);

      const res = await request(app).post('/api/media/verify').send({
        hash: '0x3333333333333333333333333333333333333333333333333333333333333333',
      });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.status).toBe('NOT_REGISTERED');
    });
  });

  describe('404 Not Found Handling', () => {
    it('should return 404 for nonexistent routes', async () => {
      const res = await request(app).get('/api/nonexistent-route');
      expect(res.status).toBe(404);
      expect(res.body.success).toBe(false);
      expect(res.body.error.code).toBe('ROUTE_NOT_FOUND');
    });
  });
});
