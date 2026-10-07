'use client';

import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { hardhat, sepolia, mainnet } from 'wagmi/chains';

// Public project ID for WalletConnect / RainbowKit
const projectId =
  process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '3a8170812b534d0ff9d794f168fa4d80';

export const wagmiConfig = getDefaultConfig({
  appName: 'Deepfake Shield',
  projectId,
  chains: [hardhat, sepolia, mainnet],
  ssr: true,
});
