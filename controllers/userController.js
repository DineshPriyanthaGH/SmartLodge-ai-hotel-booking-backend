const User = require('../models/User');
const Booking = require('../models/Booking');
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/user.log' })
  ]
});
const getUserProfile = async (req, res, next) => {
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
const updateUserProfile = async (req, res, next) => {
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
    logger.info(`Profile updated for user: ${user.email}`);
    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};
const deleteUser = async (req, res, next) => {
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
const getUserBookings = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = { user: req.userId };
    if (status) query.status = status;
    const bookings = await Booking.find(query)
      .populate('hotel', 'name location images rating')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Booking.countDocuments(query);
    res.status(200).json({
      success: true,
      data: {
        bookings,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
const getUserStats = async (req, res, next) => {
  try {
    const userId = req.userId;
    const stats = await Booking.aggregate([
      { $match: { user: userId } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          totalSpent: { $sum: '$pricing.total' },
          avgBookingValue: { $avg: '$pricing.total' },
          completedBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'checked-out'] }, 1, 0] }
          },
          cancelledBookings: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      }
    ]);
    const user = await User.findById(userId);
    res.status(200).json({
      success: true,
      data: {
        stats: stats[0] || {
          totalBookings: 0,
          totalSpent: 0,
          avgBookingValue: 0,
          completedBookings: 0,
          cancelledBookings: 0
        },
        loyaltyProgram: user.loyaltyProgram,
        memberSince: user.createdAt
      }
    });
  } catch (error) {
    next(error);
  }
};
const updatePreferences = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.userId,
      { preferences: req.body },
      { new: true, runValidators: true }
    );
    res.status(200).json({
      success: true,
      message: 'Preferences updated successfully',
      data: { preferences: user.preferences }
    });
  } catch (error) {
    next(error);
  }
};
const getAllUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 20, status = 'active' } = req.query;
    const query = status === 'all' ? {} : { isActive: status === 'active' };
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await User.countDocuments(query);
    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
const searchUsers = async (req, res, next) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const searchQuery = {
      $or: [
        { firstName: new RegExp(q, 'i') },
        { lastName: new RegExp(q, 'i') },
        { email: new RegExp(q, 'i') }
      ]
    };
    const users = await User.find(searchQuery)
      .select('-password')
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await User.countDocuments(searchQuery);
    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        }
      }
    });
  } catch (error) {
    next(error);
  }
};
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id)
      .select('-password')
      .populate('bookings');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    res.status(200).json({
      success: true,
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};
const updateUserStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isActive },
      { new: true, runValidators: true }
    ).select('-password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    logger.info(`User status updated: ${user.email} - Active: ${isActive} by ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'User status updated successfully',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};
const addLoyaltyPoints = async (req, res, next) => {
  try {
    const { points, reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    await user.addLoyaltyPoints(points);
    logger.info(`Loyalty points added: ${points} to ${user.email} - Reason: ${reason} by ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Loyalty points added successfully',
      data: { 
        loyaltyProgram: user.loyaltyProgram,
        pointsAdded: points,
        reason
      }
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  getUserProfile,
  updateUserProfile,
  deleteUser,
  getUserBookings,
  getUserStats,
  updatePreferences,
  addLoyaltyPoints,
  getAllUsers,
  getUserById,
  updateUserStatus,
  searchUsers
};
