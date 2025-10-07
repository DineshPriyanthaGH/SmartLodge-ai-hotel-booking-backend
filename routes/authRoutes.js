const express = require('express');
const { authMiddleware, requireAdmin } = require('../middleware/auth');
const {
  register,
  login,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
  clerkWebhook,
  getProfile,
  updateProfile,
  changePassword,
  deleteAccount
} = require('../controllers/authController');

const router = express.Router();

// Public routes
router.post('/register', register);
router.post('/login', login);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);
router.get('/verify-email/:token', verifyEmail);
router.post('/resend-verification', resendVerification);

// Test database connection and user creation
router.get('/test-db', async (req, res) => {
  try {
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    
    res.status(200).json({
      success: true,
      message: 'Database connection successful',
      userCount: userCount,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Database test error:', error);
    res.status(500).json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    });
  }
});

// Clerk user sync (public route) - MOVED TO PUBLIC SECTION
router.post('/sync-clerk-user', async (req, res) => {
  try {
    console.log('Received user sync request:', req.body);
    
    const { clerkId, email, firstName, lastName, imageUrl } = req.body;

    if (!clerkId || !email) {
      console.error('Missing required user data:', { clerkId, email });
      return res.status(400).json({
        success: false,
        message: 'Missing required user data (clerkId and email are required)'
      });
    }

    const User = require('../models/User');
    
    // Check if user already exists
    let user = await User.findOne({ clerkId });
    console.log('Existing user found:', !!user);

    if (user) {
      // Update existing user
      console.log('Updating existing user:', user.email);
      user.email = email;
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.profileImage = imageUrl || user.profileImage;
      user.lastLogin = new Date();
      user.verificationStatus.email = true;
      await user.save();
      console.log('User updated successfully');
    } else {
      // Create new user
      console.log('Creating new user for:', email);
      user = new User({
        clerkId,
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        profileImage: imageUrl || '',
        isActive: true,
        lastLogin: new Date(),
        verificationStatus: {
          email: true,
          phone: false,
          identity: false
        },
        role: 'user'
      });
      await user.save();
      console.log('New user created successfully:', user._id);
    }

    res.status(200).json({
      success: true,
      message: 'User synchronized successfully',
      user: {
        id: user._id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileImage: user.profileImage,
        verificationStatus: user.verificationStatus
      }
    });

  } catch (error) {
    console.error('User sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync user',
      error: error.message
    });
  }
});

// Clerk user sync (public route)
router.post('/sync-clerk-user', async (req, res) => {
  try {
    console.log('Received user sync request:', req.body);
    
    const { clerkId, email, firstName, lastName, imageUrl } = req.body;

    if (!clerkId || !email) {
      console.error('Missing required user data:', { clerkId, email });
      return res.status(400).json({
        success: false,
        message: 'Missing required user data (clerkId and email are required)'
      });
    }

    const User = require('../models/User');
    
    // Check if user already exists
    let user = await User.findOne({ clerkId });
    console.log('Existing user found:', !!user);

    if (user) {
      // Update existing user
      console.log('Updating existing user:', user.email);
      user.email = email;
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.profileImage = imageUrl || user.profileImage;
      user.lastLogin = new Date();
      user.verificationStatus.email = true;
      await user.save();
      console.log('User updated successfully');
    } else {
      // Create new user
      console.log('Creating new user for:', email);
      user = new User({
        clerkId,
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        profileImage: imageUrl || '',
        isActive: true,
        lastLogin: new Date(),
        verificationStatus: {
          email: true,
          phone: false,
          identity: false
        },
        role: 'user'
      });
      await user.save();
      console.log('New user created successfully:', user._id);
    }

    res.status(200).json({
      success: true,
      message: 'User synchronized successfully',
      user: {
        id: user._id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileImage: user.profileImage,
        verificationStatus: user.verificationStatus
      }
    });

  } catch (error) {
    console.error('User sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync user',
      error: error.message
    });
  }
});

// Clerk webhook (for user sync)
router.post('/clerk-webhook', clerkWebhook);

// Simple test route
router.get('/test', (req, res) => {
  res.json({ 
    success: true, 
    message: 'Auth routes working!', 
    timestamp: new Date().toISOString() 
  });
});

// Clerk user sync (public route)
router.post('/sync-clerk-user', async (req, res) => {
  try {
    console.log('Received user sync request:', req.body);
    
    const { clerkId, email, firstName, lastName, imageUrl } = req.body;

    if (!clerkId || !email) {
      console.error('Missing required user data:', { clerkId, email });
      return res.status(400).json({
        success: false,
        message: 'Missing required user data (clerkId and email are required)'
      });
    }

    const User = require('../models/User');
    
    // Check if user already exists
    let user = await User.findOne({ clerkId });
    console.log('Existing user found:', !!user);

    if (user) {
      // Update existing user
      console.log('Updating existing user:', user.email);
      user.email = email;
      user.firstName = firstName || user.firstName;
      user.lastName = lastName || user.lastName;
      user.profileImage = imageUrl || user.profileImage;
      user.lastLogin = new Date();
      user.verificationStatus.email = true;
      await user.save();
      console.log('User updated successfully');
    } else {
      // Create new user
      console.log('Creating new user for:', email);
      user = new User({
        clerkId,
        email,
        firstName: firstName || '',
        lastName: lastName || '',
        profileImage: imageUrl || '',
        isActive: true,
        lastLogin: new Date(),
        verificationStatus: {
          email: true,
          phone: false,
          identity: false
        },
        role: 'user'
      });
      await user.save();
      console.log('New user created successfully:', user._id);
    }

    res.status(200).json({
      success: true,
      message: 'User synchronized successfully',
      user: {
        id: user._id,
        clerkId: user.clerkId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        profileImage: user.profileImage,
        verificationStatus: user.verificationStatus
      }
    });

  } catch (error) {
    console.error('User sync error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to sync user',
      error: error.message
    });
  }
});

// Protected routes
router.use(authMiddleware); // Apply auth middleware to all routes below

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/change-password', changePassword);
router.post('/logout', logout);
router.delete('/account', deleteAccount);

// Admin routes
router.get('/users', requireAdmin, (req, res) => {
  // This would be moved to a separate admin controller
  res.json({ message: 'Admin: Get all users' });
});

module.exports = router;