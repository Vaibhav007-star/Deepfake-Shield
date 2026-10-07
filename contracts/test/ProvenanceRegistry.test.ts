import { expect } from "chai";
import { ethers } from "hardhat";
import { ProvenanceRegistry } from "../typechain-types";
import { HardhatEthersSigner } from "@nomicfoundation/hardhat-ethers/signers";

describe("ProvenanceRegistry", function () {
  let registry: ProvenanceRegistry;
  let owner: HardhatEthersSigner;
  let creator1: HardhatEthersSigner;
  let creator2: HardhatEthersSigner;

  // Sample valid test data
  const sampleFileHash1 = ethers.keccak256(ethers.toUtf8Bytes("Deepfake Shield Test Media 1"));
  const sampleFileHash2 = ethers.keccak256(ethers.toUtf8Bytes("Deepfake Shield Test Media 2"));
  const sampleCID1 = "bafybeigdyrzt5sfp7udm7hu76uh7y26nf3efuylqabf3oclgtqy55fbzdi";
  const sampleCID2 = "bafybeihkoviema7g3gxyt6la7vd5ho32ictqniopd6knqwcm4ldjjbhwuu";

  beforeEach(async function () {
    [owner, creator1, creator2] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("ProvenanceRegistry");
    registry = await Factory.deploy(owner.address);
    await registry.waitForDeployment();
  });

  describe("Deployment and Initialization", function () {
    it("should set the deployer as initial contract owner", async function () {
      expect(await registry.owner()).to.equal(owner.address);
    });

    it("should start with 0 total registered records", async function () {
      expect(await registry.totalRegisteredMedia()).to.equal(0n);
    });
  });

  describe("Media Registration", function () {
    it("should successfully register a valid media record", async function () {
      const tx = await registry.connect(creator1).registerMedia(sampleFileHash1, sampleCID1);
      const receipt = await tx.wait();
      expect(receipt?.status).to.equal(1);

      // Verify state
      const record = await registry.verifyMedia(sampleFileHash1);
      expect(record.fileHash).to.equal(sampleFileHash1);
      expect(record.ipfsCID).to.equal(sampleCID1);
      expect(record.creator).to.equal(creator1.address);
      expect(record.isVerified).to.be.true;
      expect(record.timestamp).to.be.greaterThan(0n);

      expect(await registry.mediaExists(sampleFileHash1)).to.be.true;
      expect(await registry.totalRegisteredMedia()).to.equal(1n);
    });

    it("should emit MediaRegistered event with correct indexed and unindexed data", async function () {
      await expect(registry.connect(creator1).registerMedia(sampleFileHash1, sampleCID1))
        .to.emit(registry, "MediaRegistered")
        .withArgs(sampleFileHash1, sampleCID1, creator1.address, (val: bigint) => val > 0n);
    });

    it("should reject registration with empty/zero fileHash", async function () {
      const zeroHash = ethers.ZeroHash;
      await expect(
        registry.connect(creator1).registerMedia(zeroHash, sampleCID1)
      ).to.be.revertedWithCustomError(registry, "InvalidFileHash");
    });

    it("should reject registration with empty IPFS CID string", async function () {
      await expect(
        registry.connect(creator1).registerMedia(sampleFileHash1, "")
      ).to.be.revertedWithCustomError(registry, "InvalidIPFSCID");
    });

    it("should prevent duplicate registration for the same file hash", async function () {
      await registry.connect(creator1).registerMedia(sampleFileHash1, sampleCID1);

      // Attempting to register again by creator1 or creator2 must revert
      await expect(
        registry.connect(creator2).registerMedia(sampleFileHash1, "different-cid")
      ).to.be.revertedWithCustomError(registry, "MediaAlreadyRegistered");
    });
  });

  describe("Verification and Retrieval", function () {
    it("should return false and an unverified record for an unregistered hash", async function () {
      const nonExistentHash = ethers.keccak256(ethers.toUtf8Bytes("Not Registered"));

      expect(await registry.mediaExists(nonExistentHash)).to.be.false;

      const record = await registry.verifyMedia(nonExistentHash);
      expect(record.isVerified).to.be.false;
      expect(record.creator).to.equal(ethers.ZeroAddress);
      expect(record.timestamp).to.equal(0n);
      expect(record.ipfsCID).to.equal("");
    });

    it("should return the correct record for multiple distinct registered media", async function () {
      await registry.connect(creator1).registerMedia(sampleFileHash1, sampleCID1);
      await registry.connect(creator2).registerMedia(sampleFileHash2, sampleCID2);

      const record1 = await registry.verifyMedia(sampleFileHash1);
      expect(record1.creator).to.equal(creator1.address);
      expect(record1.ipfsCID).to.equal(sampleCID1);

      const record2 = await registry.verifyMedia(sampleFileHash2);
      expect(record2.creator).to.equal(creator2.address);
      expect(record2.ipfsCID).to.equal(sampleCID2);

      expect(await registry.totalRegisteredMedia()).to.equal(2n);
    });
  });

  describe("Enumeration and Pagination", function () {
    it("should support getHashByIndex and pagination", async function () {
      await registry.connect(creator1).registerMedia(sampleFileHash1, sampleCID1);
      await registry.connect(creator2).registerMedia(sampleFileHash2, sampleCID2);

      expect(await registry.getHashByIndex(0)).to.equal(sampleFileHash1);
      expect(await registry.getHashByIndex(1)).to.equal(sampleFileHash2);

      // Out of bounds reverts
      await expect(registry.getHashByIndex(2)).to.be.revertedWithCustomError(
        registry,
        "InvalidPaginationParameters"
      );

      // Pagination
      const paginatedRecords = await registry.getRegisteredMediaPaginated(0, 10);
      expect(paginatedRecords.length).to.equal(2);
      expect(paginatedRecords[0].fileHash).to.equal(sampleFileHash1);
      expect(paginatedRecords[1].fileHash).to.equal(sampleFileHash2);

      // Slice pagination
      const slice = await registry.getRegisteredMediaPaginated(1, 1);
      expect(slice.length).to.equal(1);
      expect(slice[0].fileHash).to.equal(sampleFileHash2);

      // Offset beyond total returns empty array
      const empty = await registry.getRegisteredMediaPaginated(5, 5);
      expect(empty.length).to.equal(0);
    });
  });

  describe("Security and Administration", function () {
    it("should allow owner to transfer ownership", async function () {
      await registry.connect(owner).transferOwnership(creator1.address);
      expect(await registry.owner()).to.equal(creator1.address);
    });

    it("should prevent non-owner from transferring ownership", async function () {
      await expect(
        registry.connect(creator1).transferOwnership(creator2.address)
      ).to.be.revertedWithCustomError(registry, "OwnableUnauthorizedAccount");
    });
  });
});
