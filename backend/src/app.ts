import express, { Express, Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import crypto from 'crypto';
import { env } from './config/env';
import { logger } from './utils/logger';
import { mediaRoutes } from './routes/media.routes';
import { verificationRoutes } from './routes/verification.routes';
import { errorHandler } from './middleware/error.middleware';

export function createApp(): Express {
  const app = express();

  // Security Headers
  app.use(helmet());

  // CORS Configuration
  const allowedOrigins = [
    env.FRONTEND_ORIGIN,
    'http://localhost:3000',
    'http://127.0.0.1:3000',
  ];

  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps, curl, postman)
        if (!origin) return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || env.NODE_ENV === 'development') {
          return callback(null, true);
        }
        return callback(new Error('CORS policy does not allow access from the specified origin.'));
      },
      credentials: true,
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  );

  // Rate Limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200, // limit each IP to 200 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      error: {
        code: 'TOO_MANY_REQUESTS',
        message: 'Rate limit exceeded. Please try again later.',
      },
    },
  });
  app.use(limiter);

  // Body Parsing
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request Tracking & Logging Middleware
  app.use((req: Request, res: Response, next: NextFunction) => {
    const requestId = crypto.randomUUID();
    const startTime = Date.now();
    (req as any).id = requestId;

    res.on('finish', () => {
      const duration = Date.now() - startTime;
      logger.info('HTTP Request processed', {
        id: requestId,
        method: req.method,
        path: req.path,
        status: res.statusCode,
        duration: `${duration}ms`,
      });
    });

    next();
  });

  // Health Check Endpoint
  app.get('/api/health', (_req: Request, res: Response) => {
    res.status(200).json({
      success: true,
      status: 'UP',
      timestamp: new Date().toISOString(),
      service: 'Deepfake Shield Provenance Pipeline',
      version: '1.0.0',
      contractConfigured: !!env.CONTRACT_ADDRESS,
    });
  });

  // Mount Media and Verification Endpoints
  // POST /api/media/register, POST /api/media/hash, GET /api/media/:hash
  app.use('/api/media', mediaRoutes);

  // POST /api/media/verify as per spec, also alias /api/verification/verify
  app.use('/api/media', verificationRoutes);
  app.use('/api/verification', verificationRoutes);

  // 404 Route Handler
  app.use((_req: Request, res: Response) => {
    res.status(404).json({
      success: false,
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'The requested API route does not exist.',
      },
    });
  });

  // Global Error Handler
  app.use(errorHandler);

  return app;
}

export const app = createApp();
