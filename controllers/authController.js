const User = require('../models/User');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

// Generate JWT token
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};

// Register user
const register = async (req, res) => {
  try {
    const { email, firstName, lastName, password, phone } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const user = await User.create({
      email,
      firstName,
      lastName,
      password: hashedPassword,
      phone
    });

    // Generate token
    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone
        },
        token
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error registering user',
      error: error.message
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email, isActive: true });
    if (!user || !user.password) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Check password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Generate token
    const token = generateToken(user._id);

    res.json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          loyaltyProgram: user.loyaltyProgram
        },
        token
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error logging in',
      error: error.message
    });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.userId).select('-password');
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      data: { user }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    delete updates.password; // Don't allow password updates here
    delete updates.clerkId; // Don't allow clerkId updates

    const user = await User.findByIdAndUpdate(
      req.userId,
      updates,
      { new: true, runValidators: true }
    ).select('-password');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Placeholder functions for other auth operations
const refreshToken = async (req, res) => {
  res.json({ success: true, message: 'Refresh token endpoint - to be implemented' });
};

const logout = async (req, res) => {
  res.json({ success: true, message: 'Logout successful' });
};

const forgotPassword = async (req, res) => {
  res.json({ success: true, message: 'Forgot password endpoint - to be implemented' });
};

const resetPassword = async (req, res) => {
  res.json({ success: true, message: 'Reset password endpoint - to be implemented' });
};

const verifyEmail = async (req, res) => {
  res.json({ success: true, message: 'Email verification endpoint - to be implemented' });
};

const resendVerification = async (req, res) => {
  res.json({ success: true, message: 'Resend verification endpoint - to be implemented' });
};

const clerkWebhook = async (req, res) => {
  res.json({ success: true, message: 'Clerk webhook endpoint - to be implemented' });
};

const changePassword = async (req, res) => {
  res.json({ success: true, message: 'Change password endpoint - to be implemented' });
};

const deleteAccount = async (req, res) => {
  res.json({ success: true, message: 'Delete account endpoint - to be implemented' });
};

module.exports = {
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
};