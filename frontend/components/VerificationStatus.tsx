'use client';

import React from 'react';
import { CheckCircle2, AlertTriangle, HelpCircle, XCircle, ShieldCheck } from 'lucide-react';

export type StatusType = 'AUTHENTIC' | 'MODIFIED' | 'NOT_REGISTERED' | 'ERROR';

interface VerificationStatusProps {
  status: StatusType;
  message?: string;
  className?: string;
}

export function VerificationStatus({ status, message, className = '' }: VerificationStatusProps) {
  const statusConfig = {
    AUTHENTIC: {
      title: 'AUTHENTIC PROVENANCE',
      defaultMessage: 'This file matches a registered on-chain provenance record.',
      subnote: 'The exact byte sequence corresponds to the original timestamped registration.',
      borderColor: 'border-emerald-500/50',
      bgColor: 'bg-emerald-950/20',
      textColor: 'text-emerald-400',
      glowColor: 'shadow-[0_0_25px_rgba(16,185,129,0.15)]',
      icon: <ShieldCheck className="w-8 h-8 text-emerald-400" />,
      badge: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    },
    MODIFIED: {
      title: 'MODIFIED FILE',
      defaultMessage:
        'The current file fingerprint does not match the registered provenance record.',
      subnote:
        'Cryptographic hash divergence indicates byte modification (e.g. re-encoding, pixel manipulation, or tampering). It does not definitively prove AI generation.',
      borderColor: 'border-amber-500/50',
      bgColor: 'bg-amber-950/20',
      textColor: 'text-amber-400',
      glowColor: 'shadow-[0_0_25px_rgba(245,158,11,0.15)]',
      icon: <AlertTriangle className="w-8 h-8 text-amber-400" />,
      badge: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    },
    NOT_REGISTERED: {
      title: 'NOT REGISTERED',
      defaultMessage:
        'No matching provenance record was found on the configured blockchain registry.',
      subnote:
        'This file has not yet been registered into this Deepfake Shield smart contract registry.',
      borderColor: 'border-zinc-700',
      bgColor: 'bg-surface-card/60',
      textColor: 'text-zinc-300',
      glowColor: '',
      icon: <HelpCircle className="w-8 h-8 text-zinc-400" />,
      badge: 'bg-zinc-800 text-zinc-400 border-zinc-700',
    },
    ERROR: {
      title: 'VERIFICATION ERROR',
      defaultMessage: 'Unable to complete verification.',
      subnote: 'Please verify your network connection, RPC endpoint, or try again shortly.',
      borderColor: 'border-red-500/50',
      bgColor: 'bg-red-950/20',
      textColor: 'text-red-400',
      glowColor: 'shadow-[0_0_25px_rgba(239,68,68,0.15)]',
      icon: <XCircle className="w-8 h-8 text-red-400" />,
      badge: 'bg-red-500/10 text-red-300 border-red-500/30',
    },
  };

  const current = statusConfig[status];

  return (
    <div
      className={`border rounded-xl p-6 transition-all ${current.borderColor} ${current.bgColor} ${current.glowColor} ${className}`}
    >
      <div className="flex items-start space-x-4">
        <div className="shrink-0 p-2.5 rounded-lg bg-surface border border-surface-border">
          {current.icon}
        </div>

        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center space-x-2">
            <h3 className={`text-lg font-bold tracking-wide ${current.textColor}`}>
              {current.title}
            </h3>
            <span
              className={`text-[10px] font-mono px-2 py-0.5 rounded border uppercase ${current.badge}`}
            >
              Verified State
            </span>
          </div>

          <p className="text-sm text-zinc-200 leading-relaxed font-medium">
            {message || current.defaultMessage}
          </p>

          <p className="text-xs text-zinc-400 leading-normal">{current.subnote}</p>
        </div>
      </div>
    </div>
  );
}
