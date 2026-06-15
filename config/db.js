const mongoose = require('mongoose');

let isConnected = false;

const connectDB = async () => {
  // If already connected, return
  if (isConnected && mongoose.connection.readyState === 1) {
    console.log('Using existing MongoDB connection');
    return;
  }

  try {
    // Optimize for serverless environment with more aggressive timeouts
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI || 'mongodb://localhost:27017/property-db';

    // If an Atlas URI is provided but still contains a placeholder (e.g. <db_password>), fail fast with a clear message
    if (process.env.MONGODB_URI && (process.env.MONGODB_URI.includes('<') || /<db_password>|<.*password.*>/i.test(process.env.MONGODB_URI))) {
      console.error('MONGODB_URI appears to contain a placeholder. Set the real Atlas URI (including password) in sanju-backend/.env and restart the server. Do NOT commit secrets.');
      throw new Error('MONGODB_URI contains a placeholder value. Configure a valid MongoDB Atlas URI in sanju-backend/.env');
    }

    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      maxPoolSize: 10,
      minPoolSize: 2,
    });

    isConnected = true;
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    console.error(`MongoDB Connection Error: ${error.message}`);
    console.error(`Error details:`, error);
    isConnected = false;
    
    // Always throw the error so it can be handled properly
    throw new Error(`Database connection failed: ${error.message}`);
  }
};

module.exports = connectDB;
