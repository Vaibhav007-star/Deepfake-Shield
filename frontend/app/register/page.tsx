'use client';

import React, { useState } from 'react';
import { useAccount } from 'wagmi';
import { FileDropzone } from '../../components/FileDropzone';
import { TransactionStatus, PipelineStep } from '../../components/TransactionStatus';
import { ProvenanceCard } from '../../components/ProvenanceCard';
import { WalletConnect } from '../../components/WalletConnect';
import { ClientHashResult } from '../../lib/hashing';
import { registerMedia } from '../../lib/api';
import { Upload, ShieldCheck, ArrowRight, RefreshCw, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const { address, isConnected } = useAccount();

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clientHash, setClientHash] = useState<ClientHashResult | null>(null);
  const [pipelineStep, setPipelineStep] = useState<PipelineStep>('idle');
  const [errorMessage, setErrorMessage] = useState<string | undefined>(undefined);
  const [registrationResult, setRegistrationResult] = useState<any>(null);

  const handleFileSelect = (file: File, hashResult: ClientHashResult) => {
    setSelectedFile(file);
    setClientHash(hashResult);
    setPipelineStep('idle');
    setErrorMessage(undefined);
    setRegistrationResult(null);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setClientHash(null);
    setPipelineStep('idle');
    setErrorMessage(undefined);
    setRegistrationResult(null);
  };

  const handleRegister = async () => {
    if (!selectedFile || !clientHash) return;

    try {
      setErrorMessage(undefined);
      setPipelineStep('hashing');

      // Small delay for UI feedback
      await new Promise((r) => setTimeout(r, 400));
      setPipelineStep('ipfs');

      const creator = address || undefined;
      const result = await registerMedia(selectedFile, creator);

      setPipelineStep('blockchain');
      await new Promise((r) => setTimeout(r, 600));

      setRegistrationResult(result);
      setPipelineStep('completed');
    } catch (err: any) {
      console.error('Registration failed:', err);
      setErrorMessage(err.message || 'Failed to complete registration pipeline');
      setPipelineStep('error');
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-2 text-cyber-cyan font-mono text-xs uppercase tracking-wider">
          <Upload className="w-3.5 h-3.5" />
          <span>Anchor Pipeline</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Register Media Provenance
        </h1>
        <p className="text-sm text-zinc-400">
          Upload authentic media to generate an immutable cryptographic provenance record on IPFS
          and the blockchain ledger.
        </p>
      </div>

      {/* Main Form & Dropzone Card */}
      <div className="bg-surface-card/60 border border-surface-border rounded-2xl p-6 sm:p-8 space-y-6">
        <div className="space-y-2">
          <label className="block text-sm font-semibold text-white">
            1. Select Media File
          </label>
          <FileDropzone
            onFileSelect={handleFileSelect}
            onClear={handleClear}
            disabled={pipelineStep !== 'idle' && pipelineStep !== 'completed' && pipelineStep !== 'error'}
          />
        </div>

        {/* Wallet Association Section */}
        <div className="pt-4 border-t border-surface-border space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <label className="block text-sm font-semibold text-white">
                2. Attesting Creator Identity
              </label>
              <p className="text-xs text-zinc-400">
                Connect your Ethereum wallet to record your address as the verifiable media creator.
              </p>
            </div>
            <WalletConnect />
          </div>

          {isConnected && address && (
            <div className="p-3 bg-surface rounded-lg border border-surface-border text-xs font-mono flex items-center justify-between text-zinc-400">
              <span>Signing Wallet:</span>
              <span className="text-cyber-cyan truncate max-w-xs">{address}</span>
            </div>
          )}
        </div>

        {/* Action Button */}
        {selectedFile && pipelineStep !== 'completed' && (
          <div className="pt-4 border-t border-surface-border flex justify-end">
            <button
              type="button"
              onClick={handleRegister}
              disabled={pipelineStep !== 'idle' && pipelineStep !== 'error'}
              className="flex items-center space-x-2 px-8 py-3 rounded-xl bg-cyber-cyan text-background font-bold text-sm hover:bg-cyan-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-950/40"
            >
              <span>Anchor to Provenance Registry</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* Pipeline Status Progress */}
      {pipelineStep !== 'idle' && (
        <TransactionStatus
          currentStep={pipelineStep}
          errorMessage={errorMessage}
          txHash={registrationResult?.transactionHash}
          blockNumber={registrationResult?.blockNumber}
        />
      )}

      {/* Provenance Card on Success */}
      {registrationResult && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-cyber-emerald" />
              <span>Immutable Provenance Record Generated</span>
            </h3>

            <button
              onClick={handleClear}
              type="button"
              className="flex items-center space-x-1.5 text-xs text-zinc-400 hover:text-white bg-surface border border-surface-border px-3 py-1.5 rounded-lg transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Register Another</span>
            </button>
          </div>

          <ProvenanceCard
            fileHash={registrationResult.hash}
            creator={registrationResult.metadata?.creator || address || 'Registry Service'}
            timestamp={registrationResult.metadata?.createdAt || Date.now()}
            ipfsCID={registrationResult.ipfsCID}
            transactionHash={registrationResult.transactionHash}
            metadata={registrationResult.metadata}
          />
        </div>
      )}
    </div>
  );
}
