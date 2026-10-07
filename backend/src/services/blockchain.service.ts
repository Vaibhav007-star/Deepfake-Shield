import { ethers } from 'ethers';
import fs from 'fs';
import path from 'path';
import { env, getContractAddress } from '../config/env';
import { logger } from '../utils/logger';
import { MediaRecord } from '../types/provenance';

export const PROVENANCE_REGISTRY_ABI = [
  'function registerMedia(bytes32 _fileHash, string calldata _ipfsCID) external',
  'function verifyMedia(bytes32 _fileHash) external view returns (tuple(bytes32 fileHash, string ipfsCID, address creator, uint256 timestamp, bool isVerified))',
  'function mediaExists(bytes32 _fileHash) external view returns (bool)',
  'function totalRegisteredMedia() external view returns (uint256)',
  'function getHashByIndex(uint256 index) external view returns (bytes32)',
  'function owner() external view returns (address)',
  'event MediaRegistered(bytes32 indexed fileHash, string ipfsCID, address indexed creator, uint256 timestamp)',
  'error InvalidFileHash()',
  'error InvalidIPFSCID()',
  'error MediaAlreadyRegistered(bytes32 fileHash, address creator, uint256 timestamp)',
  'error MediaNotFound(bytes32 fileHash)'
];

export class BlockchainService {
  private provider: ethers.JsonRpcProvider;
  private wallet: ethers.Wallet | ethers.HDNodeWallet;
  private contract: ethers.Contract;
  private contractAddress: string;
  private isConfigured: boolean = false;

  constructor() {
    try {
      this.contractAddress = getContractAddress();
      this.provider = new ethers.JsonRpcProvider(env.RPC_URL);
      this.wallet = new ethers.Wallet(env.PRIVATE_KEY, this.provider);
      this.contract = new ethers.Contract(this.contractAddress, PROVENANCE_REGISTRY_ABI, this.wallet);
      this.isConfigured = true;
      logger.info('BlockchainService initialized', {
        rpcUrl: env.RPC_URL,
        contractAddress: this.contractAddress,
        walletAddress: this.wallet.address,
      });
    } catch (error: any) {
      logger.error('Failed to initialize BlockchainService with configured credentials', error);
      this.provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
      this.wallet = ethers.Wallet.createRandom().connect(this.provider);
      this.contractAddress = ethers.ZeroAddress;
      this.contract = new ethers.Contract(ethers.ZeroAddress, PROVENANCE_REGISTRY_ABI, this.wallet);
      this.isConfigured = false;
    }
  }

  public getContractAddress(): string {
    return this.contractAddress;
  }

  public getSignerAddress(): string {
    return this.wallet.address;
  }

