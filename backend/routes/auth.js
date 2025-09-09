const express = require('express');
const jwt = require('jsonwebtoken');
const NGO = require('../models/NGO');
const Admin = require('../models/Admin');
// Simple validation function
const validateEmail = (email) => {
  const emailRegex = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
  return emailRegex.test(email);
};

const validateRequired = (fields, body) => {
  const errors = [];
  for (const field of fields) {
    if (!body[field]) {
      errors.push({ field, message: `${field} is required` });
    }
  }
  return errors;
};

const router = express.Router();

// JWT Secret
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// Generate JWT Token
const generateToken = (user, userType) => {
  return jwt.sign(
    { 
      userId: user._id,
      email: user.email,
      userType: userType // 'ngo' or 'admin'
    },
    JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// @route   POST /api/auth/ngo/register
// @desc    Register a new NGO
// @access  Public
router.post('/ngo/register', [
  body('organizationName').notEmpty().withMessage('Organization name is required'),
  body('registrationNumber').notEmpty().withMessage('Registration number is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
  body('contactPerson.name').notEmpty().withMessage('Contact person name is required'),
  body('contactPerson.phone').notEmpty().withMessage('Contact person phone is required')
], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      organizationName,
      registrationNumber,
      email,
      password,
      contactPerson,
      address,
      yearEstablished,
      focusAreas,
      description
    } = req.body;

    // Check if NGO already exists
    const existingNGO = await NGO.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { registrationNumber }
      ]
    });

    if (existingNGO) {
      return res.status(400).json({
        success: false,
        message: 'NGO already exists with this email or registration number'
      });
    }

    // Create new NGO
    const ngo = new NGO({
      organizationName,
      registrationNumber,
      email: email.toLowerCase(),
      password,
      contactPerson,
      address,
      yearEstablished,
      focusAreas,
      description
    });

    await ngo.save();

    // Generate token
    const token = generateToken(ngo, 'ngo');

    res.status(201).json({
      success: true,
      message: 'NGO registered successfully. Awaiting admin approval.',
      data: {
        token,
        ngo: ngo.getSummary()
      }
    });

  } catch (error) {
    console.error('NGO registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
});

// @route   POST /api/auth/ngo/login
// @desc    Login NGO
// @access  Public
router.post('/ngo/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find NGO by email
    const ngo = await NGO.findOne({ email: email.toLowerCase() });
    if (!ngo) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if NGO is active
    if (!ngo.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    // Verify password
    const isPasswordValid = await ngo.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    ngo.lastLogin = new Date();
    await ngo.save();

    // Generate token
    const token = generateToken(ngo, 'ngo');

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        token,
        ngo: ngo.getSummary()
      }
    });

  } catch (error) {
    console.error('NGO login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
});

// @route   POST /api/auth/admin/login
// @desc    Login Admin
// @access  Public
router.post('/admin/login', [
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find admin by email
    const admin = await Admin.findOne({ email: email.toLowerCase() });
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check if admin account is active
    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account has been deactivated'
      });
    }

    try {
      // Verify password
      const isPasswordValid = await admin.comparePassword(password);
      
      if (!isPasswordValid) {
        await admin.incLoginAttempts();
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      // Reset login attempts on successful login
      await admin.resetLoginAttempts();

      // Update last login
      admin.lastLogin = new Date();
      await admin.save();

      // Generate token
      const token = generateToken(admin, 'admin');

      res.json({
        success: true,
        message: 'Admin login successful',
        data: {
          token,
          admin: admin.getSummary()
        }
      });

    } catch (authError) {
      if (authError.message === 'Account is temporarily locked') {
        return res.status(423).json({
          success: false,
          message: 'Account is temporarily locked due to too many failed login attempts'
        });
      }
      throw authError;
    }

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
});

// @route   POST /api/auth/admin/register
// @desc    Register a new Admin (only for super admin)
// @access  Private (Super Admin only)
router.post('/admin/register', [
  body('name').notEmpty().withMessage('Name is required'),
  body('email').isEmail().withMessage('Please provide a valid email'),
  body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
  body('employeeId').notEmpty().withMessage('Employee ID is required'),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation errors',
        errors: errors.array()
      });
    }

    const {
      name,
      email,
      password,
      employeeId,
      designation,
      role,
      permissions
    } = req.body;

    // Check if admin already exists
    const existingAdmin = await Admin.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { employeeId }
      ]
    });

    if (existingAdmin) {
      return res.status(400).json({
        success: false,
        message: 'Admin already exists with this email or employee ID'
      });
    }

    // Create new admin
    const admin = new Admin({
      name,
      email: email.toLowerCase(),
      password,
      employeeId,
      designation,
      role: role || 'admin',
      permissions: permissions || ['approve_ngos', 'review_uploads', 'view_analytics']
    });

    await admin.save();

    res.status(201).json({
      success: true,
      message: 'Admin account created successfully',
      data: {
        admin: admin.getSummary()
      }
    });

  } catch (error) {
    console.error('Admin registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during registration'
    });
  }
});

// @route   GET /api/auth/verify
// @desc    Verify JWT token
// @access  Private
router.get('/verify', async (req, res) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    let user;
    if (decoded.userType === 'ngo') {
      user = await NGO.findById(decoded.userId);
    } else if (decoded.userType === 'admin') {
      user = await Admin.findById(decoded.userId);
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    res.json({
      success: true,
      message: 'Token is valid',
      data: {
        user: user.getSummary ? user.getSummary() : user,
        userType: decoded.userType
      }
    });

  } catch (error) {
    res.status(401).json({
      success: false,
      message: 'Invalid token'
    });
  }
});

module.exports = router;
