const express = require('express');
const multer = require('multer');
const sharp = require('sharp');
const exifr = require('exifr');
const path = require('path');
const fs = require('fs').promises;
const Upload = require('../models/Upload');
const NGO = require('../models/NGO');
const { authMiddleware, ngoOnly } = require('../middleware/auth');
const aiDetectionService = require('../utils/aiDetection');

const router = express.Router();

// Configure multer for file upload
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  // Check file type
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Helper function to extract geo-data from EXIF
const extractGeoData = async (imageBuffer) => {
  try {
    const exifData = await exifr.parse(imageBuffer);
    
    if (!exifData || !exifData.latitude || !exifData.longitude) {
      throw new Error('No GPS data found in image');
    }

    return {
      latitude: exifData.latitude,
      longitude: exifData.longitude,
      altitude: exifData.altitude || null,
      accuracy: exifData.gpsHPositioningError || null,
      direction: exifData.gpsImgDirection || null,
      timestamp: exifData.dateTimeOriginal || exifData.createDate || new Date()
    };
  } catch (error) {
    throw new Error('Failed to extract GPS data from image: ' + error.message);
  }
};

// Helper function to get location details from coordinates
const getLocationDetails = async (latitude, longitude) => {
  try {
    // This would typically call a geocoding API like Google Maps or OpenStreetMap
    // For now, we'll return mock data with basic state identification
    
    const statesByCoords = {
      // Rough coordinate ranges for Indian coastal states
      'Tamil Nadu': { minLat: 8.0, maxLat: 13.5, minLng: 77.0, maxLng: 80.5 },
      'Kerala': { minLat: 8.0, maxLat: 12.8, minLng: 74.8, maxLng: 77.5 },
      'Karnataka': { minLat: 11.5, maxLat: 18.5, minLng: 74.0, maxLng: 78.5 },
      'Maharashtra': { minLat: 15.6, maxLat: 22.0, minLng: 72.6, maxLng: 80.9 },
      'Gujarat': { minLat: 20.1, maxLat: 24.7, minLng: 68.2, maxLng: 74.5 },
      'Odisha': { minLat: 17.8, maxLat: 22.6, minLng: 81.3, maxLng: 87.5 },
      'West Bengal': { minLat: 21.5, maxLat: 27.2, minLng: 85.8, maxLng: 89.9 }
    };

    let detectedState = 'Unknown';
    let isCoastal = false;

    for (const [state, bounds] of Object.entries(statesByCoords)) {
      if (latitude >= bounds.minLat && latitude <= bounds.maxLat &&
          longitude >= bounds.minLng && longitude <= bounds.maxLng) {
        detectedState = state;
        isCoastal = true;
        break;
      }
    }

    return {
      state: detectedState,
      country: 'India',
      coastalZone: isCoastal,
      address: `${detectedState}, India` // Simplified address
    };
  } catch (error) {
    return {
      state: 'Unknown',
      country: 'India',
      coastalZone: false,
      address: 'Unknown Location'
    };
  }
};

