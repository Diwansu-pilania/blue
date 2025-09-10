const mongoose = require('mongoose');
require('dotenv').config();

console.log('🧪 Testing MongoDB Atlas connection...');
console.log('📡 Connection string:', process.env.MONGODB_URI ? 'Found' : 'Missing');

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      // Remove deprecated options
    });
    console.log('✅ MongoDB Atlas connected successfully!');
    console.log('🎉 Database connection is working!');
    
    // Test basic operations
    const testSchema = new mongoose.Schema({ test: String });
    const TestModel = mongoose.model('Test', testSchema);
    
    const testDoc = new TestModel({ test: 'Connection test successful' });
    await testDoc.save();
    console.log('✅ Test document created successfully!');
    
    await TestModel.deleteOne({ _id: testDoc._id });
    console.log('✅ Test document cleaned up successfully!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ MongoDB connection failed:');
    console.error(error.message);
    
    if (error.message.includes('IP')) {
      console.log('\n🔧 SOLUTION: Add your IP to MongoDB Atlas whitelist');
      console.log('   1. Go to: https://cloud.mongodb.com');
      console.log('   2. Network Access → Add IP Address');  
      console.log('   3. Use 0.0.0.0/0 for testing (allows all IPs)');
      console.log('   4. Wait 1-2 minutes for changes to take effect');
    }
    
    process.exit(1);
  }
};

connectDB();
