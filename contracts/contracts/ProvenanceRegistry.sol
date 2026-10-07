// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/**
 * @title ProvenanceRegistry
 * @dev Decentralized registry for media provenance, cryptographic integrity proofs,
 * and immutable IPFS metadata anchors.
 *
 * Designed for Deepfake Shield to anchor media fingerprints without centralized alteration.
 */
contract ProvenanceRegistry is Ownable, ReentrancyGuard {
    /// @dev Structure storing immutable provenance record for a given media file
    struct MediaRecord {
        bytes32 fileHash;    // SHA-256 (or cryptographic) hash of media bytes
        string ipfsCID;      // IPFS Content Identifier for file and metadata bundle
        address creator;     // Ethereum address of the registering entity
        uint256 timestamp;   // Blockchain block timestamp of registration
        bool isVerified;     // True if registered in contract
    }

    /// @dev Mapping from media hash (bytes32) to its provenance record
    mapping(bytes32 => MediaRecord) private _records;

    /// @dev Array of all registered media hashes for indexation and enumeration
    bytes32[] private _registeredHashes;

    // =========================================================================
    // CUSTOM ERRORS
    // =========================================================================
    error InvalidFileHash();
    error InvalidIPFSCID();
    error MediaAlreadyRegistered(bytes32 fileHash, address creator, uint256 timestamp);
    error MediaNotFound(bytes32 fileHash);
    error InvalidPaginationParameters();

    // =========================================================================
    // EVENTS
    // =========================================================================
    /**
     * @dev Emitted when a new media provenance record is anchored.
     * @param fileHash Cryptographic SHA-256 fingerprint of the media.
     * @param ipfsCID IPFS Content Identifier where media metadata is stored.
     * @param creator Wallet address that submitted and signed the registration.
     * @param timestamp Unix block timestamp when registration was mined.
     */
    event MediaRegistered(
        bytes32 indexed fileHash,
        string ipfsCID,
        address indexed creator,
        uint256 timestamp
    );

    /**
     * @notice Initializes the ProvenanceRegistry with contract ownership.
     * @param initialOwner Address receiving initial administrative ownership.
     */
    constructor(address initialOwner) Ownable(initialOwner) {}

    // =========================================================================
    // EXTERNAL STATE-CHANGING FUNCTIONS
    // =========================================================================

    /**
     * @notice Registers a new media provenance record on-chain.
     * @dev Protects against reentrancy and enforces strict validation checks.
     * Follows Checks-Effects-Interactions pattern.
     *
     * @param _fileHash The cryptographic hash (e.g. SHA-256) of the media file.
     * @param _ipfsCID The IPFS Content Identifier (CID) for the metadata bundle.
     */
    function registerMedia(
        bytes32 _fileHash,
        string calldata _ipfsCID
    ) external nonReentrant {
        // CHECKS
        if (_fileHash == bytes32(0)) {
            revert InvalidFileHash();
        }
        if (bytes(_ipfsCID).length == 0) {
            revert InvalidIPFSCID();
        }
        if (_records[_fileHash].isVerified) {
            revert MediaAlreadyRegistered(
                _fileHash,
                _records[_fileHash].creator,
                _records[_fileHash].timestamp
            );
        }

        // EFFECTS
        uint256 currentTimestamp = block.timestamp;
        _records[_fileHash] = MediaRecord({
            fileHash: _fileHash,
            ipfsCID: _ipfsCID,
            creator: msg.sender,
            timestamp: currentTimestamp,
            isVerified: true
        });

        _registeredHashes.push(_fileHash);

        // LOGGING
        emit MediaRegistered(_fileHash, _ipfsCID, msg.sender, currentTimestamp);
    }

    // =========================================================================
    // VIEW / PURE FUNCTIONS
    // =========================================================================

    /**
     * @notice Verifies and retrieves the provenance record for a given media file hash.
     * @param _fileHash The cryptographic hash of the media to query.
     * @return record The complete MediaRecord struct.
     */
    function verifyMedia(
        bytes32 _fileHash
    ) external view returns (MediaRecord memory record) {
        record = _records[_fileHash];
    }

    /**
     * @notice Checks whether a media record exists and is verified in the registry.
     * @param _fileHash The cryptographic hash to check.
     * @return bool True if registered, false otherwise.
     */
    function mediaExists(bytes32 _fileHash) external view returns (bool) {
        return _records[_fileHash].isVerified;
    }

    /**
     * @notice Returns the total count of registered media records.
     * @return uint256 Total count of unique registered items.
     */
    function totalRegisteredMedia() external view returns (uint256) {
        return _registeredHashes.length;
    }

    /**
     * @notice Returns a registered media hash by index.
     * @param index Array index in registered hashes list.
     * @return bytes32 Hash at given index.
     */
    function getHashByIndex(uint256 index) external view returns (bytes32) {
        if (index >= _registeredHashes.length) {
            revert InvalidPaginationParameters();
        }
        return _registeredHashes[index];
    }

    /**
     * @notice Returns paginated media records for auditing or dashboard listing.
     * @param offset Starting index.
     * @param limit Maximum number of records to return.
     * @return records Array of MediaRecord structs.
     */
    function getRegisteredMediaPaginated(
        uint256 offset,
        uint256 limit
    ) external view returns (MediaRecord[] memory records) {
        uint256 total = _registeredHashes.length;
        if (offset >= total || limit == 0) {
            return new MediaRecord[](0);
        }

        uint256 end = offset + limit;
        if (end > total) {
            end = total;
        }

        uint256 resultLength = end - offset;
        records = new MediaRecord[](resultLength);

        for (uint256 i = 0; i < resultLength; i++) {
            bytes32 hash = _registeredHashes[offset + i];
            records[i] = _records[hash];
        }

        return records;
    }
}
