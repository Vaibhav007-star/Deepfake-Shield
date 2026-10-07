import { Router } from 'express';
import { mediaController } from '../controllers/media.controller';
import { uploadMiddleware } from '../middleware/upload.middleware';

const router = Router();

// Endpoint to compute SHA-256 fingerprint without blockchain anchor
router.post('/hash', uploadMiddleware.single('file'), (req, res, next) => {
  mediaController.hashMedia(req, res, next);
});

// Endpoint to upload, pin metadata, and anchor on-chain
router.post('/register', uploadMiddleware.single('file'), (req, res, next) => {
  mediaController.registerMedia(req, res, next);
});

// Endpoint to query media record by hash
router.get('/:hash', (req, res, next) => {
  mediaController.getMediaByHash(req, res, next);
});

export const mediaRoutes = router;
