const jwt = require('jsonwebtoken');
const { clerkClient } = require('@clerk/clerk-sdk-node');
const User = require('../models/User');

const clerkAuth = async (req, res, next) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '');
    
    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: 'No session token provided'
      });
    }

    // Verify the session token with Clerk
    const session = await clerkClient.sessions.verifySession(sessionToken, {
      secretKey: process.env.CLERK_SECRET_KEY
    });
    
    if (!session) {
      return res.status(401).json({
        success: false,
        message: 'Invalid session token'
      });
    }

    // Get user information from Clerk
    const clerkUser = await clerkClient.users.getUser(session.userId);
    
    if (!clerkUser) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    // Find or create user in our database
    let user = await User.findOne({ clerkId: clerkUser.id });
    
    if (!user) {
      // Create new user if doesn't exist
      user = new User({
        clerkId: clerkUser.id,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName || '',
        lastName: clerkUser.lastName || '',
        profileImage: clerkUser.imageUrl || '',
        isActive: true,
        role: clerkUser.publicMetadata?.role || 'user'
      });
      await user.save();
    }

    // Attach user info to request
    req.user = user;
    req.userId = user._id;
    req.clerkUser = clerkUser;
    
    next();
  } catch (error) {
    console.error('Clerk authentication error:', error);
    return res.status(401).json({
      success: false,
      message: 'Authentication failed',
      error: error.message
    });
  }
};
const jwtAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: 'Authorization header missing'
      });
    }
    const token = authHeader.split(' ')[1]; // Bearer token
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Token missing from authorization header'
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found'
      });
    }
    req.user = user;
    req.userId = user._id;
    next();
  } catch (error) {
    console.error('JWT authentication error:', error);
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        success: false,
        message: 'Invalid token'
      });
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Token expired'
      });
    }
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
  }
};
const authMiddleware = async (req, res, next) => {
  // Check if Clerk is enabled by checking for Clerk secret key
  if (process.env.CLERK_SECRET_KEY && process.env.CLERK_SECRET_KEY !== 'sk_test_your_clerk_secret_key') {
    return clerkAuth(req, res, next);
  } else {
    // Fallback to JWT auth for backward compatibility
    return jwtAuth(req, res, next);
  }
};
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return next();
    }
    const token = authHeader.split(' ')[1];
    if (!token) {
      return next();
    }
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
      }
    } catch (tokenError) {
    }
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // Continue even if there's an error
  }
};
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }
  if (req.user.role !== 'admin' && !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }
  next();
};
const requireHotelStaff = (hotelId = null) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      if (req.user.role === 'admin' || req.user.isAdmin) {
        return next();
      }
      const targetHotelId = hotelId || req.params.hotelId || req.body.hotelId;
      if (!targetHotelId) {
        return res.status(400).json({
          success: false,
          message: 'Hotel ID required'
        });
      }
      const Hotel = require('../models/Hotel');
      const hotel = await Hotel.findById(targetHotelId);
      if (!hotel) {
        return res.status(404).json({
          success: false,
          message: 'Hotel not found'
        });
      }
      const isStaff = hotel.staff.some(staff => 
        staff.userId.toString() === req.user._id.toString()
      );
      if (!isStaff) {
        return res.status(403).json({
          success: false,
          message: 'Hotel staff access required'
        });
      }
      req.hotel = hotel;
      next();
    } catch (error) {
      console.error('Hotel staff authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization error'
      });
    }
  };
};
const requireOwnership = (resourceModel, resourceIdParam = 'id', ownerField = 'user') => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }
      const resourceId = req.params[resourceIdParam];
      const Model = require(`../models/${resourceModel}`);
      const resource = await Model.findById(resourceId);
      if (!resource) {
        return res.status(404).json({
          success: false,
          message: `${resourceModel} not found`
        });
      }
      if (req.user.role === 'admin' || req.user.isAdmin) {
        req.resource = resource;
        return next();
      }
      const ownerId = resource[ownerField];
      if (ownerId.toString() !== req.user._id.toString()) {
        return res.status(403).json({
          success: false,
          message: 'Access denied - not resource owner'
        });
      }
      req.resource = resource;
      next();
    } catch (error) {
      console.error('Ownership authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization error'
      });
    }
  };
};
const userRateLimit = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const userRequests = new Map();
  return (req, res, next) => {
    const userId = req.user ? req.user._id.toString() : req.ip;
    const now = Date.now();
    if (!userRequests.has(userId)) {
      userRequests.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    const userLimit = userRequests.get(userId);
    if (now > userLimit.resetTime) {
      userRequests.set(userId, { count: 1, resetTime: now + windowMs });
      return next();
    }
    if (userLimit.count >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Too many requests. Please try again later.',
        retryAfter: Math.ceil((userLimit.resetTime - now) / 1000)
      });
    }
    userLimit.count++;
    next();
  };
};
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, { abortEarly: false });
    if (error) {
      const errorMessages = error.details.map(detail => detail.message);
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: errorMessages
      });
    }
    next();
  };
};
module.exports = {
  authMiddleware,
  clerkAuth,
  jwtAuth,
  optionalAuth,
  requireAdmin,
  requireHotelStaff,
  requireOwnership,
  userRateLimit,
  validateRequest
};
