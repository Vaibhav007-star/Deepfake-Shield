import React from 'react';
import { Shield, Lock, Database, Cpu } from 'lucide-react';

export function Footer() {
  return (
    <footer className="border-t border-surface-border bg-surface/50 mt-20 text-zinc-400 text-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="space-y-3">
            <div className="flex items-center space-x-2 text-white font-bold tracking-wide">
              <Shield className="w-4 h-4 text-cyber-cyan" />
              <span>Deepfake Shield</span>
            </div>
            <p className="text-zinc-500 leading-relaxed">
              Decentralized media authenticity and provenance pipeline anchoring cryptographic
              fingerprints to EVM-compatible ledgers.
            </p>
          </div>

          <div>
            <div className="text-zinc-200 font-semibold mb-3">Integrity Pillars</div>
            <ul className="space-y-2 text-zinc-500">
              <li className="flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5 text-cyber-cyan" /> SHA-256 Byte Verification
              </li>
              <li className="flex items-center gap-1.5">
                <Database className="w-3.5 h-3.5 text-cyber-emerald" /> IPFS Content Addressing
              </li>
              <li className="flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5 text-purple-400" /> Immutable Smart Contract Anchor
              </li>
            </ul>
          </div>

          <div>
            <div className="text-zinc-200 font-semibold mb-3">Supported Media</div>
            <p className="text-zinc-500 leading-relaxed">
              Accepts Images (JPG, PNG, WebP), Videos (MP4, WebM, MOV), and Audio (MP3, WAV, AAC). Client-side SHA-256 is generated instantly via the Web Crypto API.
            </p>
          </div>

          <div>
            <div className="text-zinc-200 font-semibold mb-3">Verification Disclaimer</div>
            <p className="text-zinc-500 leading-relaxed">
              Deepfake Shield verifies whether an exact file matches a historically anchored provenance record. It certifies origin and immutability, not probabilistic generative AI likelihood.
            </p>
          </div>
        </div>

        <div className="border-t border-surface-border pt-6 flex flex-col sm:flex-row items-center justify-between text-zinc-600">
          <div>© {new Date().getFullYear()} Deepfake Shield Protocol. Open-source MIT.</div>
          <div className="font-mono text-[11px] mt-2 sm:mt-0">
            Smart Contract: ProvenanceRegistry.sol (EVM)
          </div>
        </div>
      </div>
    </footer>
  );
}
