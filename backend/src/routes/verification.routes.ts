import { Router, Request, Response, NextFunction } from 'express';
import { verificationController } from '../controllers/verification.controller';
import { uploadMiddleware } from '../middleware/upload.middleware';

const router = Router();

// Allows both multipart file upload and JSON body verification
const conditionalUpload = (req: Request, res: Response, next: NextFunction) => {
  if (req.is('multipart/form-data')) {
    return uploadMiddleware.single('file')(req, res, next);
  }
  next();
};

router.post('/verify', conditionalUpload, (req, res, next) => {
  verificationController.verify(req, res, next);
});

export const verificationRoutes = router;
