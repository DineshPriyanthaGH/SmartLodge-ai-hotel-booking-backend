const Booking = require('../models/Booking');
const Hotel = require('../models/Hotel');
const User = require('../models/User');
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/booking.log' })
  ]
});
const createBooking = async (req, res, next) => {
  try {
    const {
      hotelId,
      roomTypeId,
      checkIn,
      checkOut,
      guests,
      guestDetails,
      specialRequests
    } = req.body;
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }
    const roomType = hotel.roomTypes.id(roomTypeId);
    if (!roomType) {
      return res.status(404).json({
        success: false,
        message: 'Room type not found'
      });
    }
    const nights = Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24));
    const pricing = hotel.calculateTotalPrice(nights, roomTypeId);
    const booking = await Booking.create({
      user: req.userId,
      hotel: hotelId,
      roomType: {
        roomTypeId,
        name: roomType.name,
        maxOccupancy: roomType.maxOccupancy
      },
      dates: {
        checkIn: new Date(checkIn),
        checkOut: new Date(checkOut),
        nights
      },
      guests,
      guestDetails,
      pricing: {
        basePrice: pricing.basePrice,
        roomPrice: pricing.basePrice + roomType.priceAdjustment,
        subtotal: pricing.subtotal,
        taxes: {
          amount: pricing.tax,
          rate: hotel.pricing.taxRate
        },
        total: pricing.total
      },
      payment: {
        method: 'pending',
        status: 'pending'
      },
      specialRequests: specialRequests || []
    });
    await booking.populate([
      { path: 'user', select: 'firstName lastName email' },
      { path: 'hotel', select: 'name location contact' }
    ]);
    logger.info(`New booking created: ${booking.bookingReference} by ${req.user.email}`);
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};
const getMyBookings = async (req, res, next) => {
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
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('user', 'firstName lastName email phone')
      .populate('hotel', 'name location contact images amenities');
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    res.status(200).json({
      success: true,
      data: { booking }
    });
  } catch (error) {
    next(error);
  }
};
const updateBooking = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Update booking functionality to be implemented'
    });
  } catch (error) {
    next(error);
  }
};
const cancelBooking = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Cancel booking functionality to be implemented'
    });
  } catch (error) {
    next(error);
  }
};
const checkInBooking = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Check-in booking functionality to be implemented'
    });
  } catch (error) {
    next(error);
  }
};
const checkOutBooking = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Check-out booking functionality to be implemented'
    });
  } catch (error) {
    next(error);
  }
};
const getAllBookings = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Get all bookings functionality to be implemented'
    });
  } catch (error) {
    next(error);
  }
};
const getBookingsByHotel = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Get bookings by hotel functionality to be implemented'
    });
  } catch (error) {
    next(error);
  }
};
const getBookingsByDate = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Get bookings by date functionality to be implemented'
    });
  } catch (error) {
    next(error);
  }
};
const confirmBooking = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Confirm booking functionality to be implemented'
    });
  } catch (error) {
    next(error);
  }
};
const addSpecialRequest = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Add special request functionality to be implemented'
    });
  } catch (error) {
    next(error);
  }
};
const updateSpecialRequest = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Update special request functionality to be implemented'
    });
  } catch (error) {
    next(error);
  }
};
const addCommunication = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Add communication functionality to be implemented'
    });
  } catch (error) {
    next(error);
  }
};
const generateBookingReport = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Generate booking report functionality to be implemented'
    });
  } catch (error) {
    next(error);
  }
};
const getBookingStats = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Get booking stats functionality to be implemented'
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
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
};
