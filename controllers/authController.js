const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/auth.log' })
  ]
});
const generateToken = (userId) => {
  return jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d'
  });
};
const generateRefreshToken = (userId) => {
  return jwt.sign({ userId, type: 'refresh' }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d'
  });
};
const register = async (req, res, next) => {
  try {
    const {
      email,
      password,
      firstName,
      lastName,
      phone,
      dateOfBirth
    } = req.body;
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = await User.create({
      email: email.toLowerCase(),
      password: hashedPassword,
      firstName,
      lastName,
      phone,
      dateOfBirth
    });
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.password = undefined;
    logger.info(`New user registered: ${user.email}`);
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      data: {
        user,
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide email and password'
      });
    }
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated'
      });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    user.lastLogin = new Date();
    await user.save();
    const token = generateToken(user._id);
    const refreshToken = generateRefreshToken(user._id);
    user.password = undefined;
    logger.info(`User logged in: ${user.email}`);
    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user,
        token,
        refreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};
const refreshToken = async (req, res, next) => {
  try {
    const { refreshToken: token } = req.body;
    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }
    const decoded = jwt.verify(token, process.env.JWT_REFRESH_SECRET);
    if (decoded.type !== 'refresh') {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }
    const user = await User.findById(decoded.userId);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'User not found or inactive'
      });
    }
    const newToken = generateToken(user._id);
    const newRefreshToken = generateRefreshToken(user._id);
    res.status(200).json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    });
  } catch (error) {
    next(error);
  }
};
const logout = async (req, res, next) => {
  try {
    logger.info(`User logged out: ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });
  } catch (error) {
    next(error);
  }
};
const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'No user found with this email'
      });
    }
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = crypto.createHash('sha256').update(resetToken).digest('hex');
    user.resetPasswordExpire = Date.now() + 10 * 60 * 1000; // 10 minutes
    await user.save();
    const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    logger.info(`Password reset requested for: ${user.email}`);
    res.status(200).json({
      success: true,
      message: 'Password reset email sent',
      resetUrl // Remove this in production
    });
  } catch (error) {
    next(error);
  }
};
const resetPassword = async (req, res, next) => {
  try {
    const { token, password } = req.body;
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() }
    });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(password, salt);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();
    logger.info(`Password reset successful for: ${user.email}`);
    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });
  } catch (error) {
    next(error);
  }
};
const verifyEmail = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Email verification functionality to be implemented'
    });
  } catch (error) {
    next(error);
  }
};
const resendVerification = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Resend verification functionality to be implemented'
    });
  } catch (error) {
    next(error);
  }
};
const clerkWebhook = async (req, res, next) => {
  try {
    const { type, data } = req.body;
    switch (type) {
      case 'user.created':
        const newUser = await User.create({
          clerkId: data.id,
          email: data.email_addresses[0]?.email_address,
          firstName: data.first_name,
          lastName: data.last_name,
          verificationStatus: {
            email: data.email_addresses[0]?.verification?.status === 'verified'
          }
        });
        logger.info(`User synced from Clerk: ${newUser.email}`);
        break;
      case 'user.updated':
        await User.findOneAndUpdate(
          { clerkId: data.id },
          {
            email: data.email_addresses[0]?.email_address,
            firstName: data.first_name,
            lastName: data.last_name,
            verificationStatus: {
              email: data.email_addresses[0]?.verification?.status === 'verified'
            }
          }
        );
        break;
      case 'user.deleted':
        await User.findOneAndUpdate(
          { clerkId: data.id },
          { isActive: false }
        );
        break;
    }
    res.status(200).json({ success: true });
  } catch (error) {
    next(error);
  }
};
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).populate('bookings');
    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};
const updateProfile = async (req, res, next) => {
  try {
    const allowedFields = [
      'firstName', 'lastName', 'phone', 'dateOfBirth',
      'address', 'preferences', 'emergencyContact'
    ];
    const updateData = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });
    const user = await User.findByIdAndUpdate(
      req.userId,
      updateData,
      { new: true, runValidators: true }
    );
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};
const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const user = await User.findById(req.userId).select('+password');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    const salt = await bcrypt.genSalt(12);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();
    logger.info(`Password changed for user: ${user.email}`);
    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });
  } catch (error) {
    next(error);
  }
};
const deleteAccount = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      { isActive: false },
      { new: true }
    );
    logger.info(`Account deactivated for user: ${user.email}`);
    res.status(200).json({
      success: true,
      message: 'Account deactivated successfully'
    });
  } catch (error) {
    next(error);
  }
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
