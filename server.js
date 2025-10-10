require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const winston = require('winston');
const fs = require('fs');
const path = require('path');
const { ClerkExpressWithAuth, ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');

const { database } = require('./config/database');

const authRoutes = require('./routes/authRoutes');
const hotelRoutes = require('./routes/hotelRoutes');
const bookingRoutes = require('./routes/bookingRoutes');
const userRoutes = require('./routes/userRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const webhookRoutes = require('./routes/webhooks');

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
  origin: function (origin, callback) {
    console.log('🌐 CORS check for origin:', origin);
    
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      console.log('✅ No origin - allowing');
      return callback(null, true);
    }
    
    // In production, be more permissive for Vercel domains
    if (process.env.NODE_ENV === 'production') {
      if (origin.includes('.vercel.app') || origin.includes('.vercel.com')) {
        console.log('✅ Vercel domain allowed:', origin);
        return callback(null, true);
      }
    }
    
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'https://smart-lodge-ai-hotel-booking-fronte.vercel.app',
      process.env.FRONTEND_URL
    ].filter(Boolean);
    
    console.log('🎯 Allowed origins:', allowedOrigins);
    
    if (allowedOrigins.includes(origin)) {
      console.log('✅ Origin explicitly allowed:', origin);
      return callback(null, true);
    }
    
    // For development, allow all localhost origins
    if (process.env.NODE_ENV === 'development' && origin && origin.includes('localhost')) {
      console.log('✅ Development localhost allowed:', origin);
      return callback(null, true);
    }
    
    console.log('❌ CORS: Origin blocked:', origin);
    // For debugging - temporarily allow all origins in production
    if (process.env.NODE_ENV === 'production') {
      console.log('🔓 Production: Temporarily allowing all origins for debugging');
      return callback(null, true);
    }
    
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};

app.use(cors(corsOptions));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging middleware
app.use((req, res, next) => {
  logger.info(`${req.method} ${req.originalUrl} - IP: ${req.ip}`, {
    headers: req.headers.authorization ? 'Has Auth' : 'No Auth'
  });
  next();
});

// Debug middleware for CORS
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.originalUrl} - Origin: ${req.headers.origin}`);
  console.log('Headers:', {
    origin: req.headers.origin,
    authorization: req.headers.authorization ? 'Present' : 'Missing',
    'content-type': req.headers['content-type']
  });
  next();
});

// Handle preflight requests
app.options('*', cors(corsOptions));

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

// Test endpoint for CORS verification
app.get('/api/test-cors', (req, res) => {
  res.json({
    success: true,
    message: 'CORS is working!',
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
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
      payments: '/api/payments',
      reviews: '/api/reviews'
    }
  });
});

// Direct test route (bypass all middleware)
app.post('/api/test-sync', async (req, res) => {
  try {
    console.log('Direct sync test received:', req.body);
    const { clerkId, email, firstName, lastName } = req.body;
    
    if (!clerkId || !email) {
      return res.status(400).json({
        success: false,
        message: 'Missing required data'
      });
    }

    const User = require('./models/User');
    let user = await User.findOne({ clerkId });
    
    if (!user) {
      user = new User({
        clerkId,
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        isActive: true,
        verificationStatus: {
          email: true,
          phone: false,
          identity: false
        },
        role: 'user'
      });
      await user.save();
      console.log('User created:', user._id);
    }

    res.json({
      success: true,
      message: 'User synced successfully',
      user: { id: user._id, email: user.email }
    });
  } catch (error) {
    console.error('Sync error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Test Clerk JWT authentication
app.get('/api/test-auth', authMiddleware, (req, res) => {
  res.json({
    success: true,
    message: 'Authentication successful',
    user: {
      id: req.user._id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      clerkId: req.user.clerkId
    },
    clerkUser: {
      id: req.clerkUser?.id,
      email: req.clerkUser?.emailAddresses?.[0]?.emailAddress
    }
  });
});

app.use('/api/webhooks', webhookRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/hotels', hotelRoutes);
app.use('/api/bookings', authMiddleware, bookingRoutes);
app.use('/api/users', authMiddleware, userRoutes);
app.use('/api/payments', authMiddleware, paymentRoutes);
app.use('/api/reviews', reviewRoutes);

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use(notFound);
app.use(errorHandler);

const gracefulShutdown = async (signal) => {
  logger.info(` Received ${signal}. Starting graceful shutdown...`);
  
  server.close(async (err) => {
    if (err) {
      logger.error(' Error during server shutdown:', err);
      return process.exit(1);
    }
    
    logger.info(' HTTP server closed');
    
    try {
      await database.disconnect();
      logger.info(' Database connection closed');
      
      logger.info(' Graceful shutdown completed');
      process.exit(0);
    } catch (error) {
      logger.error('Error during database shutdown:', error);
      process.exit(1);
    }
  });
  
  setTimeout(() => {
    logger.error(' Could not close connections in time, forcefully shutting down');
    process.exit(1);
  }, 10000);
};

const startServer = async () => {
  try {
    // Try to connect to database, but don't fail if it's not available
    let dbConnected = false;
    try {
      dbConnected = await database.connect();
    } catch (dbError) {
      logger.warn('Database connection failed, but server will continue running');
      logger.warn('Database error:', dbError.message);
    }
    
    const server = app.listen(PORT, () => {
      logger.info(`🚀 Server running on port ${PORT}`);
      logger.info(`🌍 Environment: ${process.env.NODE_ENV}`);
      logger.info(`💾 Database: ${dbConnected ? '✅ Connected' : '❌ Disconnected (server still functional)'}`);
      logger.info(`🔗 API URL: http://localhost:${PORT}/api`);
      logger.info(`❤️ Health check: http://localhost:${PORT}/health`);
      
      // Log environment variables for debugging
      logger.info(`🎯 Frontend URL: ${process.env.FRONTEND_URL}`);
      logger.info(`🔑 MongoDB URI: ${process.env.MONGODB_URI ? 'Set' : 'Missing'}`);
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