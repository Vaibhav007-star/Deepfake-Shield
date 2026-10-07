'use client';

import React from 'react';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { Wallet, ChevronDown } from 'lucide-react';

export function WalletConnect() {
  return (
    <ConnectButton.Custom>
      {({
        account,
        chain,
        openAccountModal,
        openChainModal,
        openConnectModal,
        mounted,
      }) => {
        const ready = mounted;
        const connected = ready && account && chain;

        return (
          <div
            {...(!ready && {
              'aria-hidden': true,
              style: {
                opacity: 0,
                pointerEvents: 'none',
                userSelect: 'none',
              },
            })}
          >
            {(() => {
              if (!connected) {
                return (
                  <button
                    onClick={openConnectModal}
                    type="button"
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg bg-cyber-cyan text-background font-semibold text-sm hover:bg-cyan-400 transition-colors shadow-lg shadow-cyan-950/40"
                  >
                    <Wallet className="w-4 h-4" />
                    <span>Connect Wallet</span>
                  </button>
                );
              }

              if (chain.unsupported) {
                return (
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="flex items-center space-x-1.5 px-3.5 py-1.5 rounded-lg bg-red-500/20 text-red-400 border border-red-500/40 font-mono text-xs hover:bg-red-500/30 transition-colors"
                  >
                    <span>Wrong Network</span>
                    <ChevronDown className="w-3.5 h-3.5" />
                  </button>
                );
              }

              return (
                <div className="flex items-center space-x-2">
                  <button
                    onClick={openChainModal}
                    type="button"
                    className="flex items-center space-x-1.5 px-2.5 py-1.5 rounded-lg bg-surface border border-surface-border text-zinc-300 font-mono text-xs hover:bg-surface-card transition-colors"
                  >
                    {chain.hasIcon && (
                      <div
                        style={{
                          background: chain.iconBackground,
                          width: 12,
                          height: 12,
                          borderRadius: 999,
                          overflow: 'hidden',
                          marginRight: 4,
                        }}
                      >
                        {chain.iconUrl && (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            alt={chain.name ?? 'Chain icon'}
                            src={chain.iconUrl}
                            style={{ width: 12, height: 12 }}
                          />
                        )}
                      </div>
                    )}
                    <span>{chain.name}</span>
                    <ChevronDown className="w-3 h-3 text-zinc-500" />
                  </button>

                  <button
                    onClick={openAccountModal}
                    type="button"
                    className="flex items-center space-x-2 px-3 py-1.5 rounded-lg bg-surface-card border border-surface-border text-white font-mono text-xs hover:border-cyber-cyan/50 transition-colors"
                  >
                    <div className="w-2 h-2 rounded-full bg-cyber-emerald animate-pulse" />
                    <span>{account.displayName}</span>
                    <ChevronDown className="w-3 h-3 text-zinc-500" />
                  </button>
                </div>
              );
            })()}
          </div>
        );
      }}
    </ConnectButton.Custom>
  );
}
