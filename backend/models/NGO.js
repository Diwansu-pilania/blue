const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const ngoSchema = new mongoose.Schema({
  // Basic Information
  organizationName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 200
  },
  registrationNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    validate: {
      validator: function(v) {
        return /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/.test(v);
      },
      message: 'Please enter a valid email'
    }
  },
  password: {
    type: String,
    required: true,
    minlength: 6
  },
  
  // Contact Information
  contactPerson: {
    name: { type: String, required: true },
    designation: String,
    phone: { type: String, required: true }
  },
  
  address: {
    street: String,
    city: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  
  // Organization Details
  yearEstablished: Number,
  focusAreas: [{
    type: String,
    enum: ['Mangrove Restoration', 'Seagrass Conservation', 'Salt Marsh Protection', 'Coastal Afforestation', 'Marine Conservation']
  }],
  description: {
    type: String,
    maxlength: 1000
  },
  
  // Approval Status
  approvalStatus: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'suspended'],
    default: 'pending'
  },
  
  // Documents
  documents: {
    registrationCertificate: String,
    panCard: String,
    additionalDocuments: [String]
  },
  
  // Blockchain wallet
  walletAddress: String,
  
  // Carbon Credits
  carbonCredits: {
    earned: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    balance: { type: Number, default: 0 }
  },
  
  // Activity tracking
  totalPlantations: { type: Number, default: 0 },
  totalAreaCovered: { type: Number, default: 0 }, // in hectares
  
  // Approval details
  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Admin'
  },
  approvedAt: Date,
  rejectionReason: String,
  
  // Activity status
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      return ret;
    }
  }
});

// Index for better query performance
ngoSchema.index({ email: 1 });
ngoSchema.index({ registrationNumber: 1 });
ngoSchema.index({ approvalStatus: 1 });
ngoSchema.index({ 'address.state': 1 });

// Hash password before saving
ngoSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
ngoSchema.methods.comparePassword = async function(candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Update carbon credits balance
ngoSchema.methods.updateCarbonCredits = function(earned = 0, sold = 0) {
  this.carbonCredits.earned += earned;
  this.carbonCredits.sold += sold;
  this.carbonCredits.balance = this.carbonCredits.earned - this.carbonCredits.sold;
  return this.save();
};

// Get organization summary
ngoSchema.methods.getSummary = function() {
  return {
    id: this._id,
    organizationName: this.organizationName,
    email: this.email,
    approvalStatus: this.approvalStatus,
    carbonCredits: this.carbonCredits,
    totalPlantations: this.totalPlantations,
    totalAreaCovered: this.totalAreaCovered,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('NGO', ngoSchema);
