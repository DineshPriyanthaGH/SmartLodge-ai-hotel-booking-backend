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

// Clerk webhook (for user sync)
router.post('/clerk-webhook', clerkWebhook);

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