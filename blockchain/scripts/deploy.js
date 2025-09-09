const { ethers } = require("hardhat");

async function main() {
  console.log("🚀 Starting deployment of Blue Carbon Registry contracts...");
  
  // Get deployer account
  const [deployer] = await ethers.getSigners();
  console.log("📝 Deploying contracts with account:", deployer.address);
  console.log("💰 Account balance:", (await deployer.getBalance()).toString());

  // Deploy CarbonCreditNFT contract
  console.log("\n🌱 Deploying CarbonCreditNFT contract...");
  
  const CarbonCreditNFT = await ethers.getContractFactory("CarbonCreditNFT");
  const carbonCreditNFT = await CarbonCreditNFT.deploy();
  
  await carbonCreditNFT.deployed();
  
  console.log("✅ CarbonCreditNFT deployed to:", carbonCreditNFT.address);
  console.log("🔗 Transaction hash:", carbonCreditNFT.deployTransaction.hash);
  
  // Wait for a few confirmations
  console.log("⏳ Waiting for confirmations...");
  await carbonCreditNFT.deployTransaction.wait(5);
  
  console.log("\n📋 Contract Deployment Summary:");
  console.log("================================");
  console.log(`CarbonCreditNFT Address: ${carbonCreditNFT.address}`);
  console.log(`Network: ${hre.network.name}`);
  console.log(`Deployer: ${deployer.address}`);
  console.log(`Gas Used: ${carbonCreditNFT.deployTransaction.gasLimit?.toString() || 'Unknown'}`);
  
  // Save deployment info
  const deploymentInfo = {
    network: hre.network.name,
    contractAddress: carbonCreditNFT.address,
    deployerAddress: deployer.address,
    transactionHash: carbonCreditNFT.deployTransaction.hash,
    timestamp: new Date().toISOString(),
    blockNumber: carbonCreditNFT.deployTransaction.blockNumber
  };
  
  // Write deployment info to file
  const fs = require('fs');
  const path = require('path');
  
  const deploymentDir = path.join(__dirname, '../deployments');
  if (!fs.existsSync(deploymentDir)) {
    fs.mkdirSync(deploymentDir, { recursive: true });
  }
  
  const deploymentFile = path.join(deploymentDir, `${hre.network.name}-deployment.json`);
  fs.writeFileSync(deploymentFile, JSON.stringify(deploymentInfo, null, 2));
  
  console.log(`📄 Deployment info saved to: ${deploymentFile}`);
  
  // Verify contract on Etherscan (if not local network)
  if (hre.network.name !== "hardhat" && hre.network.name !== "localhost") {
    console.log("\n🔍 Verifying contract on Etherscan...");
    try {
      await hre.run("verify:verify", {
        address: carbonCreditNFT.address,
        constructorArguments: [],
      });
      console.log("✅ Contract verified on Etherscan");
    } catch (error) {
      console.error("❌ Etherscan verification failed:", error.message);
    }
  }
  
  console.log("\n🎉 Deployment completed successfully!");
  console.log("\n📝 Next steps:");
  console.log("1. Update backend .env with contract address:");
  console.log(`   CARBON_CREDIT_CONTRACT_ADDRESS=${carbonCreditNFT.address}`);
  console.log("2. Set up authorized minters using setAuthorizedMinter()");
  console.log("3. Configure backend to interact with the deployed contract");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("❌ Deployment failed:", error);
    process.exit(1);
  });
