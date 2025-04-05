import mongoose from 'mongoose';

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://trendflixadmin:trendflixadmin@trendflix.xuc8ovv.mongodb.net/trendflix';
// Connection state tracking
let isConnected = false;
let connectionPromise = null;

// Configure mongoose options
const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10, // Limit the number of socket connections
  serverSelectionTimeoutMS: 5000, // Timeout for server selection
  socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
  family: 4 // Use IPv4, skip trying IPv6
};

/**
 * Connect to MongoDB using a singleton pattern
 * This ensures only one connection is active at a time
 */
export async function connectToDatabase() {
  // If we already have an active connection, return it
  if (isConnected) {
    return mongoose.connection;
  }

  // If we're in the process of connecting, wait for that promise
  if (connectionPromise) {
    return connectionPromise;
  }

  try {
    // Create a new connection promise
    connectionPromise = mongoose.connect(MONGODB_URI, options);
    
    // Wait for connection
    await connectionPromise;
    
    // Connection established
    isConnected = true;
    
    console.log('Connected to MongoDB');
    
    // Set up connection event listeners
    mongoose.connection.on('disconnected', () => {
      console.log('MongoDB disconnected');
      isConnected = false;
      connectionPromise = null;
    });
    
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
      isConnected = false;
      connectionPromise = null;
    });
    
    // Handle application termination to properly close connections
    process.on('SIGINT', async () => {
      await closeDatabase();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      await closeDatabase();
      process.exit(0);
    });
    
    return mongoose.connection;
  } catch (error) {
    console.error('MongoDB connection error:', error);
    connectionPromise = null;
    isConnected = false;
    throw error;
  }
}

/**
 * Close the database connection properly
 */
export async function closeDatabase() {
  if (isConnected) {
    try {
      await mongoose.connection.close();
      console.log('MongoDB connection closed');
      isConnected = false;
      connectionPromise = null;
    } catch (error) {
      console.error('Error closing MongoDB connection:', error);
      throw error;
    }
  }
}

/**
 * Get the current database connection
 */
export function getConnection() {
  return mongoose.connection;
}

/**
 * Check if connected to the database
 */
export function isConnectedToDatabase() {
  return isConnected;
} 