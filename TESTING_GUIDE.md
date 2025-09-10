# Blue Carbon Registry - Full Application Testing Guide

## Overview
This guide will help you test the complete Blue Carbon Registry application, which consists of:
1. **Frontend** - React application (Port 3000)
2. **Backend** - Node.js/Express API server (Port 5000) 
3. **Blockchain** - Hardhat local blockchain network (Port 8545)

## Prerequisites

### Required Software
1. **Node.js** (v16 or higher) ✅ Already installed
2. **MongoDB** (for backend database)
3. **Git** (for version control)

### MongoDB Installation (Required)
The backend requires MongoDB to be running locally. 

**Option 1: Install MongoDB locally**
- Download from: https://www.mongodb.com/try/download/community
- Install and start the MongoDB service
- Default connection: `mongodb://localhost:27017/blue-carbon-registry`

**Option 2: Use MongoDB Atlas (Cloud)**
- Sign up at: https://www.mongodb.com/atlas
- Create a free cluster and get connection string
- Update `.env` file with your connection string

### Visual Studio Build Tools (Optional - for AI features)
Currently disabled due to installation issues. To enable AI features later:
- Install Visual Studio Community with "Desktop development with C++" workload
- Or install Visual Studio Build Tools standalone

## Setup Instructions

### 1. Environment Configuration
Create a `.env` file in the `backend` directory:

```bash
cd backend
cp .env.example .env
```

Edit the `.env` file with your configuration:
```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://localhost:27017/blue-carbon-registry
JWT_SECRET=your-super-secret-jwt-key-here-change-this-in-production
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://localhost:3000
BLOCKCHAIN_RPC_URL=http://localhost:8545
```

### 2. Install Dependencies
From the root directory:
```bash
# Install all dependencies
npm run install-all

# Or install individually:
cd backend && npm install
cd ../frontend && npm install  
cd ../blockchain && npm install --legacy-peer-deps
```

## Testing Options

### Option 1: Start All Services Together (Recommended)
From the root directory:
```bash
npm run dev
```

This starts all three services simultaneously:
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000
- Blockchain: http://localhost:8545

### Option 2: Start Services Individually

#### Terminal 1 - Blockchain (Start First)
```bash
cd blockchain
npx hardhat node
```
Keep this running. You'll see 20 test accounts with ETH balances.

#### Terminal 2 - Backend API
```bash
cd backend
npm run dev
```
Make sure MongoDB is running first!

#### Terminal 3 - Frontend
```bash
cd frontend
npm start
```

### Option 3: Frontend Only (For UI Testing)
If you just want to test the frontend UI without backend/blockchain:
```bash
cd frontend
npm start
```
Visit: http://localhost:3000

## Testing the Application

### 1. Frontend Testing
- **Homepage**: http://localhost:3000
  - View project information
  - Check responsive design
  - Test navigation

- **Admin Access**: http://localhost:3000/admin/login
  - Test admin login (will fail without backend)
  
- **NGO Registration**: http://localhost:3000/ngo/register
  - Test NGO registration form (will fail without backend)

### 2. Backend API Testing
Visit: http://localhost:5000/api/health
Should return:
```json
{
  "message": "Blue Carbon Registry API is running",
  "timestamp": "2025-01-09T17:52:21.000Z",
  "version": "1.0.0"
}
```

### 3. Blockchain Testing
The Hardhat network should show:
- 20 accounts with 10,000 ETH each
- Network running on port 8545
- Ready for smart contract deployment

### 4. Full Integration Testing
1. Start all services
2. Register as an NGO through frontend
3. Login as admin to approve NGO
4. NGO uploads geo-tagged images
5. Admin reviews and approves uploads
6. Carbon credits are minted on blockchain

## Troubleshooting

### MongoDB Issues
```bash
# Check if MongoDB is running
# Windows: Services → MongoDB Server
# Mac: brew services start mongodb/brew/mongodb-community
# Linux: sudo systemctl status mongod
```

### Port Conflicts
If ports are busy:
- Frontend: Change port in `package.json` → `"start": "PORT=3001 react-scripts start"`
- Backend: Change `PORT` in `.env` file
- Blockchain: Use `npx hardhat node --port 8546`

### Blockchain Connection Issues
- Ensure Hardhat network is running first
- Check `BLOCKCHAIN_RPC_URL` in backend `.env`
- Deploy contracts: `cd blockchain && npm run deploy:local`

### Dependencies Issues
```bash
# Clear node_modules and reinstall
rm -rf node_modules package-lock.json
npm install

# For blockchain ethers version conflict:
npm install --legacy-peer-deps
```

## Current Status
✅ Frontend: Compiled successfully (all MUI Grid issues resolved)
✅ Backend: Dependencies installed (TensorFlow temporarily disabled)
✅ Blockchain: Dependencies installed
⚠️  MongoDB: Needs to be installed and running
⚠️  AI Features: Disabled due to build tools requirement

## Next Steps
1. Install MongoDB locally or use MongoDB Atlas
2. Start all services using `npm run dev`
3. Test basic functionality (registration, login, upload)
4. Deploy smart contracts for blockchain features
5. Enable AI features when Visual Studio build tools are available

## Additional Commands

### Development
```bash
npm run backend    # Start backend only
npm run frontend   # Start frontend only  
npm run blockchain # Start blockchain only
npm run deploy     # Deploy smart contracts
npm run test       # Run all tests
```

### Production Build
```bash
npm run build      # Build frontend for production
```
