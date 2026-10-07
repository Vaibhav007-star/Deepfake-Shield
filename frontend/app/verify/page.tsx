'use client';

import React, { useState } from 'react';
import { FileDropzone } from '../../components/FileDropzone';
import { VerificationStatus, StatusType } from '../../components/VerificationStatus';
import { ProvenanceCard } from '../../components/ProvenanceCard';
import { HashDisplay } from '../../components/HashDisplay';
import { ClientHashResult } from '../../lib/hashing';
import { verifyMediaByFile, verifyMediaByHash, VerificationResponse } from '../../lib/api';
import { FileSearch, Search, Hash, UploadCloud, RefreshCw, AlertCircle, HelpCircle } from 'lucide-react';

export default function VerifyPage() {
  const [activeTab, setActiveTab] = useState<'upload' | 'hash'>('upload');

  // File Upload State
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [clientHash, setClientHash] = useState<ClientHashResult | null>(null);

  // Manual Hash State
  const [manualHash, setManualHash] = useState('');
  const [expectedHash, setExpectedHash] = useState('');

  // Execution & Result State
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<VerificationResponse['data'] | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleFileSelect = (file: File, hashRes: ClientHashResult) => {
    setSelectedFile(file);
    setClientHash(hashRes);
    setResult(null);
    setErrorMessage(null);
  };

  const handleClear = () => {
    setSelectedFile(null);
    setClientHash(null);
    setResult(null);
    setErrorMessage(null);
  };

  const handleVerify = async () => {
    setErrorMessage(null);
    setResult(null);
    setIsLoading(true);

    try {
      if (activeTab === 'upload') {
        if (!selectedFile) {
          throw new Error('Please select a media file to verify.');
        }
        const data = await verifyMediaByFile(
          selectedFile,
          expectedHash.trim() ? expectedHash.trim() : undefined
        );
        setResult(data);
      } else {
        if (!manualHash.trim()) {
          throw new Error('Please enter a SHA-256 hash to verify.');
        }
        const data = await verifyMediaByHash(
          manualHash.trim(),
          expectedHash.trim() ? expectedHash.trim() : undefined
        );
        setResult(data);
      }
    } catch (err: any) {
      console.error('Verification error:', err);
      setErrorMessage(err.message || 'Verification failed. Please check network connectivity.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 py-6">
      {/* Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center space-x-2 text-cyber-cyan font-mono text-xs uppercase tracking-wider">
          <FileSearch className="w-3.5 h-3.5" />
          <span>Verification Protocol</span>
        </div>
        <h1 className="text-3xl font-extrabold text-white tracking-tight">
          Verify Media Provenance
        </h1>
        <p className="text-sm text-zinc-400">
          Audit media against immutable on-chain records to verify publisher origin, detect byte-level
          modifications, or determine if a file is unregistered.
        </p>
      </div>

      {/* Main Verification Card */}
      <div className="bg-surface-card/60 border border-surface-border rounded-2xl p-6 sm:p-8 space-y-6">
        {/* Tab Selector */}
        <div className="flex border-b border-surface-border pb-4 gap-4">
          <button
            type="button"
            onClick={() => {
              setActiveTab('upload');
              setResult(null);
              setErrorMessage(null);
            }}
            className={`flex items-center space-x-2 pb-2 text-sm font-semibold transition-all border-b-2 -mb-4 ${
              activeTab === 'upload'
                ? 'text-cyber-cyan border-cyber-cyan'
                : 'text-zinc-400 border-transparent hover:text-white'
            }`}
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Media File</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('hash');
              setResult(null);
              setErrorMessage(null);
            }}
            className={`flex items-center space-x-2 pb-2 text-sm font-semibold transition-all border-b-2 -mb-4 ${
              activeTab === 'hash'
                ? 'text-cyber-cyan border-cyber-cyan'
                : 'text-zinc-400 border-transparent hover:text-white'
            }`}
          >
            <Hash className="w-4 h-4" />
            <span>Direct Hash Lookup</span>
          </button>
        </div>

        {/* Tab 1: File Upload */}
        {activeTab === 'upload' && (
          <div className="space-y-4 pt-2">
            <FileDropzone
              onFileSelect={handleFileSelect}
              onClear={handleClear}
              disabled={isLoading}
            />
          </div>
        )}

        {/* Tab 2: Manual Hash Lookup */}
        {activeTab === 'hash' && (
          <div className="space-y-4 pt-2">
            <div>
              <label htmlFor="manual-hash-input" className="block text-xs uppercase tracking-wider text-zinc-400 font-mono mb-1.5">
                Target SHA-256 Hash
              </label>
              <input
                id="manual-hash-input"
                type="text"
                placeholder="0x... or 64-character hex hash"
                value={manualHash}
                onChange={(e) => setManualHash(e.target.value)}
                disabled={isLoading}
                className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2.5 text-sm font-mono text-white placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyber-cyan"
              />
            </div>
          </div>
        )}

        {/* Optional Expected Hash for Tamper / Modification Detection */}
        <div className="pt-4 border-t border-surface-border space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="expected-hash-input" className="text-xs uppercase tracking-wider text-zinc-400 font-mono">
              Expected Original Hash (Optional)
            </label>
            <span className="text-[11px] text-zinc-500 font-mono">For divergence check</span>
          </div>
          <input
            id="expected-hash-input"
            type="text"
            placeholder="Claimed prior hash to test for modification"
            value={expectedHash}
            onChange={(e) => setExpectedHash(e.target.value)}
            disabled={isLoading}
            className="w-full bg-surface border border-surface-border rounded-lg px-4 py-2 text-xs font-mono text-zinc-300 placeholder-zinc-600 focus:outline-none focus:ring-1 focus:ring-cyber-cyan"
          />
        </div>

        {/* Verify Action Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="button"
            onClick={handleVerify}
            disabled={isLoading || (activeTab === 'upload' && !selectedFile) || (activeTab === 'hash' && !manualHash.trim())}
            className="flex items-center space-x-2 px-8 py-3 rounded-xl bg-cyber-cyan text-background font-bold text-sm hover:bg-cyan-400 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-cyan-950/40"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-background border-t-transparent rounded-full animate-spin" />
                <span>Auditing Blockchain Ledger...</span>
              </>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Verify Provenance</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Error Display */}
      {errorMessage && (
        <VerificationStatus status="ERROR" message={errorMessage} />
      )}

      {/* Verification Result Display */}
      {result && (
        <div className="space-y-6">
          <VerificationStatus status={result.status} message={result.message} />

          {result.record && (
            <ProvenanceCard
              fileHash={result.hash}
              creator={result.record.creator}
              timestamp={result.record.timestamp}
              ipfsCID={result.record.ipfsCID}
              metadata={result.metadata}
            />
          )}

          {result.status === 'NOT_REGISTERED' && (
            <div className="bg-surface-card border border-surface-border rounded-xl p-5 text-xs text-zinc-400 space-y-2">
              <div className="font-semibold text-white flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyber-cyan" />
                <span>What does Not Registered mean?</span>
              </div>
              <p className="leading-relaxed">
                No matching cryptographic record exists on the configured smart contract registry. This media may be original, modified, or simply never anchored to this registry.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
