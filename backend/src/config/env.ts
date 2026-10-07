import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';

dotenv.config();

export interface EnvConfig {
  PORT: number;
  NODE_ENV: string;
  FRONTEND_ORIGIN: string;
  RPC_URL: string;
  PRIVATE_KEY: string;
  CONTRACT_ADDRESS: string;
  PINATA_JWT: string;
  PINATA_GATEWAY: string;
  MAX_FILE_SIZE_MB: number;
  UPLOAD_DIR: string;
}

const getEnvNumber = (key: string, defaultValue: number): number => {
  const value = process.env[key];
  if (!value) return defaultValue;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? defaultValue : parsed;
};

export const getContractAddress = (): string => {
  // Automatically discover latest deployment from contracts/deployments/deployment.json
  const possiblePaths = [
    path.resolve(__dirname, '../../../contracts/deployments/deployment.json'),
    path.resolve(__dirname, '../../contracts/deployments/deployment.json'),
    path.resolve(process.cwd(), 'contracts/deployments/deployment.json'),
    path.resolve(process.cwd(), '../contracts/deployments/deployment.json'),
  ];
  for (const p of possiblePaths) {
    try {
      if (fs.existsSync(p)) {
        const data = JSON.parse(fs.readFileSync(p, 'utf8'));
        if (data.contractAddress && typeof data.contractAddress === 'string' && data.contractAddress.startsWith('0x')) {
          return data.contractAddress.trim();
        }
      }
    } catch {
      // ignore
    }
  }

  if (process.env.CONTRACT_ADDRESS && process.env.CONTRACT_ADDRESS.trim().length > 0) {
    return process.env.CONTRACT_ADDRESS.trim();
  }

  return '0x0165878A594ca255338adfa4d48449f69242Eb8F';
};

export const env: EnvConfig = {
  PORT: getEnvNumber('PORT', 5000),
  NODE_ENV: process.env.NODE_ENV || 'development',
  FRONTEND_ORIGIN: process.env.FRONTEND_ORIGIN || 'http://localhost:3000',
  RPC_URL: process.env.RPC_URL || 'http://127.0.0.1:8545',
  PRIVATE_KEY:
    process.env.PRIVATE_KEY ||
    '0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80',
  CONTRACT_ADDRESS: getContractAddress(),
  PINATA_JWT: process.env.PINATA_JWT || '',
  PINATA_GATEWAY: (process.env.PINATA_GATEWAY || 'https://gateway.pinata.cloud/ipfs').replace(/\/+$/, ''),
  MAX_FILE_SIZE_MB: getEnvNumber('MAX_FILE_SIZE_MB', 50),
  UPLOAD_DIR: path.resolve(process.env.UPLOAD_DIR || './uploads'),
};
