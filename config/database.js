const mongoose = require('mongoose');
const winston = require('winston');

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.printf(({ timestamp, level, message }) => {
      return `${timestamp} [${level}]: ${message}`;
    })
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/database.log' })
  ]
});

class DatabaseConnection {
  constructor() {
    this.isConnected = false;
  }

  async connect() {
    try {
      // MongoDB connection options
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
        bufferCommands: false,
        bufferMaxEntries: 0
      };

      // Connect to MongoDB
      await mongoose.connect(process.env.MONGODB_URI, options);
      
      this.isConnected = true;
      logger.info('✅ MongoDB connected successfully');
      
      // Log database name
      const dbName = mongoose.connection.db.databaseName;
      logger.info(`📊 Connected to database: ${dbName}`);
      
      return true;
    } catch (error) {
      logger.error('❌ MongoDB connection failed:', error.message);
      this.isConnected = false;
      throw error;
    }
  }

  async disconnect() {
    try {
      await mongoose.disconnect();
      this.isConnected = false;
      logger.info('📴 MongoDB disconnected successfully');
    } catch (error) {
      logger.error('❌ Error disconnecting from MongoDB:', error.message);
      throw error;
    }
  }

  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      readyState: mongoose.connection.readyState,
      host: mongoose.connection.host,
      port: mongoose.connection.port,
      name: mongoose.connection.name
    };
  }
}

// MongoDB event listeners
mongoose.connection.on('connected', () => {
  logger.info('🔗 Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (error) => {
  logger.error('❌ Mongoose connection error:', error.message);
});

mongoose.connection.on('disconnected', () => {
  logger.info('📴 Mongoose disconnected from MongoDB');
});

// Graceful shutdown
process.on('SIGINT', async () => {
  try {
    await mongoose.connection.close();
    logger.info('🛑 MongoDB connection closed through app termination');
    process.exit(0);
  } catch (error) {
    logger.error('❌ Error during graceful shutdown:', error.message);
    process.exit(1);
  }
});

// Create and export database instance
const database = new DatabaseConnection();

module.exports = {
  database,
  mongoose
};