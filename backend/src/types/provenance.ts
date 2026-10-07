/**
 * Deepfake Shield — Provenance & Verification Types
 */

export type VerificationStatus = 'AUTHENTIC' | 'MODIFIED' | 'NOT_REGISTERED' | 'ERROR';

export interface MediaMetadata {
  schemaVersion: string;
  fileHash: string;
  hashAlgorithm: 'SHA-256';
  fileName: string;
  mimeType: string;
  fileSize: number;
  createdAt: string;
  creator?: string;
  ipfsCID?: string;
  blockchain?: string;
  contractAddress?: string;
  perceptualHash?: string | null;
}

export interface MediaRecord {
  fileHash: string;
  ipfsCID: string;
  creator: string;
  timestamp: number;
  isVerified: boolean;
}

export interface RegistrationResult {
  status: 'REGISTERED' | 'ALREADY_REGISTERED';
  hash: string;
  ipfsCID: string;
  transactionHash: string;
  blockNumber: number;
  contractAddress: string;
  metadata: MediaMetadata;
}

export interface VerificationResult {
  status: VerificationStatus;
  hash: string;
  message: string;
  record?: {
    creator: string;
    timestamp: number;
    ipfsCID: string;
    isVerified: boolean;
    formattedDate?: string;
  };
  metadata?: MediaMetadata | null;
  perceptualAnalysis?: {
    implemented: boolean;
    pHash?: string | null;
    similarityScore?: number | null;
    note: string;
  };
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
}
