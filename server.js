require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const fs = require('fs');
const path = require('path');

const { database } = require('./config/database');

const authRoutes = require('./routes/authRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');

const errorHandler = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');
const { authMiddleware } = require('./middleware/auth');

const app = express();
const PORT = process.env.PORT || 5000;

const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, stack }) => {
      return `${timestamp} [${level}]: ${stack || message}`;
    })
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    }),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
    new winston.transports.File({ filename: 'logs/combined.log' })
  ]
});

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

const limiter = rateLimit({
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000,
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100,
  message: {
    error: 'Too many requests from this IP, please try again later.',
    statusCode: 429
  },
  standardHeaders: true,
  legacyHeaders: false
});

app.use(limiter);

const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl} - IP: ${req.ip}`);
  next();
});

app.get('/health', (req, res) => {
  const healthStatus = {
    status: 'OK',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    memory: process.memoryUsage(),
    database: database.getConnectionStatus(),
    environment: process.env.NODE_ENV
  };
  
  res.status(200).json(healthStatus);
});

app.get('/api', (req, res) => {
  res.json({
    message: 'Welcome to SmartLodge API',
    version: '1.0.0',
    documentation: '/api/docs',
    endpoints: {
      auth: '/api/auth',
      hotels: '/api/hotels',
      bookings: '/api/bookings',
      users: '/api/users',
      payments: '/api/payments'
    }
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/bookings', authMiddleware, bookingRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(notFound);
app.use(errorHandler);

const gracefulShutdown = async (signal) => {
  logger.info(`🛑 Received ${signal}. Starting graceful shutdown...`);
  
  server.close(async (err) => {
    if (err) {
      logger.error('❌ Error during server shutdown:', err);
      return process.exit(1);
    }
    
    logger.info('✅ HTTP server closed');
    
    try {
      await database.disconnect();
      logger.info('✅ Database connection closed');
      
      logger.info('✅ Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('❌ Error during database shutdown:', error);
      process.exit(1);
    }
  });
  
  setTimeout(() => {
    logger.error('⚠️ Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

const startServer = async () => {
  try {
    const dbConnected = await database.connect();
    
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
      logger.info(`📊 Database: ${dbConnected ? 'Connected' : 'Disconnected (server still functional)'}`);
      logger.info(`🔗 API URL: http://localhost:${PORT}/api`);
      logger.info(`💚 Health check: http://localhost:${PORT}/health`);
    });

    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    
    return server;
    
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

const server = startServer();
module.exports = app;