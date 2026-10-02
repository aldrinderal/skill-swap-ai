import mongoose from 'mongoose';
import dns from 'node:dns';

// Configure reliable DNS servers for MongoDB Atlas SRV record resolution on Windows
try {
  dns.setServers(['8.8.8.8', '1.1.1.1']);
} catch (err) {
  // Fallback to default resolver if custom servers cannot be set
}

/**
 * Connect to MongoDB database
 * Reads connection URI securely from environment variable MONGO_URI
 */
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGO_URI;

    if (!mongoURI) {
      console.error('❌ MongoDB Connection Error: MONGO_URI is not defined in environment variables.');
      process.exit(1);
    }

    const conn = await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('MongoDB connected successfully');
    return conn;
  } catch (error) {
    console.error(`❌ MongoDB connection error: ${error.message}`);
    if (
      error.message.includes('SSL') ||
      error.message.includes('whitelist') ||
      error.message.includes('alert number 80') ||
      error.message.includes('Could not connect')
    ) {
      console.error('\n👉 ATLAS IP ACCESS TIP:');
      console.error('1. Open https://cloud.mongodb.com/ and go to "Network Access"');
      console.error('2. Click "Add IP Address" and select "Allow Access from Anywhere" (0.0.0.0/0)');
      console.error('3. Click "Confirm" and restart your server.\n');
    }
    process.exit(1);
  }
};

export default connectDB;
