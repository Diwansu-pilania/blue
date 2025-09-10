const fs = require('fs');
const path = require('path');

// Script to update MongoDB Atlas connection string in .env file
console.log('🔧 MongoDB Atlas Connection String Updater');
console.log('==========================================');

const envPath = path.join(__dirname, '.env');

if (!fs.existsSync(envPath)) {
    console.error('❌ .env file not found!');
    console.log('Please make sure you are in the backend directory.');
    process.exit(1);
}

console.log('📋 Instructions:');
console.log('1. Copy your MongoDB Atlas connection string');
console.log('2. It should look like: mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority');
console.log('3. Replace <password> with your actual password');
console.log('4. Add the database name "blue-carbon-registry" at the end');
console.log('');
console.log('Example final string:');
console.log('mongodb+srv://bluecarbon:yourpassword@cluster0.xxxxx.mongodb.net/blue-carbon-registry?retryWrites=true&w=majority');
console.log('');
console.log('📝 Manual Update:');
console.log('1. Open backend/.env file in a text editor');
console.log('2. Find the line: MONGODB_URI=mongodb://localhost:27017/blue-carbon-registry');
console.log('3. Replace it with: MONGODB_URI=your-atlas-connection-string');
console.log('4. Save the file');
console.log('');
console.log('✅ After updating, run: npm run dev (from backend directory)');