  /**
   * Validates that the smart contract is deployed on the current node.
   * If on a local development network and bytecode is missing (e.g. node restarted),
   * automatically deploys ProvenanceRegistry on the fly so the user never faces downtime.
   */
  private async ensureContractDeployed(): Promise<void> {
    try {
      // Re-read latest contract address if updated
      const latestConfigured = getContractAddress();
      if (latestConfigured && latestConfigured !== this.contractAddress) {
        this.contractAddress = latestConfigured;
        this.contract = new ethers.Contract(this.contractAddress, PROVENANCE_REGISTRY_ABI, this.wallet);
      }

      const code = await this.provider.getCode(this.contractAddress);
      if (code && code !== '0x' && code !== '0x0') {
        return; // Contract bytecode is valid and ready
      }

      // If bytecode is missing, check if this is a local development node
      const network = await this.provider.getNetwork();
      const isLocalNode =
        Number(network.chainId) === 31337 ||
        env.RPC_URL.includes('127.0.0.1') ||
        env.RPC_URL.includes('localhost');

      if (isLocalNode) {
        logger.info(
          `Contract bytecode missing at ${this.contractAddress} on local node. Auto-deploying ProvenanceRegistry...`
        );

        // Find compiled contract artifact
        const possibleArtifactPaths = [
          path.resolve(__dirname, '../../../contracts/artifacts/contracts/ProvenanceRegistry.sol/ProvenanceRegistry.json'),
          path.resolve(__dirname, '../../contracts/artifacts/contracts/ProvenanceRegistry.sol/ProvenanceRegistry.json'),
          path.resolve(process.cwd(), 'contracts/artifacts/contracts/ProvenanceRegistry.sol/ProvenanceRegistry.json'),
          path.resolve(process.cwd(), '../contracts/artifacts/contracts/ProvenanceRegistry.sol/ProvenanceRegistry.json'),
        ];

        let artifact: any = null;
        for (const p of possibleArtifactPaths) {
          if (fs.existsSync(p)) {
            artifact = JSON.parse(fs.readFileSync(p, 'utf8'));
            break;
          }
        }

        if (artifact && artifact.bytecode && artifact.abi) {
          const factory = new ethers.ContractFactory(artifact.abi, artifact.bytecode, this.wallet);
          const deployed = await factory.deploy(this.wallet.address);
          await deployed.waitForDeployment();

          const newAddress = await deployed.getAddress();
          this.contractAddress = newAddress;
          this.contract = new ethers.Contract(newAddress, PROVENANCE_REGISTRY_ABI, this.wallet);

          logger.info(`ProvenanceRegistry successfully auto-deployed to: ${newAddress}`);

          // Persist deployment artifact
          try {
            const possibleDeployDirs = [
              path.resolve(process.cwd(), 'contracts/deployments'),
              path.resolve(process.cwd(), '../contracts/deployments'),
              path.resolve(__dirname, '../../../contracts/deployments'),
            ];
            for (const d of possibleDeployDirs) {
              if (fs.existsSync(d) || fs.existsSync(path.dirname(d))) {
                if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true });
                fs.writeFileSync(
                  path.join(d, 'deployment.json'),
                  JSON.stringify(
                    {
                      network: 'localhost',
                      chainId: 31337,
                      contractAddress: newAddress,
                      deployer: this.wallet.address,
                      timestamp: new Date().toISOString(),
                    },
                    null,
                    2
                  )
                );
                break;
              }
            }
          } catch (writeErr) {
            logger.warn('Could not save deployment.json artifact', writeErr);
          }

          return;
        }
      }

