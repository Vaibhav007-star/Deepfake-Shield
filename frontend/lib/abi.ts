export const PROVENANCE_REGISTRY_ABI = [
  {
    inputs: [{ internalType: "address", name: "initialOwner", type: "address" }],
    stateMutability: "nonpayable",
    type: "constructor"
  },
  {
    inputs: [],
    name: "InvalidFileHash",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidIPFSCID",
    type: "error"
  },
  {
    inputs: [],
    name: "InvalidPaginationParameters",
    type: "error"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "fileHash", type: "bytes32" },
      { internalType: "address", name: "creator", type: "address" },
      { internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    name: "MediaAlreadyRegistered",
    type: "error"
  },
  {
    anonymous: false,
    inputs: [
      { indexed: true, internalType: "bytes32", name: "fileHash", type: "bytes32" },
      { indexed: false, internalType: "string", name: "ipfsCID", type: "string" },
      { indexed: true, internalType: "address", name: "creator", type: "address" },
      { indexed: false, internalType: "uint256", name: "timestamp", type: "uint256" }
    ],
    name: "MediaRegistered",
    type: "event"
  },
  {
    inputs: [
      { internalType: "bytes32", name: "_fileHash", type: "bytes32" },
      { internalType: "string", name: "_ipfsCID", type: "string" }
    ],
    name: "registerMedia",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function"
  },
  {
    inputs: [{ internalType: "bytes32", name: "_fileHash", type: "bytes32" }],
    name: "verifyMedia",
    outputs: [
      {
        components: [
          { internalType: "bytes32", name: "fileHash", type: "bytes32" },
          { internalType: "string", name: "ipfsCID", type: "string" },
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "uint256", name: "timestamp", type: "uint256" },
          { internalType: "bool", name: "isVerified", type: "bool" }
        ],
        internalType: "struct ProvenanceRegistry.MediaRecord",
        name: "record",
        type: "tuple"
      }
    ],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [{ internalType: "bytes32", name: "_fileHash", type: "bytes32" }],
    name: "mediaExists",
    outputs: [{ internalType: "bool", name: "", type: "bool" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "totalRegisteredMedia",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function"
  },
  {
    inputs: [],
    name: "owner",
    outputs: [{ internalType: "address", name: "", type: "address" }],
    stateMutability: "view",
    type: "function"
  }
] as const;
