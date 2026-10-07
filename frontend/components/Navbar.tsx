'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Shield, CheckCircle2, Upload, FileSearch } from 'lucide-react';
import { ConnectButton } from '@rainbow-me/rainbowkit';

export function Navbar() {
  const pathname = usePathname();

  const navLinks = [
    { href: '/', label: 'Overview', icon: Shield },
    { href: '/register', label: 'Register Media', icon: Upload },
    { href: '/verify', label: 'Verify Media', icon: FileSearch },
  ];

  return (
    <header className="sticky top-0 z-50 backdrop-blur-md bg-background/80 border-b border-surface-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Link href="/" className="flex items-center space-x-2.5 group">
            <div className="w-9 h-9 rounded-lg bg-cyber-cyan/10 border border-cyber-cyan/30 flex items-center justify-center text-cyber-cyan group-hover:border-cyber-cyan transition-colors">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-wide flex items-center gap-1.5">
                DEEPFAKE<span className="text-cyber-cyan">SHIELD</span>
              </span>
              <span className="text-[10px] text-zinc-400 block -mt-1 font-mono uppercase tracking-widest">
                Provenance Protocol
              </span>
            </div>
          </Link>
        </div>

        <nav className="hidden md:flex items-center space-x-1">
          {navLinks.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center space-x-2 px-3.5 py-1.5 rounded-md text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-surface-border/70 text-cyber-cyan border border-cyber-cyan/30'
                    : 'text-zinc-400 hover:text-white hover:bg-surface-card'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center space-x-3">
          <ConnectButton
            chainStatus="icon"
            showBalance={false}
            accountStatus={{
              smallScreen: 'avatar',
              largeScreen: 'full',
            }}
          />
        </div>
      </div>
    </header>
  );
}
