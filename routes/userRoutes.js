const express = require('express');
const { authMiddleware, requireAdmin, requireOwnership } = require('../middleware/auth');
const {
  getUserProfile,
  updateUserProfile,
  getUserBookings,
  getUserPreferences,
  updateUserPreferences,
  getLoyaltyProgram,
  addEmergencyContact,
  updateEmergencyContact,
  uploadProfileImage,
  deleteUser,
  getAllUsers,
  getUserById,
  updateUserStatus,
  getUserStats
} = require('../controllers/userController');

const router = express.Router();

// All user routes require authentication
router.use(authMiddleware);

// User profile routes
router.get('/profile', getUserProfile);
router.put('/profile', updateUserProfile);
router.get('/bookings', getUserBookings);
router.post('/profile/image', uploadProfileImage);

// User preferences
router.get('/preferences', getUserPreferences);
router.put('/preferences', updateUserPreferences);

// Loyalty program
router.get('/loyalty', getLoyaltyProgram);

// Emergency contact
router.post('/emergency-contact', addEmergencyContact);
router.put('/emergency-contact', updateEmergencyContact);

// Account management
router.delete('/account', deleteUser);

// Admin routes
router.get('/', requireAdmin, getAllUsers);
router.get('/:id', requireAdmin, getUserById);
router.patch('/:id/status', requireAdmin, updateUserStatus);
router.get('/stats/overview', requireAdmin, getUserStats);

module.exports = router;