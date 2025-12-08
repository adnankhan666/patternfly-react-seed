const mongoose = require('mongoose');

let isConnected = false;

/**
 * Connect to MongoDB database
 */
const connectDB = async () => {
  if (isConnected) {
    console.log('📦 Using existing database connection');
    return;
  }

  const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/odh-workflows';

  try {
    const options = {
      useNewUrlParser: true,
      useUnifiedTopology: true,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      // Connection pooling configuration
      maxPoolSize: 10,           // Maximum number of connections in the pool
      minPoolSize: 5,            // Minimum number of connections to maintain
      maxIdleTimeMS: 30000,      // Close connections that have been idle for 30 seconds
    };

    await mongoose.connect(MONGODB_URI, options);

    isConnected = true;
    console.log('✅ MongoDB connected successfully');
    console.log(`📍 Database: ${mongoose.connection.db.databaseName}`);
  } catch (error) {
    console.error('❌ MongoDB connection error:', error.message);
    console.log('⚠️  Falling back to in-memory storage');
    // Don't throw - allow app to continue with in-memory storage
  }
};

/**
 * Disconnect from MongoDB
 */
const disconnectDB = async () => {
  if (!isConnected) {
    return;
  }

  try {
    await mongoose.disconnect();
    isConnected = false;
    console.log('🔌 MongoDB disconnected');
  } catch (error) {
    console.error('Error disconnecting from MongoDB:', error);
  }
};

/**
 * Check if database is connected
 */
const isDBConnected = () => {
  return isConnected && mongoose.connection.readyState === 1;
};

// Handle connection events
mongoose.connection.on('connected', () => {
  console.log('📡 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('❌ Mongoose connection error:', err);
  isConnected = false;
});

mongoose.connection.on('disconnected', () => {
  console.log('🔌 Mongoose disconnected from MongoDB');
  isConnected = false;
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await disconnectDB();
  process.exit(0);
});

module.exports = {
  connectDB,
  disconnectDB,
  isDBConnected,
};
