/**
 * Client-Side Cryptographic Hashing using the Web Crypto API
 * (crypto.subtle.digest)
 *
 * Guarantees zero unneeded data upload if only the hash needs inspection,
 * while allowing client-side preview before server submission.
 */

export interface ClientHashResult {
  algorithm: 'SHA-256';
  hash: `0x${string}`; // Ethers/Solidity bytes32 format
  rawHash: string;      // Standard 64-char lowercase hex
  size: number;
}

export async function calculateClientSha256(file: File): Promise<ClientHashResult> {
  const arrayBuffer = await file.arrayBuffer();
  
  if (typeof window === 'undefined' || !window.crypto || !window.crypto.subtle) {
    throw new Error('Web Crypto API is not supported in this browser environment.');
  }

  const hashBuffer = await window.crypto.subtle.digest('SHA-256', arrayBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const rawHash = hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');

  return {
    algorithm: 'SHA-256',
    hash: `0x${rawHash}` as `0x${string}`,
    rawHash,
    size: file.size,
  };
}

export function truncateHash(hash: string, start: number = 8, end: number = 8): string {
  if (!hash || hash.length <= start + end) return hash;
  return `${hash.slice(0, start)}...${hash.slice(-end)}`;
}
