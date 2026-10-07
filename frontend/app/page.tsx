import React from 'react';
import Link from 'next/link';
import {
  Shield,
  Upload,
  FileSearch,
  CheckCircle,
  Database,
  Lock,
  Cpu,
  ArrowRight,
  Fingerprint,
  Layers,
  FileCheck2,
} from 'lucide-react';

export default function HomePage() {
  return (
    <div className="space-y-24 py-8">
      {/* Hero Section */}
      <section className="text-center space-y-6 max-w-4xl mx-auto pt-8">
        <div className="inline-flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cyber-cyan/10 border border-cyber-cyan/30 text-cyber-cyan text-xs font-mono uppercase tracking-wider">
          <Shield className="w-3.5 h-3.5" />
          <span>Decentralized Media Provenance Pipeline</span>
        </div>

        <h1 className="text-4xl sm:text-6xl font-extrabold text-white tracking-tight leading-tight">
          Deepfake <span className="text-cyber-cyan">Shield</span>
        </h1>

        <p className="text-xl sm:text-2xl text-zinc-300 font-light max-w-2xl mx-auto leading-relaxed">
          Verify the provenance of digital media <br />
          <span className="text-white font-semibold">before you trust it.</span>
        </p>

        <p className="text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
          Anchor cryptographic fingerprints to the Ethereum blockchain and IPFS decentralized
          storage. Detect unauthorized modifications, verify publisher identity, and audit media history with immutable proof.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
          <Link
            href="/register"
            className="w-full sm:w-auto flex items-center justify-center space-x-2.5 px-8 py-3.5 rounded-xl bg-cyber-cyan text-background font-bold text-sm hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-950/50 hover:shadow-cyan-900/60"
          >
            <Upload className="w-4 h-4" />
            <span>Register Media</span>
          </Link>

          <Link
            href="/verify"
            className="w-full sm:w-auto flex items-center justify-center space-x-2.5 px-8 py-3.5 rounded-xl bg-surface-card border border-surface-border text-white font-semibold text-sm hover:bg-surface hover:border-cyber-cyan/40 transition-all"
          >
            <FileSearch className="w-4 h-4 text-cyber-cyan" />
            <span>Verify Media</span>
          </Link>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="space-y-12">
        <div className="text-center space-y-2">
          <span className="text-xs font-mono uppercase text-cyber-cyan tracking-widest">
            Pipeline Architecture
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            How It Works
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            From client-side computation to immutable blockchain anchoring in four deterministic steps.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {/* Step 1 */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-6 relative group hover:border-cyber-cyan/50 transition-colors space-y-4">
            <div className="w-10 h-10 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center text-cyber-cyan font-mono font-bold text-sm">
              01
            </div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Fingerprint className="w-4 h-4 text-cyber-cyan" /> Fingerprint
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Generate a deterministic 256-bit SHA-256 cryptographic hash client-side via the Web Crypto API, verified independently by backend validation.
            </p>
          </div>

          {/* Step 2 */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-6 relative group hover:border-cyber-emerald/50 transition-colors space-y-4">
            <div className="w-10 h-10 rounded-lg bg-cyber-emerald/10 border border-cyber-emerald/30 flex items-center justify-center text-cyber-emerald font-mono font-bold text-sm">
              02
            </div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Database className="w-4 h-4 text-cyber-emerald" /> Store (IPFS)
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Upload and pin the media and provenance metadata bundle to the InterPlanetary File System (IPFS), generating an immutable Content Identifier (CID).
            </p>
          </div>

          {/* Step 3 */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-6 relative group hover:border-purple-500/50 transition-colors space-y-4">
            <div className="w-10 h-10 rounded-lg bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400 font-mono font-bold text-sm">
              03
            </div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Lock className="w-4 h-4 text-purple-400" /> Anchor
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Submit the media hash and IPFS CID to the <code className="text-purple-300 font-mono">ProvenanceRegistry.sol</code> smart contract, recording creator and block timestamp.
            </p>
          </div>

          {/* Step 4 */}
          <div className="bg-surface-card border border-surface-border rounded-xl p-6 relative group hover:border-cyber-cyan/50 transition-colors space-y-4">
            <div className="w-10 h-10 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center text-cyber-cyan font-mono font-bold text-sm">
              04
            </div>
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <FileCheck2 className="w-4 h-4 text-cyber-cyan" /> Verify
            </h3>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Anyone can audit suspect media by re-computing the hash and querying the blockchain registry to establish authenticity, modification, or lack of registration.
            </p>
          </div>
        </div>
      </section>

      {/* Trust & Provenance Model Section */}
      <section className="bg-surface-card/60 border border-surface-border rounded-2xl p-8 sm:p-12 space-y-8">
        <div className="max-w-3xl space-y-3">
          <span className="text-xs font-mono uppercase text-cyber-cyan tracking-widest">
            Cryptographic Integrity vs AI Detection
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
            The Trust Model: Authenticity Through Provenance
          </h2>
          <p className="text-sm text-zinc-400 leading-relaxed">
            Deepfake Shield is built on rigorous cryptographic guarantees rather than heuristic AI detectors. Here is how our three-tier security model operates:
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-5 rounded-xl bg-surface border border-surface-border space-y-2.5">
            <div className="text-cyber-cyan font-mono font-semibold text-sm">
              1. Cryptographic Integrity
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Exact byte-level verification using SHA-256. If a single pixel, frame, or audio sample is altered, the avalanche effect guarantees a completely different hash.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-surface border border-surface-border space-y-2.5">
            <div className="text-cyber-emerald font-mono font-semibold text-sm">
              2. On-Chain Provenance
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Immutable ledger record linking the file hash to an authenticated creator wallet address and an indisputable consensus timestamp.
            </p>
          </div>

          <div className="p-5 rounded-xl bg-surface border border-surface-border space-y-2.5">
            <div className="text-amber-400 font-mono font-semibold text-sm">
              3. Perceptual Analysis (pHash)
            </div>
            <p className="text-xs text-zinc-400 leading-relaxed">
              Extensible perceptual hashing integration hook designed to evaluate perceptual similarity across compression artifacts and resolution scaling.
            </p>
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="border border-surface-border bg-gradient-to-r from-surface to-surface-card rounded-2xl p-8 sm:p-10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-2 text-center md:text-left">
          <h3 className="text-xl sm:text-2xl font-bold text-white">
            Ready to anchor or verify digital media?
          </h3>
          <p className="text-xs sm:text-sm text-zinc-400">
            Start protecting copyright, journalistic integrity, and official media publications today.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Link
            href="/register"
            className="px-6 py-3 rounded-lg bg-cyber-cyan text-background font-bold text-sm hover:bg-cyan-400 transition-colors flex items-center gap-2"
          >
            <span>Anchor Media</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/verify"
            className="px-6 py-3 rounded-lg bg-surface border border-surface-border text-white font-medium text-sm hover:bg-surface-border transition-colors"
          >
            Verify a File
          </Link>
        </div>
      </section>
    </div>
  );
}
