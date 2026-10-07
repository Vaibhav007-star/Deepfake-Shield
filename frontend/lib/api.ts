const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

export interface VerificationResponse {
  success: boolean;
  data?: {
    status: 'AUTHENTIC' | 'MODIFIED' | 'NOT_REGISTERED' | 'ERROR';
    hash: string;
    message: string;
    record?: {
      creator: string;
      timestamp: number;
      ipfsCID: string;
      isVerified: boolean;
      formattedDate?: string;
    };
    metadata?: {
      schemaVersion: string;
      fileHash: string;
      hashAlgorithm: string;
      fileName: string;
      mimeType: string;
      fileSize: number;
      createdAt: string;
      creator?: string;
      ipfsCID?: string;
      blockchain?: string;
      contractAddress?: string;
      perceptualHash?: string | null;
    };
    perceptualAnalysis?: {
      implemented: boolean;
      pHash?: string | null;
      similarityScore?: number | null;
      note: string;
    };
  };
  error?: {
    code: string;
    message: string;
  };
}

export interface RegistrationResponse {
  success: boolean;
  data?: {
    status: 'REGISTERED' | 'ALREADY_REGISTERED';
    hash: string;
    ipfsCID: string;
    transactionHash: string;
    blockNumber: number;
    contractAddress: string;
    metadata: any;
  };
  error?: {
    code: string;
    message: string;
  };
}

export async function hashMedia(file: File): Promise<any> {
  const formData = new FormData();
  formData.append('file', file);

  const res = await fetch(`${API_BASE}/media/hash`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Failed to hash media file');
  }
  return data.data;
}

export async function registerMedia(file: File, creator?: string): Promise<RegistrationResponse['data']> {
  const formData = new FormData();
  formData.append('file', file);
  if (creator) {
    formData.append('creator', creator);
  }

  const res = await fetch(`${API_BASE}/media/register`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Failed to register media on blockchain');
  }
  return data.data;
}

export async function verifyMediaByFile(file: File, expectedHash?: string): Promise<VerificationResponse['data']> {
  const formData = new FormData();
  formData.append('file', file);
  if (expectedHash) {
    formData.append('expectedHash', expectedHash);
  }

  const res = await fetch(`${API_BASE}/media/verify`, {
    method: 'POST',
    body: formData,
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Failed to verify media provenance');
  }
  return data.data;
}

export async function verifyMediaByHash(hash: string, expectedHash?: string): Promise<VerificationResponse['data']> {
  const res = await fetch(`${API_BASE}/media/verify`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ hash, expectedHash }),
  });

  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error?.message || 'Failed to verify media provenance');
  }
  return data.data;
}