// @route   POST /api/upload
// @desc    Upload geo-tagged image with plantation data
// @access  Private (NGO only)
router.post('/', authMiddleware, ngoOnly, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const { numberOfPlants, areaCovered, plantingDate, expectedMaturity } = req.body;

    // Validate required fields
    if (!numberOfPlants || !areaCovered) {
      return res.status(400).json({
        success: false,
        message: 'Number of plants and area covered are required'
      });
    }

    // Extract GPS data from image
    let geoData;
    try {
      geoData = await extractGeoData(req.file.buffer);
    } catch (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    // Get location details
    const locationDetails = await getLocationDetails(geoData.latitude, geoData.longitude);

    // Process and save image
    const filename = `upload-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.jpg`;
    const imagePath = path.join(__dirname, '../uploads', filename);

    // Resize and compress image
    const processedImage = await sharp(req.file.buffer)
      .resize(1200, 800, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toBuffer();

    await fs.writeFile(imagePath, processedImage);

    // Perform AI plant detection
    let aiDetectionResult;
    try {
      aiDetectionResult = await aiDetectionService.detectPlantType(processedImage);
    } catch (error) {
      console.error('AI detection error:', error);
      aiDetectionResult = {
        plantSpecies: 'Unknown',
        plantType: 'Other',
        confidence: 0,
        modelVersion: 'unavailable'
      };
    }

    // Create upload record
    const uploadRecord = new Upload({
      ngoId: req.user.userId,
      imageUrl: `/uploads/${filename}`,
      originalFileName: req.file.originalname,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      geoData,
      location: {
        address: locationDetails.address,
        state: locationDetails.state,
        country: locationDetails.country,
        coastalZone: locationDetails.coastalZone
      },
      aiDetection: {
        plantSpecies: aiDetectionResult.plantSpecies,
        plantType: aiDetectionResult.plantType,
        confidence: aiDetectionResult.confidence,
        modelVersion: aiDetectionResult.modelVersion
      },
      plantationData: {
        numberOfPlants: parseInt(numberOfPlants),
        areaCovered: parseFloat(areaCovered),
        plantingDate: plantingDate ? new Date(plantingDate) : new Date(),
        expectedMaturity: expectedMaturity ? new Date(expectedMaturity) : null
      },
      status: 'ai_analyzed'
    });

    // Calculate carbon credits
    uploadRecord.calculateCarbonCredits();

    await uploadRecord.save();

    // Update NGO statistics
    await NGO.findByIdAndUpdate(req.user.userId, {
      $inc: {
        totalPlantations: parseInt(numberOfPlants),
        totalAreaCovered: parseFloat(areaCovered)
      }
    });

    res.status(201).json({
      success: true,
      message: 'Image uploaded and processed successfully',
      data: {
        upload: uploadRecord.getSummary(),
        aiDetection: {
          plantType: aiDetectionResult.plantType,
          confidence: aiDetectionResult.confidence,
          plantSpecies: aiDetectionResult.plantSpecies
        },
        location: {
          latitude: geoData.latitude,
          longitude: geoData.longitude,
          state: locationDetails.state,
          isCoastal: locationDetails.coastalZone
        },
        carbonEstimate: uploadRecord.carbonEstimate
      }
    });

  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during upload processing'
    });
  }
});

// @route   GET /api/upload/ngo/:ngoId
// @desc    Get all uploads for a specific NGO
// @access  Private
router.get('/ngo/:ngoId', authMiddleware, async (req, res) => {
  try {
    const { ngoId } = req.params;
    const { page = 1, limit = 10, status, plantType } = req.query;

    // Check if user can access this NGO's data
    if (req.user.userType === 'ngo' && req.user.userId !== ngoId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    // Build query
    let query = { ngoId };
    if (status) query.approvalStatus = status;
    if (plantType) query['aiDetection.plantType'] = plantType;

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
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    console.error('Get uploads error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/upload/:id
// @desc    Get specific upload details
// @access  Private
router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const upload = await Upload.findById(req.params.id)
      .populate('ngoId', 'organizationName email contactPerson')
      .populate('adminReview.reviewedBy', 'name email');

    if (!upload) {
      return res.status(404).json({
        success: false,
        message: 'Upload not found'
      });
    }

    // Check access permissions
    if (req.user.userType === 'ngo' && upload.ngoId._id.toString() !== req.user.userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      data: {
        upload
      }
    });

  } catch (error) {
    console.error('Get upload details error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

// @route   GET /api/upload/stats/summary
// @desc    Get upload statistics
// @access  Private
router.get('/stats/summary', authMiddleware, async (req, res) => {
  try {
    let query = {};
    
    // If NGO user, only show their stats
    if (req.user.userType === 'ngo') {
      query.ngoId = req.user.userId;
    }

    const [totalUploads, pendingApprovals, approvedUploads, rejectedUploads] = await Promise.all([
      Upload.countDocuments(query),
      Upload.countDocuments({ ...query, approvalStatus: 'pending' }),
      Upload.countDocuments({ ...query, approvalStatus: 'approved' }),
      Upload.countDocuments({ ...query, approvalStatus: 'rejected' })
    ]);

    // Get carbon credits summary
    const carbonStats = await Upload.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalEstimatedCredits: { $sum: '$carbonEstimate.estimatedCredits' },
          totalApprovedCredits: { 
            $sum: { 
              $cond: [
                { $eq: ['$approvalStatus', 'approved'] },
                '$adminReview.approvedCredits',
                0
              ]
            }
          }
        }
      }
    ]);

    // Get plant type distribution
    const plantTypeStats = await Upload.aggregate([
      { $match: query },
      {
        $group: {
          _id: '$aiDetection.plantType',
          count: { $sum: 1 },
          totalArea: { $sum: '$plantationData.areaCovered' }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        summary: {
          totalUploads,
          pendingApprovals,
          approvedUploads,
          rejectedUploads
        },
        carbonCredits: carbonStats[0] || {
          totalEstimatedCredits: 0,
          totalApprovedCredits: 0
        },
        plantTypeDistribution: plantTypeStats
      }
    });

  } catch (error) {
    console.error('Get upload stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error'
    });
  }
});

module.exports = router;
