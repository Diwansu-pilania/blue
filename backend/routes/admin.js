const express = require('express');
const NGO = require('../models/NGO');
const Upload = require('../models/Upload');
const Admin = require('../models/Admin');
const { authMiddleware, adminOnly, requirePermission } = require('../middleware/auth');

const router = express.Router();

// Apply admin authentication to all routes
router.use(authMiddleware);
router.use(adminOnly);

// @route   GET /api/admin/ngos/pending
// @desc    Get all pending NGO applications
// @access  Private (Admin with approve_ngos permission)
router.get('/ngos/pending', requirePermission('approve_ngos'), async (req, res) => {
  try {
    const { page = 1, limit = 10, state, focusArea } = req.query;
    
    let query = { approvalStatus: 'pending' };
    if (state) query['address.state'] = state;
    if (focusArea) query.focusAreas = focusArea;

    const ngos = await NGO.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password');

    const total = await NGO.countDocuments(query);

    res.json({
      success: true,
      data: {
        ngos,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get pending NGOs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/admin/ngos/:id/approve
// @desc    Approve an NGO application
// @access  Private (Admin with approve_ngos permission)
router.post('/ngos/:id/approve', requirePermission('approve_ngos'), async (req, res) => {
  try {
    const { id } = req.params;
    const { comments } = req.body;

    const ngo = await NGO.findById(id);
    if (!ngo) {
      return res.status(404).json({
        success: false,
        message: 'NGO not found'
      });
    }

    if (ngo.approvalStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'NGO is not in pending status'
      });
    }

    // Approve the NGO
    ngo.approvalStatus = 'approved';
    ngo.approvedBy = req.user.userId;
    ngo.approvedAt = new Date();
    if (comments) {
      ngo.rejectionReason = undefined; // Clear any previous rejection reason
    }

    await ngo.save();

    // Update admin stats
    await req.user.userData.updateStats('ngo_approved');

    res.json({
      success: true,
      message: 'NGO approved successfully',
      data: {
        ngo: ngo.getSummary()
      }
    });
  } catch (error) {
    console.error('Approve NGO error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/admin/ngos/:id/reject
// @desc    Reject an NGO application
// @access  Private (Admin with reject_ngos permission)
router.post('/ngos/:id/reject', requirePermission('reject_ngos'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const ngo = await NGO.findById(id);
    if (!ngo) {
      return res.status(404).json({
        success: false,
        message: 'NGO not found'
      });
    }

    if (ngo.approvalStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'NGO is not in pending status'
      });
    }

    // Reject the NGO
    ngo.approvalStatus = 'rejected';
    ngo.rejectionReason = reason;
    ngo.approvedBy = req.user.userId;
    ngo.approvedAt = new Date();

    await ngo.save();

    // Update admin stats
    await req.user.userData.updateStats('ngo_rejected');

    res.json({
      success: true,
      message: 'NGO application rejected',
      data: {
        ngo: ngo.getSummary()
      }
    });
  } catch (error) {
    console.error('Reject NGO error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/admin/uploads/pending
// @desc    Get all uploads pending admin review
// @access  Private (Admin with review_uploads permission)
router.get('/uploads/pending', requirePermission('review_uploads'), async (req, res) => {
  try {
    const { page = 1, limit = 10, plantType, state } = req.query;
    
    let query = { approvalStatus: 'pending' };
    if (plantType) query['aiDetection.plantType'] = plantType;
    if (state) query['location.state'] = state;

    const uploads = await Upload.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('ngoId', 'organizationName email');

    const total = await Upload.countDocuments(query);

    res.json({
      success: true,
      data: {
        uploads: uploads.map(upload => upload.getSummary()),
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get pending uploads error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/admin/uploads/:id/approve
// @desc    Approve an upload and assign carbon credits
// @access  Private (Admin with review_uploads permission)
router.post('/uploads/:id/approve', requirePermission('review_uploads'), async (req, res) => {
  try {
    const { id } = req.params;
    const { approvedCredits, comments } = req.body;

    const upload = await Upload.findById(id).populate('ngoId');
    if (!upload) {
      return res.status(404).json({
        success: false,
        message: 'Upload not found'
      });
    }

    if (upload.approvalStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Upload is not in pending status'
      });
    }

    const finalCredits = approvedCredits || upload.carbonEstimate.estimatedCredits;

    // Approve the upload
    upload.approvalStatus = 'approved';
    upload.status = 'approved';
    upload.adminReview = {
      reviewedBy: req.user.userId,
      reviewedAt: new Date(),
      comments: comments || 'Approved',
      approvedCredits: finalCredits
    };

    await upload.save();

    // Update NGO carbon credits
    await upload.ngoId.updateCarbonCredits(finalCredits, 0);

    // Update admin stats
    await req.user.userData.updateStats('upload_reviewed');
    await req.user.userData.updateStats('credits_issued', finalCredits);

    res.json({
      success: true,
      message: 'Upload approved and carbon credits assigned',
      data: {
        upload: upload.getSummary(),
        creditsAwarded: finalCredits
      }
    });
  } catch (error) {
    console.error('Approve upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   POST /api/admin/uploads/:id/reject
// @desc    Reject an upload
// @access  Private (Admin with review_uploads permission)
router.post('/uploads/:id/reject', requirePermission('review_uploads'), async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).json({
        success: false,
        message: 'Rejection reason is required'
      });
    }

    const upload = await Upload.findById(id);
    if (!upload) {
      return res.status(404).json({
        success: false,
        message: 'Upload not found'
      });
    }

    if (upload.approvalStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        message: 'Upload is not in pending status'
      });
    }

    // Reject the upload
    upload.approvalStatus = 'rejected';
    upload.status = 'rejected';
    upload.adminReview = {
      reviewedBy: req.user.userId,
      reviewedAt: new Date(),
      rejectionReason: reason
    };

    await upload.save();

    // Update admin stats
    await req.user.userData.updateStats('upload_reviewed');

    res.json({
      success: true,
      message: 'Upload rejected',
      data: {
        upload: upload.getSummary()
      }
    });
  } catch (error) {
    console.error('Reject upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/admin/analytics/dashboard
// @desc    Get admin dashboard analytics
// @access  Private (Admin with view_analytics permission)
router.get('/analytics/dashboard', requirePermission('view_analytics'), async (req, res) => {
  try {
    // Get counts
    const [
      totalNGOs,
      pendingNGOs,
      approvedNGOs,
      totalUploads,
      pendingUploads,
      approvedUploads,
      totalCreditsIssued
    ] = await Promise.all([
      NGO.countDocuments(),
      NGO.countDocuments({ approvalStatus: 'pending' }),
      NGO.countDocuments({ approvalStatus: 'approved' }),
      Upload.countDocuments(),
      Upload.countDocuments({ approvalStatus: 'pending' }),
      Upload.countDocuments({ approvalStatus: 'approved' }),
      Upload.aggregate([
        { $match: { approvalStatus: 'approved' } },
        { $group: { _id: null, total: { $sum: '$adminReview.approvedCredits' } } }
      ])
    ]);

    // Get state-wise distribution
    const stateDistribution = await NGO.aggregate([
      { $match: { approvalStatus: 'approved' } },
      { $group: { _id: '$address.state', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    // Get plant type distribution
    const plantTypeDistribution = await Upload.aggregate([
      { $match: { approvalStatus: 'approved' } },
      { $group: { 
        _id: '$aiDetection.plantType', 
        count: { $sum: 1 },
        totalCredits: { $sum: '$adminReview.approvedCredits' }
      } },
      { $sort: { count: -1 } }
    ]);

    // Get monthly upload trends (last 6 months)
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

    const monthlyTrends = await Upload.aggregate([
      { $match: { createdAt: { $gte: sixMonthsAgo } } },
      {
        $group: {
          _id: {
            year: { $year: '$createdAt' },
            month: { $month: '$createdAt' }
          },
          uploads: { $sum: 1 },
          approved: {
            $sum: { $cond: [{ $eq: ['$approvalStatus', 'approved'] }, 1, 0] }
          }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          ngos: {
            total: totalNGOs,
            pending: pendingNGOs,
            approved: approvedNGOs
          },
          uploads: {
            total: totalUploads,
            pending: pendingUploads,
            approved: approvedUploads
          },
          carbonCredits: {
            totalIssued: totalCreditsIssued[0]?.total || 0
          }
        },
        distributions: {
          states: stateDistribution,
          plantTypes: plantTypeDistribution
        },
        trends: {
          monthly: monthlyTrends
        }
      }
    });
  } catch (error) {
    console.error('Get admin analytics error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/admin/ngos
// @desc    Get all NGOs with filtering
// @access  Private (Admin)
router.get('/ngos', async (req, res) => {
  try {
    const { page = 1, limit = 10, status, state, search } = req.query;
    
    let query = {};
    if (status) query.approvalStatus = status;
    if (state) query['address.state'] = state;
    if (search) {
      query.$or = [
        { organizationName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { registrationNumber: { $regex: search, $options: 'i' } }
      ];
    }

    const ngos = await NGO.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .select('-password')
      .populate('approvedBy', 'name email');

    const total = await NGO.countDocuments(query);

    res.json({
      success: true,
      data: {
        ngos,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    console.error('Get all NGOs error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
