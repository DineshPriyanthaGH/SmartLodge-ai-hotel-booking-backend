const Hotel = require('../models/Hotel');
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/hotel.log' })
  ]
});
const getAllHotels = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      sort = '-rating.overall',
      status = 'active'
    } = req.query;
    const hotels = await Hotel.find({ status })
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Hotel.countDocuments({ status });
    res.status(200).json({
      success: true,
      data: {
        hotels,
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
const getHotelById = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }
    res.status(200).json({
      success: true,
      data: { hotel }
    });
  } catch (error) {
    next(error);
  }
};
const searchHotels = async (req, res, next) => {
  try {
    const {
      q,
      city,
      country,
      checkIn,
      checkOut,
      guests = 1,
      minPrice,
      maxPrice,
      amenities,
      rating,
      page = 1,
      limit = 10
    } = req.query;
    const query = { status: 'active' };
    if (q) {
      query.$text = { $search: q };
    }
    if (city) {
      query['location.city'] = new RegExp(city, 'i');
    }
    if (country) {
      query['location.country'] = new RegExp(country, 'i');
    }
    if (minPrice || maxPrice) {
      query['pricing.basePrice'] = {};
      if (minPrice) query['pricing.basePrice'].$gte = Number(minPrice);
      if (maxPrice) query['pricing.basePrice'].$lte = Number(maxPrice);
    }
    if (rating) {
      query['rating.overall'] = { $gte: Number(rating) };
    }
    if (amenities) {
      const amenityArray = amenities.split(',');
      query['amenities.name'] = { $in: amenityArray };
    }
    const hotels = await Hotel.find(query)
      .sort({ 'rating.overall': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Hotel.countDocuments(query);
    res.status(200).json({
      success: true,
      data: {
        hotels,
        pagination: {
          current: page,
          pages: Math.ceil(total / limit),
          total
        },
        searchParams: req.query
      }
    });
  } catch (error) {
    next(error);
  }
};
const getFeaturedHotels = async (req, res, next) => {
  try {
    const { limit = 6 } = req.query;
    const hotels = await Hotel.findFeatured(Number(limit));
    res.status(200).json({
      success: true,
      data: { hotels }
    });
  } catch (error) {
    next(error);
  }
};
const getHotelsByLocation = async (req, res, next) => {
  try {
    const { city, country } = req.params;
    const { limit = 10 } = req.query;
    const hotels = await Hotel.findByLocation(city, country).limit(Number(limit));
    res.status(200).json({
      success: true,
      data: { hotels }
    });
  } catch (error) {
    next(error);
  }
};
const checkAvailability = async (req, res, next) => {
  try {
    const { checkIn, checkOut, guests = 1 } = req.body;
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }
    await new Promise(resolve => setTimeout(resolve, 2000));
    const availability = hotel.checkAvailability(
      new Date(checkIn),
      new Date(checkOut),
      Number(guests)
    );
    res.status(200).json({
      success: true,
      data: {
        available: availability.available,
        roomTypes: availability.roomTypes,
        totalAvailableRooms: availability.totalAvailableRooms,
        pricing: hotel.calculateTotalPrice(
          Math.ceil((new Date(checkOut) - new Date(checkIn)) / (1000 * 60 * 60 * 24))
        )
      }
    });
  } catch (error) {
    next(error);
  }
};
const getHotelAmenities = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id).select('amenities');
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }
    res.status(200).json({
      success: true,
      data: { amenities: hotel.amenities }
    });
  } catch (error) {
    next(error);
  }
};
const getHotelRoomTypes = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id).select('roomTypes');
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }
    res.status(200).json({
      success: true,
      data: { roomTypes: hotel.roomTypes }
    });
  } catch (error) {
    next(error);
  }
};
const getHotelReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const hotel = await Hotel.findById(req.params.id);
    
    // Temporary: Return empty reviews array until Review model is properly integrated
    const reviews = [];
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }
    res.status(200).json({
      success: true,
      data: { 
        reviews: reviews,
        rating: hotel.rating
      }
    });
  } catch (error) {
    next(error);
  }
};
const createHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.create(req.body);
    logger.info(`New hotel created: ${hotel.name} by ${req.user.email}`);
    res.status(201).json({
      success: true,
      message: 'Hotel created successfully',
      data: { hotel }
    });
  } catch (error) {
    next(error);
  }
};
const updateHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }
    logger.info(`Hotel updated: ${hotel.name} by ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Hotel updated successfully',
      data: { hotel }
    });
  } catch (error) {
    next(error);
  }
};
const deleteHotel = async (req, res, next) => {
  try {
    const hotel = await Hotel.findById(req.params.id);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }
    await hotel.remove();
    logger.info(`Hotel deleted: ${hotel.name} by ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Hotel deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};
const uploadHotelImages = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Image upload functionality to be implemented'
    });
  } catch (error) {
    next(error);
  }
};
const updateHotelStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    const hotel = await Hotel.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true, runValidators: true }
    );
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }
    logger.info(`Hotel status updated: ${hotel.name} to ${status} by ${req.user.email}`);
    res.status(200).json({
      success: true,
      message: 'Hotel status updated successfully',
      data: { hotel }
    });
  } catch (error) {
    next(error);
  }
};
const addRoomType = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Add room type functionality to be implemented'
    });
  } catch (error) {
    next(error);
  }
};
const updateRoomType = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Update room type functionality to be implemented'
    });
  } catch (error) {
    next(error);
  }
};
const deleteRoomType = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Delete room type functionality to be implemented'
    });
  } catch (error) {
    next(error);
  }
};
const updateAvailability = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Update availability functionality to be implemented'
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
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
};
