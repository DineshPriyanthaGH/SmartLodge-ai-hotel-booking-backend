const express = require('express');
const { authMiddleware, requireAdmin, requireOwnership, requireHotelStaff } = require('../middleware/auth');
const {
  createBooking,
  getMyBookings,
  getBookingById,
  updateBooking,
  cancelBooking,
  checkInBooking,
  checkOutBooking,
  getAllBookings,
  getBookingsByHotel,
  getBookingsByDate,
  confirmBooking,
  addSpecialRequest,
  updateSpecialRequest,
  addCommunication,
  generateBookingReport,
  getBookingStats
} = require('../controllers/bookingController');

const router = express.Router();

// All booking routes require authentication
router.use(authMiddleware);

// User booking routes
router.post('/', createBooking);
router.get('/my-bookings', getMyBookings);
router.get('/:id', requireOwnership('Booking'), getBookingById);
router.put('/:id', requireOwnership('Booking'), updateBooking);
router.post('/:id/cancel', requireOwnership('Booking'), cancelBooking);
router.post('/:id/special-requests', requireOwnership('Booking'), addSpecialRequest);

// Hotel staff routes
router.post('/:id/confirm', requireHotelStaff(), confirmBooking);
router.post('/:id/checkin', requireHotelStaff(), checkInBooking);
router.post('/:id/checkout', requireHotelStaff(), checkOutBooking);
router.put('/:id/special-requests/:requestId', requireHotelStaff(), updateSpecialRequest);
router.post('/:id/communication', requireHotelStaff(), addCommunication);

// Hotel management routes
router.get('/hotel/:hotelId', requireHotelStaff(), getBookingsByHotel);
router.get('/hotel/:hotelId/date/:date', requireHotelStaff(), getBookingsByDate);

// Admin routes
router.get('/', requireAdmin, getAllBookings);
router.get('/reports/generate', requireAdmin, generateBookingReport);
router.get('/stats', requireAdmin, getBookingStats);

module.exports = router;