# WARP.md

This file provides guidance to WARP (warp.dev) when working with code in this repository.

## Project Overview
Blue Carbon Registry MVP is a blockchain-powered system for managing blue carbon ecosystem restoration with automated Monitoring, Reporting, and Verification (MRV). Built for Smart India Hackathon 2024, it includes NGO registration, AI-powered plant species detection, blockchain-based carbon credit tokenization, and an admin verification system.

## Architecture
The project follows a three-tier architecture:

### Frontend (React.js + TypeScript)
- **Location**: `frontend/`
- **Tech Stack**: React 19, Material-UI 7, TypeScript, Web3.js, React Router
- **Key Features**: NGO portal, Admin dashboard, responsive design
- **Theme**: Environmental green (#2E7D32) and ocean blue (#0277BD) color scheme

### Backend (Node.js API)
- **Location**: `backend/`
- **Tech Stack**: Express.js, MongoDB with Mongoose, JWT auth, TensorFlow.js
- **Key Components**:
  - AI plant detection service (`utils/aiDetection.js`)
  - Role-based authentication (NGO/Admin)
  - Image processing with EXIF extraction
  - Blockchain integration via Web3.js
- **Models**: NGO, Admin, Upload schemas with comprehensive validation

### Blockchain (Ethereum/Hardhat)
- **Location**: `blockchain/`
- **Tech Stack**: Solidity 0.8.19, Hardhat, OpenZeppelin contracts
- **Main Contract**: `CarbonCreditNFT.sol` - ERC721 token representing carbon credits
- **Features**: NFT minting, verification system, credit tracking, authorized minter roles

## Common Development Commands

### Installation
```bash
# Install all dependencies across frontend, backend, and blockchain
npm run install-all
```

### Development
```bash
# Start all services concurrently (backend API, frontend dev server, local blockchain)
npm run dev

# Individual services
npm run backend     # Backend API server on port 5000
npm run frontend    # React dev server on port 3000  
npm run blockchain  # Local Hardhat blockchain on port 8545
```

### Testing
```bash
# Run all tests (backend + blockchain)
npm test

# Backend tests only
cd backend && npm test

# Blockchain tests only
cd blockchain && npx hardhat test
```

### Building
```bash
# Build frontend for production
npm run build

# Compile smart contracts
cd blockchain && npx hardhat compile
```

### Blockchain Operations
```bash
# Deploy contracts to local network
cd blockchain && npm run deploy:local

# Deploy to Sepolia testnet
cd blockchain && npm run deploy:testnet

# Start local blockchain node
cd blockchain && npx hardhat node

# Verify contract on Etherscan
cd blockchain && npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
```

## Environment Configuration

### Backend Environment Variables
Required variables in `backend/.env`:
- `MONGODB_URI`: Database connection string
- `JWT_SECRET`: Authentication secret key
- `BLOCKCHAIN_RPC_URL`: Ethereum node URL (default: http://localhost:8545)
- `CARBON_CREDIT_CONTRACT_ADDRESS`: Deployed contract address
- `AI_MODEL_PATH`: Path to plant detection model (optional, falls back to mock)

### Blockchain Configuration
In `blockchain/.env`:
- `SEPOLIA_RPC_URL`: Testnet RPC endpoint
- `PRIVATE_KEY`: Deployer private key
- `ETHERSCAN_API_KEY`: For contract verification

## Key Technical Concepts

### NGO Workflow
1. NGO registration with document upload and admin approval
2. Geo-tagged photo upload with EXIF data extraction
3. AI plant species detection (real model or mock fallback)
4. Carbon credit calculation based on plant type and area
5. Blockchain NFT minting upon admin verification

### AI Plant Detection
- Uses TensorFlow.js for plant species identification
- Supports: Mangrove, Seagrass, Salt Marsh, Coastal Tree, Marine Plant
- Confidence thresholds per plant type
- Graceful fallback to mock detection if model unavailable
- Image preprocessing: resize to 224x224, normalize to 0-1

### Carbon Credit NFT Structure
- ERC721 token with metadata storage
- Includes: credits amount, plant type, location, area restored, NGO address
- Verification status and timestamp tracking
- Transfer tracking for credit ownership
- Upload ID prevents double minting

### Authentication & Authorization
- JWT-based authentication with role separation (NGO/Admin)
- Password hashing with bcrypt (12 salt rounds)
- Rate limiting (100 requests per 15 minutes)
- Helmet security middleware

## Testing Individual Components

### Test Single Backend Route
```bash
cd backend && npm test -- --testNamePattern="auth routes"
```

### Test Smart Contract Function
```bash
cd blockchain && npx hardhat test --grep "mintCarbonCredit"
```

### Run Frontend Component Tests
```bash
cd frontend && npm test -- --testNamePattern="NGODashboard"
```

## Database Schema Notes

### NGO Model
- Approval workflow: pending → approved/rejected/suspended
- Carbon credits tracking (earned/sold/balance)
- Focus areas enum for blue carbon activities
- Wallet address for blockchain integration

### Upload Model (referenced in routes)
- EXIF data extraction and storage
- AI detection results with confidence scores
- Verification status and admin approval
- Geo-location validation

## Debugging Tips

### AI Model Issues
- Check `AI_MODEL_PATH` environment variable
- Model loading logs appear on backend startup
- Falls back to mock detection automatically

### Blockchain Connection Issues
- Ensure local Hardhat node is running (`npm run blockchain`)
- Check RPC URL matches in backend configuration
- Verify contract deployment and address configuration

### MongoDB Connection
- Default database: `blue-carbon-registry`
- Indexed fields: email, registration number, approval status
- Connection logs show MongoDB connection status

## Development Flow
1. Start with `npm run install-all` for fresh setup
2. Configure environment variables in backend and blockchain
3. Run `npm run dev` to start all services
4. Backend API available at http://localhost:5000
5. Frontend at http://localhost:3000
6. Local blockchain at http://localhost:8545

## Production Considerations
- Set `NODE_ENV=production` in backend
- Configure proper MongoDB Atlas connection
- Deploy contracts to mainnet/testnet with sufficient gas
- Set up proper CORS origins for frontend domain
- Configure SSL certificates for HTTPS
