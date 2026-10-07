'use client';

import React, { useState } from 'react';
import { Copy, Check, Eye, EyeOff } from 'lucide-react';
import { truncateHash } from '../lib/hashing';

interface HashDisplayProps {
  hash: string;
  label?: string;
  showToggleFull?: boolean;
  className?: string;
}

export function HashDisplay({
  hash,
  label = 'SHA-256',
  showToggleFull = true,
  className = '',
}: HashDisplayProps) {
  const [copied, setCopied] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(hash);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const displayText = expanded ? hash : truncateHash(hash, 10, 10);

  return (
    <div className={`flex flex-col space-y-1 ${className}`}>
      {label && (
        <span className="text-xs uppercase tracking-wider text-zinc-400 font-mono flex items-center justify-between">
          <span>{label}</span>
          <span className="text-[10px] text-zinc-500 lowercase">
            {hash.length === 66 ? 'bytes32 (256-bit)' : `${hash.length} chars`}
          </span>
        </span>
      )}
      <div className="flex items-center justify-between bg-surface-card/80 border border-surface-border rounded-lg px-3 py-2">
        <span
          className="font-mono text-xs sm:text-sm text-cyber-cyan select-all break-all mr-2"
          title={hash}
        >
          {displayText}
        </span>
        <div className="flex items-center space-x-1 shrink-0">
          {showToggleFull && hash.length > 24 && (
            <button
              type="button"
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? 'Collapse hash' : 'Show full hash'}
              className="p-1.5 text-zinc-400 hover:text-white rounded hover:bg-surface-border transition-colors"
              title={expanded ? 'Collapse hash' : 'Show full hash'}
            >
              {expanded ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
          )}
          <button
            type="button"
            onClick={handleCopy}
            aria-label="Copy hash to clipboard"
            className="flex items-center space-x-1 px-2 py-1 text-xs font-mono text-zinc-300 hover:text-white bg-surface-border/50 hover:bg-surface-border rounded transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-cyber-emerald" />
                <span className="text-cyber-emerald">Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
