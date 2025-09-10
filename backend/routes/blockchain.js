const express = require('express');
const { Web3 } = require('web3');
const Upload = require('../models/Upload');
const NGO = require('../models/NGO');
const { authMiddleware, adminOnly, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Web3 setup
const web3 = new Web3(process.env.BLOCKCHAIN_RPC_URL || 'http://localhost:8545');

// Smart contract ABI and address (these would be loaded from deployed contracts)
const CARBON_CREDIT_CONTRACT_ABI = [
  // This would contain the actual ABI of your deployed smart contract
  {
    "inputs": [
      {"name": "to", "type": "address"},
      {"name": "amount", "type": "uint256"},
      {"name": "tokenURI", "type": "string"}
    ],
    "name": "mintCarbonCredits",
    "outputs": [{"name": "tokenId", "type": "uint256"}],
    "type": "function"
  },
  {
    "inputs": [{"name": "tokenId", "type": "uint256"}],
    "name": "getTokenInfo",
    "outputs": [
      {"name": "owner", "type": "address"},
      {"name": "amount", "type": "uint256"},
      {"name": "tokenURI", "type": "string"}
    ],
    "type": "function"
  }
];

const CONTRACT_ADDRESS = process.env.CARBON_CREDIT_CONTRACT_ADDRESS;
const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;

// Initialize contract
let contract;
if (CONTRACT_ADDRESS) {
  contract = new web3.eth.Contract(CARBON_CREDIT_CONTRACT_ABI, CONTRACT_ADDRESS);
}

// @route   POST /api/blockchain/mint-credits
// @desc    Mint carbon credit tokens for approved uploads
// @access  Private (Admin with mint_tokens permission)
router.post('/mint-credits', authMiddleware, adminOnly, requirePermission('mint_tokens'), async (req, res) => {
  try {
    const { uploadId, tokenAmount } = req.body;

    if (!contract) {
      return res.status(500).json({
        success: false,
        message: 'Blockchain contract not configured'
      });
    }

    // Find the upload
    const upload = await Upload.findById(uploadId).populate('ngoId');
    if (!upload) {
      return res.status(404).json({
        success: false,
        message: 'Upload not found'
      });
    }

    if (upload.approvalStatus !== 'approved') {
      return res.status(400).json({
        success: false,
        message: 'Upload must be approved before minting tokens'
      });
    }

    if (upload.blockchainData.tokenId) {
      return res.status(400).json({
        success: false,
        message: 'Tokens already minted for this upload'
      });
    }

    const ngo = upload.ngoId;
    if (!ngo.walletAddress) {
      return res.status(400).json({
        success: false,
        message: 'NGO wallet address not configured'
      });
    }

    // Prepare transaction data
    const account = web3.eth.accounts.privateKeyToAccount(ADMIN_PRIVATE_KEY);
    web3.eth.accounts.wallet.add(account);

    const tokenURI = JSON.stringify({
      name: `Blue Carbon Credit - ${upload._id}`,
      description: `Carbon credits from ${ngo.organizationName} plantation`,
      image: upload.imageUrl,
      attributes: [
        {
          trait_type: "Plant Type",
          value: upload.aiDetection.plantType
        },
        {
          trait_type: "Location",
          value: upload.location.state
        },
        {
          trait_type: "Area Covered",
          value: upload.plantationData.areaCovered,
          unit: "square meters"
        },
        {
          trait_type: "Number of Plants",
          value: upload.plantationData.numberOfPlants
        },
        {
          trait_type: "Plantation Date",
          value: upload.plantationData.plantingDate.toISOString()
        },
        {
          trait_type: "AI Confidence",
          value: upload.aiDetection.confidence
        }
      ],
      external_url: `${process.env.FRONTEND_URL}/upload/${upload._id}`,
      carbon_credits: tokenAmount
    });

    // Estimate gas
    const gasEstimate = await contract.methods
      .mintCarbonCredits(ngo.walletAddress, tokenAmount, tokenURI)
      .estimateGas({ from: account.address });

    // Send transaction
    const receipt = await contract.methods
      .mintCarbonCredits(ngo.walletAddress, tokenAmount, tokenURI)
      .send({
        from: account.address,
        gas: gasEstimate + 10000, // Add some buffer
        gasPrice: await web3.eth.getGasPrice()
      });

    // Extract token ID from events
    const tokenId = receipt.events.Transfer?.returnValues?.tokenId || 
                   receipt.events.CarbonCreditMinted?.returnValues?.tokenId;

    // Update upload with blockchain data
    upload.blockchainData = {
      tokenId: tokenId,
      transactionHash: receipt.transactionHash,
      blockNumber: receipt.blockNumber,
      mintedAt: new Date(),
      mintedCredits: tokenAmount
    };
    upload.status = 'tokenized';

    await upload.save();

    res.json({
      success: true,
      message: 'Carbon credit tokens minted successfully',
      data: {
        tokenId: tokenId,
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        mintedCredits: tokenAmount,
        ngoWallet: ngo.walletAddress
      }
    });

  } catch (error) {
    console.error('Mint credits error:', error);
    res.status(500).json({
      success: false,
      message: 'Error minting carbon credit tokens',
      error: error.message
    });
  }
});

// @route   GET /api/blockchain/token/:tokenId
// @desc    Get token information from blockchain
// @access  Public
router.get('/token/:tokenId', async (req, res) => {
  try {
    const { tokenId } = req.params;

    if (!contract) {
      return res.status(500).json({
        success: false,
        message: 'Blockchain contract not configured'
      });
    }

    // Get token info from contract
    const tokenInfo = await contract.methods.getTokenInfo(tokenId).call();
    
    // Find corresponding upload
    const upload = await Upload.findOne({ 'blockchainData.tokenId': tokenId })
      .populate('ngoId', 'organizationName email');

    res.json({
      success: true,
      data: {
        blockchain: {
          owner: tokenInfo.owner,
          amount: tokenInfo.amount,
          tokenURI: tokenInfo.tokenURI
        },
        upload: upload ? {
          id: upload._id,
          ngo: upload.ngoId.organizationName,
          plantType: upload.aiDetection.plantType,
          location: upload.location,
          plantationData: upload.plantationData,
          mintedAt: upload.blockchainData.mintedAt,
          transactionHash: upload.blockchainData.transactionHash
        } : null
      }
    });

  } catch (error) {
    console.error('Get token info error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving token information',
      error: error.message
    });
  }
});

