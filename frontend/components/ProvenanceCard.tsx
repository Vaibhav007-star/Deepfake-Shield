'use client';

import React from 'react';
import { ShieldCheck, ExternalLink, Calendar, User, HardDrive, Hash, Layers } from 'lucide-react';
import { HashDisplay } from './HashDisplay';

interface ProvenanceCardProps {
  fileHash: string;
  creator: string;
  timestamp: number | string;
  ipfsCID?: string;
  transactionHash?: string;
  metadata?: {
    fileName?: string;
    mimeType?: string;
    fileSize?: number;
    blockchain?: string;
    contractAddress?: string;
  } | null;
  className?: string;
}

export function ProvenanceCard({
  fileHash,
  creator,
  timestamp,
  ipfsCID,
  transactionHash,
  metadata,
  className = '',
}: ProvenanceCardProps) {
  const formattedDate =
    typeof timestamp === 'number'
      ? new Date(timestamp * 1000).toUTCString()
      : new Date(timestamp).toUTCString();

  const ipfsGateway = process.env.NEXT_PUBLIC_IPFS_GATEWAY || 'https://ipfs.io/ipfs';

  const formatFileSize = (bytes?: number): string => {
    if (!bytes) return 'Unknown size';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  };

  return (
    <div
      className={`bg-surface-card border border-surface-border rounded-xl overflow-hidden shadow-xl ${className}`}
    >
      {/* Header Banner */}
      <div className="bg-surface px-6 py-4 border-b border-surface-border flex items-center justify-between">
        <div className="flex items-center space-x-2.5">
          <div className="w-7 h-7 rounded-full bg-cyber-emerald/10 border border-cyber-emerald/30 flex items-center justify-center text-cyber-emerald">
            <ShieldCheck className="w-4 h-4" />
          </div>
          <span className="font-mono text-xs font-bold text-cyber-emerald uppercase tracking-wider">
            Verified Provenance Certificate
          </span>
        </div>

        <span className="text-[11px] font-mono text-zinc-400 bg-surface-card px-2.5 py-1 rounded border border-surface-border">
          EVM Verified
        </span>
      </div>

      <div className="p-6 space-y-6">
        {/* SHA-256 Fingerprint */}
        <HashDisplay hash={fileHash} label="Cryptographic Media Fingerprint (SHA-256)" />

        {/* Core Provenance Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
          {/* Creator Address */}
          <div className="bg-surface/60 border border-surface-border rounded-lg p-3 space-y-1">
            <div className="text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-cyber-cyan" />
              <span>Registered Creator</span>
            </div>
            <div className="text-white text-sm break-all font-semibold select-all pt-0.5">
              {creator || 'Unknown'}
            </div>
          </div>

          {/* Registration Timestamp */}
          <div className="bg-surface/60 border border-surface-border rounded-lg p-3 space-y-1">
            <div className="text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-cyber-emerald" />
              <span>Timestamp (UTC)</span>
            </div>
            <div className="text-white text-sm font-semibold pt-0.5">{formattedDate}</div>
          </div>

          {/* IPFS CID */}
          {ipfsCID && (
            <div className="bg-surface/60 border border-surface-border rounded-lg p-3 space-y-1 md:col-span-2">
              <div className="text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <HardDrive className="w-3.5 h-3.5 text-amber-400" />
                  <span>IPFS Content Identifier (CID)</span>
                </span>
                <a
                  href={`${ipfsGateway}/${ipfsCID}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-cyber-cyan hover:underline flex items-center gap-1 text-[11px]"
                >
                  Gateway <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <div className="text-zinc-200 text-xs break-all select-all font-mono pt-0.5">
                {ipfsCID}
              </div>
            </div>
          )}

          {/* Transaction Hash */}
          {transactionHash && transactionHash !== 'EXISTING_RECORD' && (
            <div className="bg-surface/60 border border-surface-border rounded-lg p-3 space-y-1 md:col-span-2">
              <div className="text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-purple-400" />
                <span>On-Chain Transaction Hash</span>
              </div>
              <div className="text-zinc-200 text-xs break-all select-all font-mono pt-0.5">
                {transactionHash}
              </div>
            </div>
          )}
        </div>

        {/* Metadata section if available */}
        {metadata && (
          <div className="border-t border-surface-border pt-4">
            <div className="text-xs uppercase tracking-wider text-zinc-400 font-mono flex items-center gap-1.5 mb-2.5">
              <Layers className="w-3.5 h-3.5 text-zinc-400" />
              <span>Media Metadata Payload</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs font-mono">
              {metadata.fileName && (
                <div className="p-2 bg-surface/40 rounded border border-surface-border/70">
                  <span className="text-zinc-500 block text-[10px]">File Name</span>
                  <span className="text-zinc-300 truncate block" title={metadata.fileName}>
                    {metadata.fileName}
                  </span>
                </div>
              )}
              {metadata.fileSize && (
                <div className="p-2 bg-surface/40 rounded border border-surface-border/70">
                  <span className="text-zinc-500 block text-[10px]">File Size</span>
                  <span className="text-zinc-300 block">{formatFileSize(metadata.fileSize)}</span>
                </div>
              )}
              {metadata.mimeType && (
                <div className="p-2 bg-surface/40 rounded border border-surface-border/70">
                  <span className="text-zinc-500 block text-[10px]">MIME Type</span>
                  <span className="text-zinc-300 block">{metadata.mimeType}</span>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
