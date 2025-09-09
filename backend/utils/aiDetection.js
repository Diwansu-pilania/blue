const tf = require('@tensorflow/tfjs-node');
const sharp = require('sharp');

class AIDetectionService {
  constructor() {
    this.model = null;
    this.modelLoaded = false;
    this.modelPath = process.env.AI_MODEL_PATH || null;
    this.modelVersion = '1.0.0';
    
    // Plant type classifications with confidence thresholds
    this.plantTypes = {
      0: { name: 'Mangrove', type: 'Mangrove', threshold: 0.7 },
      1: { name: 'Seagrass', type: 'Seagrass', threshold: 0.6 },
      2: { name: 'Salt Marsh Plant', type: 'Salt Marsh', threshold: 0.65 },
      3: { name: 'Coastal Tree', type: 'Coastal Tree', threshold: 0.6 },
      4: { name: 'Marine Plant', type: 'Marine Plant', threshold: 0.55 },
      5: { name: 'Other Vegetation', type: 'Other', threshold: 0.5 }
    };
    
    // Initialize model loading
    this.initializeModel();
  }

  async initializeModel() {
    try {
      if (this.modelPath && this.modelPath !== 'null') {
        console.log('🤖 Loading AI plant detection model...');
        this.model = await tf.loadLayersModel(`file://${this.modelPath}`);
        this.modelLoaded = true;
        console.log('✅ AI model loaded successfully');
      } else {
        console.log('⚠️ No AI model path provided. Using mock detection.');
        this.modelLoaded = false;
      }
    } catch (error) {
      console.error('❌ Error loading AI model:', error);
      this.modelLoaded = false;
    }
  }

  async preprocessImage(imageBuffer) {
    try {
      // Resize image to model input size (typically 224x224 for most CNN models)
      const resizedImage = await sharp(imageBuffer)
        .resize(224, 224)
        .removeAlpha()
        .raw()
        .toBuffer();

      // Convert to tensor and normalize
      const tensor = tf.tensor3d(new Uint8Array(resizedImage), [224, 224, 3])
        .div(255.0) // Normalize to 0-1
        .expandDims(0); // Add batch dimension

      return tensor;
    } catch (error) {
      throw new Error(`Image preprocessing failed: ${error.message}`);
    }
  }

  async detectPlantType(imageBuffer) {
    try {
      if (!this.modelLoaded || !this.model) {
        // Use mock detection if model is not available
        return this.mockDetection(imageBuffer);
      }

      // Preprocess image
      const inputTensor = await this.preprocessImage(imageBuffer);

      // Run inference
      const predictions = await this.model.predict(inputTensor);
      const probabilities = await predictions.data();
      
      // Find the class with highest probability
      let maxProb = 0;
      let predictedClass = 0;
      
      for (let i = 0; i < probabilities.length; i++) {
        if (probabilities[i] > maxProb) {
          maxProb = probabilities[i];
          predictedClass = i;
        }
      }

      // Get plant type info
      const plantInfo = this.plantTypes[predictedClass] || this.plantTypes[5];
      
      // Check if confidence meets threshold
      const confidence = maxProb;
      const meetsThreshold = confidence >= plantInfo.threshold;

      // Clean up tensors
      inputTensor.dispose();
      predictions.dispose();

      return {
        plantSpecies: plantInfo.name,
        plantType: meetsThreshold ? plantInfo.type : 'Other',
        confidence: confidence,
        modelVersion: this.modelVersion,
        thresholdMet: meetsThreshold,
        allProbabilities: Array.from(probabilities)
      };

    } catch (error) {
      console.error('AI detection error:', error);
      // Fallback to mock detection
      return this.mockDetection(imageBuffer);
    }
  }

  // Mock detection for when model is not available
  mockDetection(imageBuffer) {
    // Simple mock based on image properties
    const imageSize = imageBuffer.length;
    
    // Mock logic: assign plant type based on some image characteristics
    const mockResults = [
      { plantSpecies: 'Rhizophora mucronata', plantType: 'Mangrove', confidence: 0.85 },
      { plantSpecies: 'Zostera marina', plantType: 'Seagrass', confidence: 0.78 },
      { plantSpecies: 'Salicornia europaea', plantType: 'Salt Marsh', confidence: 0.72 },
      { plantSpecies: 'Casuarina equisetifolia', plantType: 'Coastal Tree', confidence: 0.68 },
      { plantSpecies: 'Halophila ovalis', plantType: 'Marine Plant', confidence: 0.65 },
      { plantSpecies: 'Unknown species', plantType: 'Other', confidence: 0.45 }
    ];

    // Select result based on image size (mock logic)
    const index = Math.abs(imageSize) % mockResults.length;
    const result = mockResults[index];

    return {
      ...result,
      modelVersion: 'mock-1.0.0',
      thresholdMet: result.confidence > 0.6,
      allProbabilities: [result.confidence, 0.1, 0.1, 0.1, 0.1, 0.1]
    };
  }

  // Additional utility method to validate detection results
  validateDetection(detection) {
    const requiredFields = ['plantSpecies', 'plantType', 'confidence', 'modelVersion'];
    
    for (const field of requiredFields) {
      if (!detection.hasOwnProperty(field)) {
        throw new Error(`Missing required field: ${field}`);
      }
    }

    if (detection.confidence < 0 || detection.confidence > 1) {
      throw new Error('Confidence must be between 0 and 1');
    }

    const validPlantTypes = ['Mangrove', 'Seagrass', 'Salt Marsh', 'Coastal Tree', 'Marine Plant', 'Other'];
    if (!validPlantTypes.includes(detection.plantType)) {
      throw new Error(`Invalid plant type: ${detection.plantType}`);
    }

    return true;
  }

  // Method to get model information
  getModelInfo() {
    return {
      loaded: this.modelLoaded,
      version: this.modelVersion,
      path: this.modelPath,
      supportedTypes: Object.values(this.plantTypes).map(p => p.type)
    };
  }

  // Method to update confidence thresholds
  updateThresholds(newThresholds) {
    for (const [classIndex, threshold] of Object.entries(newThresholds)) {
      if (this.plantTypes[classIndex]) {
        this.plantTypes[classIndex].threshold = threshold;
      }
    }
  }

  // Batch processing for multiple images
  async batchDetect(imageBuffers) {
    const results = [];
    
    for (const buffer of imageBuffers) {
      try {
        const detection = await this.detectPlantType(buffer);
        results.push({ success: true, data: detection });
      } catch (error) {
        results.push({ success: false, error: error.message });
      }
    }
    
    return results;
  }
}

// Create singleton instance
const aiDetectionService = new AIDetectionService();

module.exports = aiDetectionService;
