import { app } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const server = app.listen(env.PORT, () => {
  logger.info(`Deepfake Shield Backend listening on port ${env.PORT} [${env.NODE_ENV}]`);
  logger.info(`API Base URL: http://localhost:${env.PORT}/api`);
  logger.info(`Contract Address: ${env.CONTRACT_ADDRESS}`);
  logger.info(`Blockchain RPC: ${env.RPC_URL}`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server gracefully');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});