      throw new Error(
        `Smart contract is not deployed at address ${this.contractAddress} on the current blockchain node. Please run: 'cd contracts && npx hardhat run scripts/deploy.ts --network localhost'`
      );
    } catch (err: any) {
      if (err.message?.includes('Smart contract is not deployed')) {
        throw err;
      }
      logger.error('Error during contract deployment validation', err);
      throw err;
    }
  }

  /**
   * Registers a media record on the blockchain.
   */
  async registerMedia(
    fileHash: string,
    ipfsCID: string
  ): Promise<{ txHash: string; blockNumber: number }> {
    logger.info('BlockchainService: executing registerMedia', { fileHash, ipfsCID });

    const cleanHash = fileHash.trim();
    const formattedHash = cleanHash.startsWith('0x') ? cleanHash : `0x${cleanHash}`;

    if (formattedHash.length !== 66) {
      throw new Error(
        `Invalid hash length: expected 64 hex characters (or 66 with '0x'), received ${cleanHash.length}`
      );
    }

    try {
      await this.ensureContractDeployed();

      // Check if already registered first to avoid unnecessary gas revert
      const exists = await this.mediaExists(formattedHash);
      if (exists) {
        throw new Error(`Media with hash ${formattedHash} is already registered on-chain`);
      }

      // Dynamically submit transaction with robust nonce auto-recovery
      let tx: any;
      let attempts = 0;
      const maxAttempts = 3;

      while (attempts < maxAttempts) {
        attempts++;
        try {
          const currentNonce = await this.provider.getTransactionCount(this.wallet.address, 'latest');
          tx = await this.contract.registerMedia(formattedHash, ipfsCID, { nonce: currentNonce });
          break;
        } catch (err: any) {
          const errString = `${err?.message || ''} ${JSON.stringify(err?.info || {})}`;
          const match = errString.match(/Expected nonce to be (\d+)/i);

          if (match && attempts < maxAttempts) {
            const expectedNonce = parseInt(match[1], 10);
            logger.info(`Auto-correcting transaction nonce to expected value: ${expectedNonce} (attempt ${attempts})`);
            try {
              tx = await this.contract.registerMedia(formattedHash, ipfsCID, { nonce: expectedNonce });
              break;
            } catch (retryErr: any) {
              if (attempts >= maxAttempts) throw retryErr;
            }
          } else if (
            (err?.code === 'NONCE_EXPIRED' ||
              errString.includes('Nonce too low') ||
              errString.includes('nonce has already been used')) &&
            attempts < maxAttempts
          ) {
            logger.warn(`Nonce sync collision detected on attempt ${attempts}, refreshing...`);
            await new Promise((r) => setTimeout(r, 200));
            continue;
          } else {
            throw err;
          }
        }
      }
      logger.info('Transaction submitted, awaiting confirmation...', { txHash: tx.hash });

      const receipt = await tx.wait();
      if (!receipt || receipt.status !== 1) {
        throw new Error(`Transaction failed or reverted with status ${receipt?.status}`);
      }

      logger.info('Transaction confirmed', {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      });

      return {
        txHash: receipt.hash,
        blockNumber: receipt.blockNumber,
      };
    } catch (error: any) {
      if (error?.message?.includes('MediaAlreadyRegistered')) {
        throw new Error('This media hash has already been registered on-chain.');
      }
      if (error?.message?.includes('InvalidFileHash')) {
        throw new Error('Invalid file hash passed to smart contract.');
      }
      if (error?.message?.includes('InvalidIPFSCID')) {
        throw new Error('Invalid IPFS CID passed to smart contract.');
      }
      if (
        error.code === 'BAD_DATA' ||
        error.message?.includes('could not decode result data') ||
        error.message?.includes('value="0x"')
      ) {
        throw new Error(
          `Smart contract not found at ${this.contractAddress}. Please deploy the contract using: 'cd contracts && npx hardhat run scripts/deploy.ts --network localhost'`
        );
      }
      logger.error('Blockchain registration transaction failed', error);
      throw error;
    }
  }

  /**
   * Verifies and retrieves a media record by its hash from the blockchain.
   */
  async verifyMedia(fileHash: string): Promise<MediaRecord | null> {
    const cleanHash = fileHash.trim();
    const formattedHash = cleanHash.startsWith('0x') ? cleanHash : `0x${cleanHash}`;

    if (formattedHash.length !== 66) {
      throw new Error(
        `Invalid hash length: expected 64 hex characters (or 66 with '0x'), received ${cleanHash.length}`
      );
    }

    try {
      await this.ensureContractDeployed();

      const record = await this.contract.verifyMedia(formattedHash);
      if (!record || !record.isVerified) {
        return null;
      }

      return {
        fileHash: record.fileHash,
        ipfsCID: record.ipfsCID,
        creator: record.creator,
        timestamp: Number(record.timestamp),
        isVerified: Boolean(record.isVerified),
      };
    } catch (error: any) {
      if (
        error.code === 'BAD_DATA' ||
        error.message?.includes('could not decode result data') ||
        error.message?.includes('value="0x"')
      ) {
        throw new Error(
          `Smart contract not found at ${this.contractAddress}. Please deploy the contract using: 'cd contracts && npx hardhat run scripts/deploy.ts --network localhost'`
        );
      }
      logger.error('Error querying verifyMedia on-chain', error);
      throw new Error(`Blockchain query failed: ${error.message}`);
    }
  }

  /**
   * Checks existence of a media record.
   */
  async mediaExists(fileHash: string): Promise<boolean> {
    const cleanHash = fileHash.trim();
    const formattedHash = cleanHash.startsWith('0x') ? cleanHash : `0x${cleanHash}`;

    try {
      await this.ensureContractDeployed();
      return await this.contract.mediaExists(formattedHash);
    } catch (error: any) {
      if (
        error.code === 'BAD_DATA' ||
        error.message?.includes('could not decode result data') ||
        error.message?.includes('value="0x"')
      ) {
        return false;
      }
      logger.error('Error querying mediaExists on-chain', error);
      return false;
    }
  }

  /**
   * Returns the total registered count on-chain.
   */
  async getTotalRegistered(): Promise<number> {
    try {
      await this.ensureContractDeployed();
      const total = await this.contract.totalRegisteredMedia();
      return Number(total);
    } catch (error: any) {
      logger.error('Error querying totalRegisteredMedia', error);
      return 0;
    }
  }
}

export const blockchainService = new BlockchainService();
