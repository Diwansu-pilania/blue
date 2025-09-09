# Blue Carbon Registry MVP - SIH 2024

## Problem Statement ID: 25038
**Blockchain-Based Blue Carbon Registry and MRV System**

### Overview
A comprehensive blockchain-powered registry for blue carbon ecosystem restoration with automated Monitoring, Reporting, and Verification (MRV) system.

### Key Features
- 🏛️ **NGO Registration & Admin Approval System**
- 📱 **Geo-tagged Photo Upload with EXIF data extraction**
- 🤖 **AI-Powered Plant Species Detection using CNN**
- ⛓️ **Blockchain-based Carbon Credit Tokenization**
- 👨‍💼 **Admin Dashboard for verification and approval**
- 💰 **Token Trading Marketplace**
- 📊 **MRV (Monitoring, Reporting, Verification) System**

### Architecture
```
├── frontend/          # React.js Admin Dashboard & NGO Portal
├── backend/           # Node.js/Express API Server
├── blockchain/        # Smart Contracts (Solidity)
├── ai-model/          # CNN Plant Detection Model
├── mobile/            # Mobile-responsive components
└── docs/              # Documentation
```

### Technology Stack
- **Frontend**: React.js, Material-UI, Web3.js
- **Backend**: Node.js, Express.js, MongoDB
- **Blockchain**: Ethereum, Solidity, Hardhat
- **AI/ML**: Pytorch , CNN for plant detection
- **Image Processing**: Sharp, EXIF extraction
- **Authentication**: JWT, Role-based access control

### Quick Start
1. Clone the repository
2. Install dependencies: `npm run install-all`
3. Configure environment variables
4. Start development servers: `npm run dev`

### Organizations Involved
- **Ministry of Earth Sciences (MoES)**
- **National Centre for Coastal Research (NCCR)**

---
*Built for Smart India Hackathon 2024*
