const express = require('express');
const { authMiddleware, optionalAuth, requireAdmin, requireHotelStaff } = require('../middleware/auth');
const {
  getAllHotels,
  getHotelById,
  searchHotels,
  getFeaturedHotels,
  getHotelsByLocation,
  checkAvailability,
  getHotelAmenities,
  getHotelRoomTypes,
  getHotelReviews,
  createHotel,
  updateHotel,
  deleteHotel,
  uploadHotelImages,
  updateHotelStatus,
  addRoomType,
  updateRoomType,
  deleteRoomType,
  updateAvailability
} = require('../controllers/hotelController');

const router = express.Router();

// Public routes
router.get('/', getAllHotels);
router.get('/search', searchHotels);
router.get('/featured', getFeaturedHotels);
router.get('/location/:city/:country?', getHotelsByLocation);
router.get('/:id', getHotelById);
router.get('/:id/amenities', getHotelAmenities);
router.get('/:id/room-types', getHotelRoomTypes);
router.get('/:id/reviews', getHotelReviews);

// Availability checking (optional auth for better user experience)
router.post('/:id/check-availability', optionalAuth, checkAvailability);

// Protected routes (require authentication)
router.use(authMiddleware);

// Hotel management routes (admin only)
router.post('/', requireAdmin, createHotel);
router.put('/:id', requireAdmin, updateHotel);
router.delete('/:id', requireAdmin, deleteHotel);
router.post('/:id/images', requireAdmin, uploadHotelImages);
router.patch('/:id/status', requireAdmin, updateHotelStatus);

// Room type management (admin or hotel staff)
router.post('/:id/room-types', requireHotelStaff(), addRoomType);
router.put('/:id/room-types/:roomTypeId', requireHotelStaff(), updateRoomType);
router.delete('/:id/room-types/:roomTypeId', requireHotelStaff(), deleteRoomType);

// Availability management (admin or hotel staff)
router.put('/:id/availability', requireHotelStaff(), updateAvailability);

module.exports = router;