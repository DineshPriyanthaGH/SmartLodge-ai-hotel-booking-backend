const express = require('express');
const { authMiddleware, requireAdmin } = require('../middleware/auth');
const {
  createReview,
  getHotelReviews,
  getReviewStats,
  getUserReviews,
  updateReview,
  deleteReview,
  markReviewHelpful,
  getEligibleBookingsForReview
} = require('../controllers/reviewController');

const router = express.Router();

// Public routes
router.get('/hotel/:hotelId', getHotelReviews);
router.get('/hotel/:hotelId/stats', getReviewStats);

// Protected routes (require authentication)
router.use(authMiddleware);

// User review routes
router.post('/', createReview);
router.get('/my-reviews', getUserReviews);
router.get('/eligible-bookings', getEligibleBookingsForReview);
router.put('/:reviewId', updateReview);
router.delete('/:reviewId', deleteReview);
router.post('/:reviewId/helpful', markReviewHelpful);

module.exports = router;