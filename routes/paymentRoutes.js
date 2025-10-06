const express = require('express');
const { authMiddleware, requireAdmin, requireOwnership } = require('../middleware/auth');
const {
  createPaymentIntent,
  confirmPayment,
  refundPayment,
  getPaymentHistory,
  getPaymentById,
  processStripeWebhook,
  getAllPayments,
  getPaymentStats,
  createRefund,
  getRefunds
} = require('../controllers/paymentController');

const router = express.Router();

// Stripe webhook (no auth required)
router.post('/stripe/webhook', processStripeWebhook);

// All other payment routes require authentication
router.use(authMiddleware);

// User payment routes
router.post('/create-intent', createPaymentIntent);
router.post('/confirm', confirmPayment);
router.get('/history', getPaymentHistory);
router.get('/:id', requireOwnership('Payment'), getPaymentById);

// Refund routes
router.post('/:id/refund', requireOwnership('Payment'), createRefund);
router.get('/:id/refunds', requireOwnership('Payment'), getRefunds);

// Admin routes
router.get('/', requireAdmin, getAllPayments);
router.post('/:id/admin-refund', requireAdmin, refundPayment);
router.get('/stats/overview', requireAdmin, getPaymentStats);

module.exports = router;