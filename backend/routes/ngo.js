const express = require('express');
const NGO = require('../models/NGO');
const Upload = require('../models/Upload');
const { authMiddleware, ngoOnly } = require('../middleware/auth');

const router = express.Router();

// Apply NGO authentication to all routes
router.use(authMiddleware);
router.use(ngoOnly);

// @route   GET /api/ngo/profile
// @desc    Get NGO profile
// @access  Private (NGO only)
router.get('/profile', async (req, res) => {
  try {
    const ngo = await NGO.findById(req.user.userId)
      .populate('approvedBy', 'name email department');

    if (!ngo) {
      return res.status(404).json({
        success: false,
        message: 'NGO not found'
      });
    }

    res.json({
      success: true,
      data: {
        ngo
      }
    });
  } catch (error) {
    console.error('Get NGO profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   PUT /api/ngo/profile
// @desc    Update NGO profile
// @access  Private (NGO only)
router.put('/profile', async (req, res) => {
  try {
    const {
      organizationName,
      contactPerson,
      address,
      description,
      focusAreas,
      walletAddress
    } = req.body;

    const ngo = await NGO.findById(req.user.userId);
    if (!ngo) {
      return res.status(404).json({
        success: false,
        message: 'NGO not found'
      });
    }

    // Update allowed fields (some fields like registration number cannot be changed)
    if (organizationName) ngo.organizationName = organizationName;
    if (contactPerson) {
      ngo.contactPerson = { ...ngo.contactPerson.toObject(), ...contactPerson };
    }
    if (address) {
      ngo.address = { ...ngo.address.toObject(), ...address };
    }
    if (description) ngo.description = description;
    if (focusAreas) ngo.focusAreas = focusAreas;
    if (walletAddress) ngo.walletAddress = walletAddress;

    await ngo.save();

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: {
        ngo: ngo.getSummary()
      }
    });
  } catch (error) {
    console.error('Update NGO profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/ngo/dashboard
// @desc    Get NGO dashboard data
// @access  Private (NGO only)
router.get('/dashboard', async (req, res) => {
  try {
    const ngoId = req.user.userId;

    // Get NGO basic info
    const ngo = await NGO.findById(ngoId);
    
    // Get upload statistics
    const [
      totalUploads,
      pendingUploads,
      approvedUploads,
      rejectedUploads
    ] = await Promise.all([
      Upload.countDocuments({ ngoId }),
      Upload.countDocuments({ ngoId, approvalStatus: 'pending' }),
      Upload.countDocuments({ ngoId, approvalStatus: 'approved' }),
      Upload.countDocuments({ ngoId, approvalStatus: 'rejected' })
    ]);

    // Get carbon credits summary
    const carbonStats = await Upload.aggregate([
      { $match: { ngoId: ngo._id, approvalStatus: 'approved' } },
      {
        $group: {
          _id: null,
          totalApprovedCredits: { $sum: '$adminReview.approvedCredits' },
          totalEstimatedCredits: { $sum: '$carbonEstimate.estimatedCredits' }
        }
      }
    ]);

    // Get recent uploads
    const recentUploads = await Upload.find({ ngoId })
      .sort({ createdAt: -1 })
      .limit(5)
      .select('imageUrl aiDetection.plantType carbonEstimate.estimatedCredits approvalStatus createdAt location.state');

    // Get plant type distribution
    const plantTypeStats = await Upload.aggregate([
      { $match: { ngoId: ngo._id } },
      {
        $group: {
          _id: '$aiDetection.plantType',
          count: { $sum: 1 },
          totalArea: { $sum: '$plantationData.areaCovered' },
          approvedCount: {
            $sum: { $cond: [{ $eq: ['$approvalStatus', 'approved'] }, 1, 0] }
          }
        }
      }
    ]);

    // Get monthly activity (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyActivity = await Upload.aggregate([
      { $match: { ngoId: ngo._id, createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          uploads: { $sum: 1 },
          plants: { $sum: '$plantationData.numberOfPlants' },
          area: { $sum: '$plantationData.areaCovered' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        ngoInfo: {
          organizationName: ngo.organizationName,
          approvalStatus: ngo.approvalStatus,
          carbonCredits: ngo.carbonCredits,
          totalPlantations: ngo.totalPlantations,
          totalAreaCovered: ngo.totalAreaCovered,
          joinedDate: ngo.createdAt
        },
        statistics: {
          uploads: {
            total: totalUploads,
            pending: pendingUploads,
            approved: approvedUploads,
            rejected: rejectedUploads
          },
          carbonCredits: carbonStats[0] || {
            totalApprovedCredits: 0,
            totalEstimatedCredits: 0
          }
        },
        recentUploads,
        distributions: {
          plantTypes: plantTypeStats
        },
        activity: {
          monthly: monthlyActivity
        }
      }
    });
  } catch (error) {
    console.error('Get NGO dashboard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/ngo/uploads
// @desc    Get all uploads for the NGO
// @access  Private (NGO only)
router.get('/uploads', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, plantType } = req.query;
    
    let query = { ngoId: req.user.userId };
    if (status) query.approvalStatus = status;
    if (plantType) query['aiDetection.plantType'] = plantType;

    const uploads = await Upload.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Upload.countDocuments(query);

    res.json({
      success: true,
      data: {
        uploads: uploads.map(upload => ({
          id: upload._id,
          imageUrl: upload.imageUrl,
          location: upload.location,
          aiDetection: upload.aiDetection,
          plantationData: upload.plantationData,
          carbonEstimate: upload.carbonEstimate,
          approvalStatus: upload.approvalStatus,
          status: upload.status,
          adminReview: upload.adminReview,
          createdAt: upload.createdAt
        })),
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get NGO uploads error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/ngo/carbon-credits
// @desc    Get carbon credits history and balance
// @access  Private (NGO only)
router.get('/carbon-credits', async (req, res) => {
  try {
    const ngo = await NGO.findById(req.user.userId);
    
    // Get detailed carbon credits from approved uploads
    const approvedUploads = await Upload.find({
      ngoId: req.user.userId,
      approvalStatus: 'approved'
    })
    .select('adminReview.approvedCredits carbonEstimate.estimatedCredits createdAt adminReview.reviewedAt aiDetection.plantType location.state')
    .sort({ 'adminReview.reviewedAt': -1 });

    // Calculate totals
    const totalEarned = approvedUploads.reduce((sum, upload) => 
      sum + (upload.adminReview.approvedCredits || 0), 0);

    res.json({
      success: true,
      data: {
        balance: ngo.carbonCredits,
        history: approvedUploads.map(upload => ({
          id: upload._id,
          creditsEarned: upload.adminReview.approvedCredits,
          estimatedCredits: upload.carbonEstimate.estimatedCredits,
          plantType: upload.aiDetection.plantType,
          location: upload.location.state,
          earnedDate: upload.adminReview.reviewedAt,
          uploadDate: upload.createdAt
        })),
        summary: {
          totalEarned,
          totalSold: ngo.carbonCredits.sold,
          availableBalance: ngo.carbonCredits.balance
        }
      }
    });
  } catch (error) {
    console.error('Get carbon credits error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/ngo/statistics
// @desc    Get detailed NGO statistics
// @access  Private (NGO only)
router.get('/statistics', async (req, res) => {
  try {
    const ngoId = req.user.userId;

    // Get comprehensive statistics
    const stats = await Upload.aggregate([
      { $match: { ngoId: ngo._id } },
      {
        $group: {
          _id: null,
          totalUploads: { $sum: 1 },
          totalPlants: { $sum: '$plantationData.numberOfPlants' },
          totalArea: { $sum: '$plantationData.areaCovered' },
          averageConfidence: { $avg: '$aiDetection.confidence' },
          approvedUploads: {
            $sum: { $cond: [{ $eq: ['$approvalStatus', 'approved'] }, 1, 0] }
          },
          totalEstimatedCredits: { $sum: '$carbonEstimate.estimatedCredits' }
        }
      }
    ]);

    // Get state-wise distribution
    const stateStats = await Upload.aggregate([
      { $match: { ngoId: ngo._id } },
      {
        $group: {
          _id: '$location.state',
          count: { $sum: 1 },
          area: { $sum: '$plantationData.areaCovered' },
          plants: { $sum: '$plantationData.numberOfPlants' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get monthly trend for current year
    const currentYear = new Date().getFullYear();
    const monthlyTrend = await Upload.aggregate([
      {
        $match: {
          ngoId: ngo._id,
          createdAt: {
            $gte: new Date(currentYear, 0, 1),
            $lt: new Date(currentYear + 1, 0, 1)
          }
        }
      },
      {
        $group: {
          _id: { $month: '$createdAt' },
          uploads: { $sum: 1 },
          plants: { $sum: '$plantationData.numberOfPlants' },
          area: { $sum: '$plantationData.areaCovered' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      data: {
        overview: stats[0] || {
          totalUploads: 0,
          totalPlants: 0,
          totalArea: 0,
          averageConfidence: 0,
          approvedUploads: 0,
          totalEstimatedCredits: 0
        },
        distributions: {
          states: stateStats
        },
        trends: {
          monthly: monthlyTrend,
          year: currentYear
        }
      }
    });
  } catch (error) {
    console.error('Get NGO statistics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
