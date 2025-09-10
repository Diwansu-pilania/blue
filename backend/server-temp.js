const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// CORS configuration
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Static files for uploaded images
app.use('/uploads', express.static('uploads'));

// Temporary in-memory storage for testing
let tempDB = {
  ngos: [],
  uploads: [],
  admins: [
    {
      id: 1,
      email: 'admin@bluecarbon.gov.in',
      password: 'admin123',
      name: 'System Administrator',
      role: 'admin'
    }
  ]
};

console.log('⚠️ Using temporary in-memory database for testing');
console.log('📝 Default admin credentials:');
console.log('   Email: admin@bluecarbon.gov.in');
console.log('   Password: admin123');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    message: 'Blue Carbon Registry API is running (Temp Mode)',
    timestamp: new Date().toISOString(),
    version: '1.0.0-temp',
    database: 'In-Memory (Testing)',
    endpoints: {
      health: '/api/health',
      ngoRegister: '/api/auth/ngo/register',
      ngoLogin: '/api/auth/ngo/login',
      adminLogin: '/api/auth/admin/login'
    }
  });
});

// NGO Registration endpoint
app.post('/api/auth/ngo/register', (req, res) => {
  try {
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

    // Basic validation
    if (!organizationName || !registrationNumber || !email || !password || !contactPerson) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields',
        required: ['organizationName', 'registrationNumber', 'email', 'password', 'contactPerson']
      });
    }

    // Check if NGO already exists
    const existingNGO = tempDB.ngos.find(ngo => 
      ngo.email.toLowerCase() === email.toLowerCase() || 
      ngo.registrationNumber === registrationNumber
    );

    if (existingNGO) {
      return res.status(400).json({
        success: false,
        message: 'NGO already exists with this email or registration number'
      });
    }

    // Create new NGO
    const newNGO = {
      id: tempDB.ngos.length + 1,
      organizationName,
      registrationNumber,
      email: email.toLowerCase(),
      password, // In real app, this would be hashed
      contactPerson,
      address,
      yearEstablished,
      focusAreas: focusAreas || [],
      description,
      status: 'pending', // pending, approved, rejected
      createdAt: new Date(),
      isActive: true
    };

    tempDB.ngos.push(newNGO);

    res.status(201).json({
      success: true,
      message: 'NGO registered successfully. Awaiting admin approval.',
      data: {
        ngo: {
          id: newNGO.id,
          organizationName: newNGO.organizationName,
          email: newNGO.email,
          status: newNGO.status,
          registrationNumber: newNGO.registrationNumber
        }
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

// NGO Login endpoint
app.post('/api/auth/ngo/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find NGO by email
    const ngo = tempDB.ngos.find(n => n.email.toLowerCase() === email.toLowerCase());
    if (!ngo) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password (in real app, use bcrypt)
    if (ngo.password !== password) {
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

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        ngo: {
          id: ngo.id,
          organizationName: ngo.organizationName,
          email: ngo.email,
          status: ngo.status,
          registrationNumber: ngo.registrationNumber
        }
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

// Admin Login endpoint
app.post('/api/auth/admin/login', (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required'
      });
    }

    // Find admin by email
    const admin = tempDB.admins.find(a => a.email.toLowerCase() === email.toLowerCase());
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    if (admin.password !== password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        admin: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
          role: admin.role
        }
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
});

// Get all NGOs (Admin endpoint)
app.get('/api/admin/ngos', (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        ngos: tempDB.ngos.map(ngo => ({
          id: ngo.id,
          organizationName: ngo.organizationName,
          email: ngo.email,
          registrationNumber: ngo.registrationNumber,
          status: ngo.status,
          createdAt: ngo.createdAt,
          contactPerson: ngo.contactPerson
        }))
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error fetching NGOs'
    });
  }
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ message: 'Route not found' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🌐 Frontend URL: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`);
  console.log(`🧪 Using temporary in-memory database for testing`);
  console.log(`🔗 API Health Check: http://localhost:${PORT}/api/health`);
  console.log(`\n🎯 Ready for full frontend-backend testing!`);
});

module.exports = app;
