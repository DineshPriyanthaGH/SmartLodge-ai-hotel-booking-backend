const jwt = require('jsonwebtoken');
const { clerkClient } = require('@clerk/clerk-sdk-node');
const { ClerkExpressRequireAuth, ClerkExpressWithAuth } = require('@clerk/express');
const User = require('../models/User');

// Modern Clerk authentication middleware using JWT verification
const clerkAuth = async (req, res, next) => {
  try {
    // Get the session token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'No session token provided in Authorization header'
      });
    }

    const sessionToken = authHeader.replace('Bearer ', '');
    
    // Verify the JWT token directly (networkless verification)
    try {
      // Use Clerk's JWT verification instead of deprecated session API
      const decoded = jwt.verify(sessionToken, process.env.CLERK_JWT_KEY || process.env.CLERK_SECRET_KEY, {
        algorithms: ['RS256']
      });
      
      if (!decoded || !decoded.sub) {
        return res.status(401).json({
          success: false,
          message: 'Invalid token payload'
        });
      }

      // Get user information from Clerk using the user ID from token
      const clerkUser = await clerkClient.users.getUser(decoded.sub);
      
      if (!clerkUser) {
        return res.status(401).json({
          success: false,
          message: 'User not found in Clerk'
        });
      }

      // Find or create user in our database
      let user = await User.findOne({ clerkId: clerkUser.id });
      
      if (!user) {
        // Create new user if doesn't exist
        console.log('Creating new user in database for Clerk user:', clerkUser.id);
        user = new User({
          clerkId: clerkUser.id,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          firstName: clerkUser.firstName || '',
          lastName: clerkUser.lastName || '',
          profileImage: clerkUser.imageUrl || '',
          isActive: true,
          verificationStatus: {
            email: true, // Email verified through Clerk
            phone: false,
            identity: false
          },
          role: clerkUser.publicMetadata?.role || 'user',
          lastLogin: new Date()
        });
        await user.save();
        console.log('User created in database:', user.email);
      } else {
        // Update existing user's last login and sync data
        user.email = clerkUser.emailAddresses[0]?.emailAddress || user.email;
        user.firstName = clerkUser.firstName || user.firstName;
        user.lastName = clerkUser.lastName || user.lastName;
        user.profileImage = clerkUser.imageUrl || user.profileImage;
        user.lastLogin = new Date();
        await user.save();
      }

      // Attach user info to request
      req.user = user;
      req.userId = user._id;
      req.clerkUser = clerkUser;
      req.auth = { 
        userId: clerkUser.id, 
        user: clerkUser,
        sessionClaims: decoded
      };
      
      next();
    } catch (clerkError) {
      console.error('Clerk JWT verification error:', clerkError);
      // Try alternative verification approach if JWT fails
      if (clerkError.name === 'JsonWebTokenError' || clerkError.name === 'TokenExpiredError') {
        try {
          // Fallback: Use Clerk's verifyToken method for session tokens
          const payload = await clerkClient.verifyToken(sessionToken);
          
          if (!payload || !payload.sub) {
            return res.status(401).json({
              success: false,
              message: 'Invalid session token'
            });
          }

          // Get user information from Clerk
          const clerkUser = await clerkClient.users.getUser(payload.sub);
          
          if (!clerkUser) {
            return res.status(401).json({
              success: false,
              message: 'User not found in Clerk'
            });
          }

          // Find or create user in our database
          let user = await User.findOne({ clerkId: clerkUser.id });
          
          if (!user) {
            user = new User({
              clerkId: clerkUser.id,
              email: clerkUser.emailAddresses[0]?.emailAddress || '',
              firstName: clerkUser.firstName || '',
              lastName: clerkUser.lastName || '',
              profileImage: clerkUser.imageUrl || '',
              isActive: true,
              verificationStatus: { email: true, phone: false, identity: false },
              role: clerkUser.publicMetadata?.role || 'user',
              lastLogin: new Date()
            });
            await user.save();
          } else {
            user.lastLogin = new Date();
            await user.save();
          }

          req.user = user;
          req.userId = user._id;
          req.clerkUser = clerkUser;
          req.auth = { userId: clerkUser.id, user: clerkUser, sessionClaims: payload };
          
          return next();
        } catch (fallbackError) {
          console.error('Clerk fallback verification failed:', fallbackError);
          return res.status(401).json({
            success: false,
            message: 'Invalid session token',
            error: fallbackError.message
          });
        }
      }
      
      return res.status(401).json({
        success: false,
        message: 'Invalid session token',
        error: clerkError.message
      });
    }
    
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
// Clerk Express middleware wrapper
const clerkExpressAuth = ClerkExpressWithAuth({
  // Optional: Custom error handler
  onError: (error) => {
    console.error('Clerk Express Auth Error:', error);
  }
});

// Combined authentication middleware
const authMiddleware = async (req, res, next) => {
  // Check if Clerk is properly configured
  if (process.env.CLERK_SECRET_KEY && process.env.CLERK_SECRET_KEY !== 'sk_test_your_clerk_secret_key') {
    // Use Clerk JWT authentication
    return clerkAuth(req, res, next);
  } else {
    // Fallback to custom JWT auth for backward compatibility
    console.warn('Clerk not properly configured, falling back to JWT auth');
    return jwtAuth(req, res, next);
  }
};

// Clerk middleware for routes that require authentication
const requireAuth = async (req, res, next) => {
  try {
    // First apply Clerk Express middleware
    clerkExpressAuth(req, res, (err) => {
      if (err) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
          error: err.message
        });
      }
      
      // Then apply our custom auth logic
      authMiddleware(req, res, next);
    });
  } catch (error) {
    console.error('RequireAuth middleware error:', error);
    return res.status(500).json({
      success: false,
      message: 'Authentication error'
    });
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
  requireAuth,
  clerkAuth,
  clerkExpressAuth,
  jwtAuth,
  optionalAuth,
  requireAdmin,
  requireHotelStaff,
  requireOwnership,
  userRateLimit,
  validateRequest
};
