'use client';

import React from 'react';
import { CheckCircle2, Loader2, Circle, AlertCircle } from 'lucide-react';

export type PipelineStep = 'idle' | 'hashing' | 'ipfs' | 'blockchain' | 'completed' | 'error';

interface TransactionStatusProps {
  currentStep: PipelineStep;
  errorMessage?: string;
  txHash?: string;
  blockNumber?: number;
}

export function TransactionStatus({
  currentStep,
  errorMessage,
  txHash,
  blockNumber,
}: TransactionStatusProps) {
  if (currentStep === 'idle') return null;

  const steps = [
    {
      id: 'hashing',
      name: 'Client-Side SHA-256 Fingerprint',
      desc: 'Generating byte-level SHA-256 hash using Web Crypto API',
    },
    {
      id: 'ipfs',
      name: 'IPFS Decentralized Storage',
      desc: 'Pinning raw media file and provenance metadata bundle',
    },
    {
      id: 'blockchain',
      name: 'On-Chain Ledger Anchor',
      desc: 'Registering immutable hash & CID via ProvenanceRegistry.sol',
    },
    {
      id: 'completed',
      name: 'Provenance Finalized',
      desc: 'Record confirmed on decentralized EVM ledger',
    },
  ];

  const getStepState = (stepId: string) => {
    const order = ['hashing', 'ipfs', 'blockchain', 'completed'];
    const currentIndex = order.indexOf(currentStep);
    const stepIndex = order.indexOf(stepId);

    if (currentStep === 'error') {
      return stepIndex <= currentIndex ? 'error' : 'upcoming';
    }

    if (stepIndex < currentIndex || currentStep === 'completed') {
      return 'completed';
    } else if (stepIndex === currentIndex) {
      return 'current';
    } else {
      return 'upcoming';
    }
  };

  return (
    <div className="bg-surface-card border border-surface-border rounded-xl p-6 space-y-5">
      <div className="flex items-center justify-between border-b border-surface-border pb-3">
        <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider flex items-center gap-2">
          <span>Pipeline Progress</span>
        </h4>
        <span className="text-[11px] font-mono text-cyber-cyan uppercase">
          {currentStep === 'completed'
            ? 'Success'
            : currentStep === 'error'
            ? 'Halted'
            : 'In Progress'}
        </span>
      </div>

      <div className="space-y-4">
        {steps.map((step) => {
          const state = getStepState(step.id);

          return (
            <div key={step.id} className="flex items-start space-x-3 text-xs">
              <div className="mt-0.5 shrink-0">
                {state === 'completed' && (
                  <CheckCircle2 className="w-4 h-4 text-cyber-emerald" />
                )}
                {state === 'current' && (
                  <Loader2 className="w-4 h-4 text-cyber-cyan animate-spin" />
                )}
                {state === 'upcoming' && (
                  <Circle className="w-4 h-4 text-zinc-600" />
                )}
                {state === 'error' && (
                  <AlertCircle className="w-4 h-4 text-cyber-red" />
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p
                  className={`font-mono font-medium ${
                    state === 'completed'
                      ? 'text-zinc-200'
                      : state === 'current'
                      ? 'text-cyber-cyan'
                      : state === 'error'
                      ? 'text-cyber-red'
                      : 'text-zinc-500'
                  }`}
                >
                  {step.name}
                </p>
                <p className="text-[11px] text-zinc-500">{step.desc}</p>
              </div>
            </div>
          );
        })}
      </div>

      {txHash && (
        <div className="pt-3 border-t border-surface-border text-xs font-mono space-y-1">
          <div className="flex justify-between text-zinc-400">
            <span>Transaction Hash:</span>
            <span className="text-cyber-cyan truncate max-w-[200px]" title={txHash}>
              {txHash}
            </span>
          </div>
          {blockNumber !== undefined && blockNumber > 0 && (
            <div className="flex justify-between text-zinc-400">
              <span>Block Number:</span>
              <span className="text-white font-semibold">{blockNumber}</span>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-xs flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