// @route   GET /api/blockchain/ngo/:ngoId/tokens
// @desc    Get all tokens owned by an NGO
// @access  Private
router.get('/ngo/:ngoId/tokens', authMiddleware, async (req, res) => {
  try {
    const { ngoId } = req.params;

    // Check if user can access this NGO's data
    if (req.user.userType === 'ngo' && req.user.userId !== ngoId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Find all tokenized uploads for this NGO
    const tokenizedUploads = await Upload.find({
      ngoId: ngoId,
      'blockchainData.tokenId': { $exists: true }
    }).sort({ 'blockchainData.mintedAt': -1 });

    const tokens = tokenizedUploads.map(upload => ({
      tokenId: upload.blockchainData.tokenId,
      transactionHash: upload.blockchainData.transactionHash,
      blockNumber: upload.blockchainData.blockNumber,
      mintedCredits: upload.blockchainData.mintedCredits,
      mintedAt: upload.blockchainData.mintedAt,
      uploadData: {
        id: upload._id,
        plantType: upload.aiDetection.plantType,
        location: upload.location.state,
        area: upload.plantationData.areaCovered,
        plants: upload.plantationData.numberOfPlants,
        uploadDate: upload.createdAt
      }
    }));

    res.json({
      success: true,
      data: {
        tokens,
        total: tokens.length,
        totalCredits: tokens.reduce((sum, token) => sum + token.mintedCredits, 0)
      }
    });

  } catch (error) {
    console.error('Get NGO tokens error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving NGO tokens'
    });
  }
});

