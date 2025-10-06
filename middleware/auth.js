const { ClerkExpressRequireAuth } = require('@clerk/clerk-sdk-node');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

// Clerk authentication middleware
const clerkAuth = ClerkExpressRequireAuth({
  onError: (error) => {
    console.error('Clerk authentication error:', error);
    return {
      status: 401,
      message: 'Authentication failed'
    };
  }
});

// Custom JWT authentication middleware (for guest users or custom tokens)
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

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Find user
    const user = await User.findById(decoded.userId);
    
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Invalid token or user not found'
      });
    }

    // Attach user to request
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

// Combined authentication middleware (tries Clerk first, then JWT)
const authMiddleware = async (req, res, next) => {
  // Check if it's a Clerk authenticated request
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer sk_')) {
    return clerkAuth(req, res, async (error) => {
      if (error) {
        return jwtAuth(req, res, next);
      }
      
      try {
        // Get user from Clerk ID
        const clerkUserId = req.auth.userId;
        const user = await User.findOne({ clerkId: clerkUserId, isActive: true });
        
        if (!user) {
          return res.status(401).json({
            success: false,
            message: 'User not found or inactive'
          });
        }
        
        req.user = user;
        req.userId = user._id;
        req.clerkUserId = clerkUserId;
        
        next();
      } catch (dbError) {
        console.error('Database error during Clerk auth:', dbError);
        return res.status(500).json({
          success: false,
          message: 'Authentication error'
        });
      }
    });
  }
  
  // Otherwise, use JWT authentication
  return jwtAuth(req, res, next);
};

// Optional authentication (doesn't require auth but sets user if available)
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

    // Try to verify token
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (user && user.isActive) {
        req.user = user;
        req.userId = user._id;
      }
    } catch (tokenError) {
      // Silently ignore token errors in optional auth
    }
    
    next();
  } catch (error) {
    console.error('Optional auth error:', error);
    next(); // Continue even if there's an error
  }
};

// Admin authorization middleware
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentication required'
    });
  }

  // Check if user has admin role (assuming admin role exists in user model)
  if (req.user.role !== 'admin' && !req.user.isAdmin) {
    return res.status(403).json({
      success: false,
      message: 'Admin access required'
    });
  }

  next();
};

// Hotel staff authorization middleware
const requireHotelStaff = (hotelId = null) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required'
        });
      }

      // Admin users can access any hotel
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

      // Check if user is staff member of this hotel
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

// Resource ownership middleware (for bookings, reviews, etc.)
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

      // Admin can access any resource
      if (req.user.role === 'admin' || req.user.isAdmin) {
        req.resource = resource;
        return next();
      }

      // Check ownership
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

// Rate limiting by user
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

// Validation middleware
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