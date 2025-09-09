const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const adminSchema = new mongoose.Schema({
  // Basic Information
  name: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
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
    minlength: 8
  },
  
  // Admin Details
  employeeId: {
    type: String,
    required: true,
    unique: true
  },
  designation: String,
  department: {
    type: String,
    default: 'National Centre for Coastal Research (NCCR)'
  },
  
  // Permissions & Role
  role: {
    type: String,
    enum: ['super_admin', 'admin', 'reviewer', 'moderator'],
    default: 'admin'
  },
  permissions: [{
    type: String,
    enum: [
      'approve_ngos',
      'reject_ngos',
      'review_uploads',
      'mint_tokens',
      'manage_users',
      'view_analytics',
      'manage_system',
      'export_data'
    ]
  }],
  
  // Activity Tracking
  stats: {
    ngosApproved: { type: Number, default: 0 },
    ngosRejected: { type: Number, default: 0 },
    uploadsReviewed: { type: Number, default: 0 },
    creditsIssued: { type: Number, default: 0 }
  },
  
  // Account Status
  isActive: { type: Boolean, default: true },
  lastLogin: Date,
  loginAttempts: { type: Number, default: 0 },
  lockUntil: Date,
  
  // Profile
  profileImage: String,
  phone: String,
  
}, {
  timestamps: true,
  toJSON: {
    transform: function(doc, ret) {
      delete ret.password;
      delete ret.loginAttempts;
      delete ret.lockUntil;
      return ret;
    }
  }
});

// Indexes
adminSchema.index({ email: 1 });
adminSchema.index({ employeeId: 1 });
adminSchema.index({ role: 1 });

// Virtual for account lock status
adminSchema.virtual('isLocked').get(function() {
  return !!(this.lockUntil && this.lockUntil > Date.now());
});

// Hash password before saving
adminSchema.pre('save', async function(next) {
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
adminSchema.methods.comparePassword = async function(candidatePassword) {
  if (this.isLocked) {
    throw new Error('Account is temporarily locked');
  }
  return bcrypt.compare(candidatePassword, this.password);
};

// Handle failed login attempts
adminSchema.methods.incLoginAttempts = async function() {
  // If we have a previous lock that has expired, restart at 1
  if (this.lockUntil && this.lockUntil < Date.now()) {
    return this.updateOne({
      $unset: { lockUntil: 1 },
      $set: { loginAttempts: 1 }
    });
  }
  
  const updates = { $inc: { loginAttempts: 1 } };
  
  // If we've reached max attempts and it's not locked already, lock it
  if (this.loginAttempts + 1 >= 5 && !this.isLocked) {
    updates.$set = { lockUntil: Date.now() + 2 * 60 * 60 * 1000 }; // 2 hours
  }
  
  return this.updateOne(updates);
};

// Reset login attempts on successful login
adminSchema.methods.resetLoginAttempts = async function() {
  return this.updateOne({
    $unset: { loginAttempts: 1, lockUntil: 1 }
  });
};

// Check if admin has specific permission
adminSchema.methods.hasPermission = function(permission) {
  return this.permissions.includes(permission) || this.role === 'super_admin';
};

// Update activity stats
adminSchema.methods.updateStats = function(action, increment = 1) {
  const statMap = {
    'ngo_approved': 'ngosApproved',
    'ngo_rejected': 'ngosRejected',
    'upload_reviewed': 'uploadsReviewed',
    'credits_issued': 'creditsIssued'
  };
  
  const statField = statMap[action];
  if (statField) {
    this.stats[statField] += increment;
    return this.save();
  }
};

// Get admin summary
adminSchema.methods.getSummary = function() {
  return {
    id: this._id,
    name: this.name,
    email: this.email,
    role: this.role,
    department: this.department,
    stats: this.stats,
    isActive: this.isActive,
    lastLogin: this.lastLogin,
    createdAt: this.createdAt
  };
};

module.exports = mongoose.model('Admin', adminSchema);
