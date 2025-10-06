const mongoose = require('mongoose');
const winston = require('winston');
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
      if (!process.env.MONGODB_URI) {
        throw new Error('MONGODB_URI environment variable is not set');
      }
      const options = {
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 5000,
        socketTimeoutMS: 45000,
        family: 4,
        bufferCommands: false
      };
      await mongoose.connect(process.env.MONGODB_URI, options);
      this.isConnected = true;
      logger.info('✅ MongoDB connected successfully');
      const dbName = mongoose.connection.db.databaseName;
      logger.info(`📊 Connected to database: ${dbName}`);
      return true;
    } catch (error) {
      logger.error('❌ MongoDB connection failed:', error.message);
      logger.info('💡 To fix this:');
      logger.info('   1. Install MongoDB locally: https://www.mongodb.com/try/download/community');
      logger.info('   2. Or use MongoDB Atlas (cloud): https://www.mongodb.com/atlas');
      logger.info('   3. Update MONGODB_URI in .env file');
      logger.info('   4. For now, server will run without database connection');
      this.isConnected = false;
      return false;
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
mongoose.connection.on('connected', () => {
  logger.info('🔗 Mongoose connected to MongoDB');
});
mongoose.connection.on('error', (error) => {
  logger.error('❌ Mongoose connection error:', error.message);
});
mongoose.connection.on('disconnected', () => {
  logger.info('📴 Mongoose disconnected from MongoDB');
});
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
const database = new DatabaseConnection();
module.exports = {
  database,
  mongoose
};
