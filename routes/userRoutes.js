const express = require('express');
const { authMiddleware, requireAdmin, requireOwnership } = require('../middleware/auth');
const {
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
} = require('../controllers/userController');

const router = express.Router();

// All user routes require authentication
router.use(authMiddleware);

// User profile routes
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.delete('/profile', deleteUser);
router.get('/bookings', getUserBookings);
router.get('/stats', getUserStats);
router.put('/preferences', updatePreferences);

// Admin routes
router.get('/', requireAdmin, getAllUsers);
router.get('/search', requireAdmin, searchUsers);
router.get('/:id', requireAdmin, getUserById);
router.put('/:id/status', requireAdmin, updateUserStatus);
router.post('/:id/loyalty-points', requireAdmin, addLoyaltyPoints);

module.exports = router;