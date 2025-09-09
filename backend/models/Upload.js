const mongoose = require('mongoose');

const uploadSchema = new mongoose.Schema({
  // NGO Information
  ngoId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'NGO',
    required: true
  },
  
  // Image Information
  imageUrl: {
    type: String,
    required: true
  },
  originalFileName: String,
  fileSize: Number,
  mimeType: String,
  
  // Geo-location Data (extracted from EXIF)
  geoData: {
    latitude: {
      type: Number,
      required: true,
      min: -90,
      max: 90
    },
    longitude: {
      type: Number,
      required: true,
      min: -180,
      max: 180
    },
    altitude: Number,
    accuracy: Number,
    direction: Number, // Camera direction in degrees
    timestamp: Date    // When photo was taken
  },
  
  // Location Details
  location: {
    address: String,
    district: String,
    state: String,
    country: { type: String, default: 'India' },
    nearestLandmark: String,
    coastalZone: Boolean // Whether it's in coastal area
  },
  
  // AI Plant Detection Results
  aiDetection: {
    plantSpecies: String,
    confidence: {
      type: Number,
      min: 0,
      max: 1
    },
    plantType: {
      type: String,
      enum: ['Mangrove', 'Seagrass', 'Salt Marsh', 'Coastal Tree', 'Marine Plant', 'Other']
    },
    modelVersion: String,
    detectedAt: { type: Date, default: Date.now }
  },
  
  // Plantation Details
  plantationData: {
    numberOfPlants: {
      type: Number,
      required: true,
      min: 1
    },
    areaCovered: {
      type: Number, // in square meters
      required: true,
      min: 1
    },
    plantingDate: {
      type: Date,
      default: Date.now
    },
    expectedMaturity: Date,
    maintenanceRequired: Boolean
  },
  
  // Carbon Credit Estimation
  carbonEstimate: {
    estimatedCredits: {
      type: Number,
      default: 0
    },
    calculationMethod: String,
    factorsConsidered: [String],
    estimatedAt: Date
  },
  
  // Approval Status
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'needs_review'],
    default: 'pending'
  },
  
  adminReview: {
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Admin'
    },
    reviewedAt: Date,
    comments: String,
    rejectionReason: String,
    approvedCredits: Number
  },
  
  // Blockchain Integration
  blockchainData: {
    tokenId: String,
    transactionHash: String,
    blockNumber: Number,
    mintedAt: Date,
    mintedCredits: Number
  },
  
  // Verification & MRV
  verification: {
    isVerified: { type: Boolean, default: false },
    verificationMethod: String,
    verifiedBy: String,
    verificationDate: Date,
    documentHash: String // IPFS hash or similar
  },
  
  // Additional metadata
  metadata: {
    deviceInfo: String,
    appVersion: String,
    weatherConditions: String,
    seasonalNotes: String
  },
  
  // Status tracking
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'ai_analyzed', 'pending_approval', 'approved', 'tokenized', 'rejected'],
    default: 'uploaded'
  },
  
  isActive: { type: Boolean, default: true }
  
}, {
  timestamps: true
});

// Indexes for better performance
uploadSchema.index({ ngoId: 1, createdAt: -1 });
uploadSchema.index({ 'geoData.latitude': 1, 'geoData.longitude': 1 });
uploadSchema.index({ approvalStatus: 1 });
uploadSchema.index({ status: 1 });
uploadSchema.index({ 'aiDetection.plantType': 1 });
uploadSchema.index({ 'location.state': 1 });

// Calculate carbon credits based on plant type and area
uploadSchema.methods.calculateCarbonCredits = function() {
  const baseRates = {
    'Mangrove': 3.5, // credits per square meter
    'Seagrass': 2.8,
    'Salt Marsh': 2.2,
    'Coastal Tree': 1.8,
    'Marine Plant': 1.5,
    'Other': 1.0
  };
  
  const plantType = this.aiDetection.plantType;
  const area = this.plantationData.areaCovered;
  const rate = baseRates[plantType] || baseRates['Other'];
  
  this.carbonEstimate.estimatedCredits = area * rate;
  this.carbonEstimate.calculationMethod = 'Base rate calculation';
  this.carbonEstimate.factorsConsidered = [
    'Plant type',
    'Area covered',
    'Regional carbon sequestration rates'
  ];
  this.carbonEstimate.estimatedAt = new Date();
  
  return this.carbonEstimate.estimatedCredits;
};

// Get upload summary
uploadSchema.methods.getSummary = function() {
  return {
    id: this._id,
    ngoId: this.ngoId,
    location: {
      latitude: this.geoData.latitude,
      longitude: this.geoData.longitude,
      state: this.location.state
    },
    plantType: this.aiDetection.plantType,
    confidence: this.aiDetection.confidence,
    numberOfPlants: this.plantationData.numberOfPlants,
    areaCovered: this.plantationData.areaCovered,
    estimatedCredits: this.carbonEstimate.estimatedCredits,
    approvalStatus: this.approvalStatus,
    status: this.status,
    createdAt: this.createdAt
  };
};

// Virtual for displaying formatted location
uploadSchema.virtual('formattedLocation').get(function() {
  return `${this.location.district}, ${this.location.state}`;
});

module.exports = mongoose.model('Upload', uploadSchema);
