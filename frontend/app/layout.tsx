import React from 'react';
import type { Metadata } from 'next';
import './globals.css';
import { Providers } from '../components/Providers';
import { Navbar } from '../components/Navbar';
import { Footer } from '../components/Footer';

export const metadata: Metadata = {
  title: 'Deepfake Shield — Decentralized Media Provenance Pipeline',
  description:
    'Verify the provenance and authenticity of digital media before you trust it using cryptographic fingerprints, IPFS, and EVM smart contracts.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-zinc-100 min-h-screen flex flex-col cyber-grid antialiased">
        <Providers>
          <Navbar />
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
          <Footer />
        </Providers>
      </body>
    </html>
  );
}
