const jwt = require('jsonwebtoken');
const NGO = require('../models/NGO');
const Admin = require('../models/Admin');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

// General authentication middleware
const authMiddleware = async (req, res, next) => {
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
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token or inactive account'
        });
      }
    } else if (decoded.userType === 'admin') {
      user = await Admin.findById(decoded.userId);
      if (!user || !user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token or inactive account'
        });
      }
    } else {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }

    req.user = {
      userId: decoded.userId,
      email: decoded.email,
      userType: decoded.userType,
      userData: user
    };
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    } else if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    
    console.error('Auth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Internal server error during authentication'
    });
  }
};

// NGO only middleware
const ngoOnly = (req, res, next) => {
  if (req.user.userType !== 'ngo') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. NGO access required.'
    });
  }
  
  // Check if NGO is approved
  if (req.user.userData.approvalStatus !== 'approved') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. NGO approval required.'
    });
  }
  
  next();
};

// Admin only middleware
const adminOnly = (req, res, next) => {
  if (req.user.userType !== 'admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied. Admin access required.'
    });
  }
  next();
};

// Permission-based middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin access required.'
      });
    }
    
    const admin = req.user.userData;
    if (!admin.hasPermission(permission)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. ${permission} permission required.`
      });
    }
    
    next();
  };
};

// Role-based middleware
const requireRole = (roles) => {
  return (req, res, next) => {
    if (req.user.userType !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied. Admin access required.'
      });
    }
    
    const admin = req.user.userData;
    if (!roles.includes(admin.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Required role: ${roles.join(' or ')}`
      });
    }
    
    next();
  };
};

// Optional auth middleware (doesn't fail if no token)
const optionalAuth = async (req, res, next) => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      req.user = null;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    
    let user;
    if (decoded.userType === 'ngo') {
      user = await NGO.findById(decoded.userId);
    } else if (decoded.userType === 'admin') {
      user = await Admin.findById(decoded.userId);
    }

    if (user && user.isActive) {
      req.user = {
        userId: decoded.userId,
        email: decoded.email,
        userType: decoded.userType,
        userData: user
      };
    } else {
      req.user = null;
    }
    
    next();
  } catch (error) {
    req.user = null;
    next();
  }
};

module.exports = {
  authMiddleware,
  ngoOnly,
  adminOnly,
  requirePermission,
  requireRole,
  optionalAuth
};