// @route   GET /api/blockchain/stats
// @desc    Get blockchain statistics
// @access  Private (Admin)
router.get('/stats', authMiddleware, adminOnly, async (req, res) => {
  try {
    // Get tokenization statistics
    const stats = await Upload.aggregate([
      {
        $group: {
          _id: null,
          totalApproved: {
            $sum: { $cond: [{ $eq: ['$approvalStatus', 'approved'] }, 1, 0] }
          },
          totalTokenized: {
            $sum: { $cond: [{ $exists: '$blockchainData.tokenId' }, 1, 0] }
          },
          totalCreditsIssued: {
            $sum: { $cond: [{ $exists: '$blockchainData.tokenId' }, '$blockchainData.mintedCredits', 0] }
          },
          avgCreditsPerToken: {
            $avg: { $cond: [{ $exists: '$blockchainData.tokenId' }, '$blockchainData.mintedCredits', null] }
          }
        }
      }
    ]);

    // Get recent tokenizations
    const recentTokenizations = await Upload.find({
      'blockchainData.tokenId': { $exists: true }
    })
    .sort({ 'blockchainData.mintedAt': -1 })
    .limit(10)
    .populate('ngoId', 'organizationName')
    .select('blockchainData ngoId aiDetection.plantType location.state plantationData.areaCovered');

    // Get plant type distribution for tokenized uploads
    const plantTypeDistribution = await Upload.aggregate([
      { $match: { 'blockchainData.tokenId': { $exists: true } } },
      {
        $group: {
          _id: '$aiDetection.plantType',
          count: { $sum: 1 },
          totalCredits: { $sum: '$blockchainData.mintedCredits' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    res.json({
      success: true,
      data: {
        summary: stats[0] || {
          totalApproved: 0,
          totalTokenized: 0,
          totalCreditsIssued: 0,
          avgCreditsPerToken: 0
        },
        recentTokenizations: recentTokenizations.map(upload => ({
          tokenId: upload.blockchainData.tokenId,
          transactionHash: upload.blockchainData.transactionHash,
          mintedCredits: upload.blockchainData.mintedCredits,
          mintedAt: upload.blockchainData.mintedAt,
          ngo: upload.ngoId.organizationName,
          plantType: upload.aiDetection.plantType,
          location: upload.location.state,
          area: upload.plantationData.areaCovered
        })),
        distributions: {
          plantTypes: plantTypeDistribution
        }
      }
    });

  } catch (error) {
    console.error('Get blockchain stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error retrieving blockchain statistics'
    });
  }
});

// @route   POST /api/blockchain/verify-transaction
// @desc    Verify a blockchain transaction
// @access  Public
router.post('/verify-transaction', async (req, res) => {
  try {
    const { transactionHash } = req.body;

    if (!transactionHash) {
      return res.status(400).json({
        success: false,
        message: 'Transaction hash is required'
      });
    }

    // Get transaction receipt
    const receipt = await web3.eth.getTransactionReceipt(transactionHash);
    
    if (!receipt) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Find corresponding upload
    const upload = await Upload.findOne({ 'blockchainData.transactionHash': transactionHash })
      .populate('ngoId', 'organizationName email');

    res.json({
      success: true,
      data: {
        transaction: {
          hash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          blockHash: receipt.blockHash,
          from: receipt.from,
          to: receipt.to,
          status: receipt.status === '0x1' ? 'success' : 'failed',
          gasUsed: receipt.gasUsed
        },
        upload: upload ? {
          id: upload._id,
          ngo: upload.ngoId.organizationName,
          tokenId: upload.blockchainData.tokenId,
          mintedCredits: upload.blockchainData.mintedCredits,
          plantType: upload.aiDetection.plantType,
          location: upload.location
        } : null
      }
    });

  } catch (error) {
    console.error('Verify transaction error:', error);
    res.status(500).json({
      success: false,
      message: 'Error verifying transaction'
    });
  }
});

module.exports = router;
