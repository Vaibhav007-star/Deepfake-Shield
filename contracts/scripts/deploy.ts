import { ethers } from "hardhat";
import * as fs from "fs";
import * as path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("----------------------------------------------------");
  console.log("Deepfake Shield — Deploying ProvenanceRegistry");
  console.log("Deployer Address:", deployer.address);
  
  const balance = await ethers.provider.getBalance(deployer.address);
  console.log("Deployer Balance:", ethers.formatEther(balance), "ETH");
  console.log("----------------------------------------------------");

  const ProvenanceRegistryFactory = await ethers.getContractFactory("ProvenanceRegistry");
  const provenanceRegistry = await ProvenanceRegistryFactory.deploy(deployer.address);

  await provenanceRegistry.waitForDeployment();
  const contractAddress = await provenanceRegistry.getAddress();

  console.log(">>> ProvenanceRegistry deployed successfully to:", contractAddress);
  console.log("Owner is:", await provenanceRegistry.owner());

  // Save deployment artifact for backend and frontend integration
  const deploymentInfo = {
    network: (await ethers.provider.getNetwork()).name,
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    contractAddress,
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  const outputDir = path.join(__dirname, "../deployments");
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const outputPath = path.join(outputDir, "deployment.json");
  fs.writeFileSync(outputPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment details saved to:", outputPath);
  console.log("----------------------------------------------------");
}

main().catch((error) => {
  console.error("Deployment failed:", error);
  process.exitCode = 1;
});
