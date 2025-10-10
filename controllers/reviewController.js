const Review = require('../models/Review');
const Hotel = require('../models/Hotel');
const Booking = require('../models/Booking');
const User = require('../models/User');
const mongoose = require('mongoose');
const winston = require('winston');

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/review.log' })
  ]
});

// Create a new review
const createReview = async (req, res, next) => {
  try {
    const {
      hotelId,
      bookingId,
      rating,
      title,
      comment,
      pros = [],
      cons = [],
      stayDetails
    } = req.body;

    // Validate hotel exists
    const hotel = await Hotel.findById(hotelId);
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }

    // If bookingId provided, validate booking exists and belongs to user
    let booking = null;
    if (bookingId) {
      booking = await Booking.findOne({
        _id: bookingId,
        user: req.userId,
        hotel: hotelId,
        status: { $in: ['checked-out', 'completed'] }
      });
      
      if (!booking) {
        return res.status(400).json({
          success: false,
          message: 'Valid completed booking required to leave a review'
        });
      }

      // Check if review already exists for this booking
      const existingReview = await Review.findOne({ booking: bookingId });
      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'Review already exists for this booking'
        });
      }
    } else {
      // For reviews without booking, check if user already reviewed this hotel
      const existingReview = await Review.findOne({ 
        user: req.userId, 
        hotel: hotelId,
        booking: { $exists: false }
      });
      if (existingReview) {
        return res.status(400).json({
          success: false,
          message: 'You have already reviewed this hotel'
        });
      }
    }

    // Create review data
    const reviewData = {
      user: req.userId,
      hotel: hotelId,
      rating,
      title,
      comment,
      pros: pros.filter(pro => pro.trim().length > 0),
      cons: cons.filter(con => con.trim().length > 0),
      stayDetails: stayDetails || {},
      verified: booking ? true : false,
      status: 'approved' // Auto-approve for now, can add moderation later
    };

    // Add booking reference if provided
    if (booking) {
      reviewData.booking = bookingId;
    }

    const review = await Review.create(reviewData);

    // Populate user info
    await review.populate([
      { path: 'user', select: 'firstName lastName' },
      { path: 'hotel', select: 'name' }
    ]);

    logger.info(`Review created by user ${req.userId} for hotel ${hotelId}`);

    res.status(201).json({
      success: true,
      message: 'Review created successfully',
      data: { review }
    });

  } catch (error) {
    logger.error('Error creating review:', error);
    next(error);
  }
};

// Get reviews for a hotel
const getHotelReviews = async (req, res, next) => {
  try {
    const { hotelId } = req.params;
    const { 
      page = 1, 
      limit = 10, 
      sortBy = 'createdAt', 
      sortOrder = 'desc',
      rating = null 
    } = req.query;

    const query = { 
      hotel: hotelId, 
      status: 'approved' 
    };

    if (rating) {
      query['rating.overall'] = parseInt(rating);
    }

    const reviews = await Review.find(query)
      .populate('user', 'firstName lastName')
      .populate('hotel', 'name')
      .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        reviews,
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

// Get review statistics for a hotel
const getReviewStats = async (req, res, next) => {
  try {
    const { hotelId } = req.params;

    const stats = await Review.aggregate([
      { $match: { hotel: mongoose.Types.ObjectId(hotelId), status: 'approved' } },
      {
        $group: {
          _id: null,
          totalReviews: { $sum: 1 },
          averageRating: { $avg: '$rating.overall' },
          avgCleanliness: { $avg: '$rating.breakdown.cleanliness' },
          avgService: { $avg: '$rating.breakdown.service' },
          avgLocation: { $avg: '$rating.breakdown.location' },
          avgValue: { $avg: '$rating.breakdown.value' },
          avgAmenities: { $avg: '$rating.breakdown.amenities' },
          ratingDistribution: {
            $push: '$rating.overall'
          }
        }
      }
    ]);

    let result = {
      totalReviews: 0,
      averageRating: 0,
      breakdown: {
        cleanliness: 0,
        service: 0,
        location: 0,
        value: 0,
        amenities: 0
      },
      distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 }
    };

    if (stats.length > 0) {
      const stat = stats[0];
      result.totalReviews = stat.totalReviews;
      result.averageRating = Math.round(stat.averageRating * 10) / 10;
      result.breakdown = {
        cleanliness: Math.round(stat.avgCleanliness * 10) / 10,
        service: Math.round(stat.avgService * 10) / 10,
        location: Math.round(stat.avgLocation * 10) / 10,
        value: Math.round(stat.avgValue * 10) / 10,
        amenities: Math.round(stat.avgAmenities * 10) / 10
      };

      // Calculate distribution
      stat.ratingDistribution.forEach(rating => {
        result.distribution[rating]++;
      });
    }

    res.status(200).json({
      success: true,
      data: result
    });

  } catch (error) {
    next(error);
  }
};

// Get user's reviews
const getUserReviews = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    if (!req.userId) {
      return res.status(401).json({
        success: false,
        message: 'User ID not found in request'
      });
    }

    const reviews = await Review.find({ user: req.userId })
      .populate('hotel', 'name location images')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await Review.countDocuments({ user: req.userId });

    res.status(200).json({
      success: true,
      data: {
        reviews,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(total / limit),
          total
        }
      }
    });

  } catch (error) {
    logger.error('Error getting user reviews:', error);
    next(error);
  }
};

// Update a review
const updateReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;
    const { rating, title, comment, pros, cons, stayDetails } = req.body;

    const review = await Review.findOne({
      _id: reviewId,
      user: req.userId
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you do not have permission to edit it'
      });
    }

    // Update fields if provided
    if (rating) review.rating = rating;
    if (title) review.title = title;
    if (comment) review.comment = comment;
    if (pros) review.pros = pros.filter(pro => pro.trim().length > 0);
    if (cons) review.cons = cons.filter(con => con.trim().length > 0);
    if (stayDetails) review.stayDetails = { ...review.stayDetails, ...stayDetails };

    review.updatedAt = new Date();
    review.status = 'pending'; // Re-moderate after edit

    await review.save();
    await review.populate([
      { path: 'user', select: 'firstName lastName' },
      { path: 'hotel', select: 'name' }
    ]);

    logger.info(`Review updated by user ${req.userId}: ${reviewId}`);

    res.status(200).json({
      success: true,
      message: 'Review updated successfully',
      data: { review }
    });

  } catch (error) {
    next(error);
  }
};

// Delete a review
const deleteReview = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findOneAndDelete({
      _id: reviewId,
      user: req.userId
    });

    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found or you do not have permission to delete it'
      });
    }

    logger.info(`Review deleted by user ${req.userId}: ${reviewId}`);

    res.status(200).json({
      success: true,
      message: 'Review deleted successfully'
    });

  } catch (error) {
    next(error);
  }
};

// Mark review as helpful
const markReviewHelpful = async (req, res, next) => {
  try {
    const { reviewId } = req.params;

    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({
        success: false,
        message: 'Review not found'
      });
    }

    review.helpfulVotes += 1;
    await review.save();

    res.status(200).json({
      success: true,
      message: 'Review marked as helpful',
      data: { helpfulVotes: review.helpfulVotes }
    });

  } catch (error) {
    next(error);
  }
};

// Get bookings eligible for review
const getEligibleBookingsForReview = async (req, res, next) => {
  try {
    const bookings = await Booking.find({
      user: req.userId,
      status: { $in: ['checked-out', 'completed'] }
    }).populate('hotel', 'name location images');

    // Filter out bookings that already have reviews
    const bookingIds = bookings.map(b => b._id);
    const existingReviews = await Review.find({
      booking: { $in: bookingIds }
    }).select('booking');

    const reviewedBookingIds = existingReviews.map(r => r.booking.toString());
    const eligibleBookings = bookings.filter(
      booking => !reviewedBookingIds.includes(booking._id.toString())
    );

    res.status(200).json({
      success: true,
      data: { bookings: eligibleBookings }
    });

  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getHotelReviews,
  getReviewStats,
  getUserReviews,
  updateReview,
  deleteReview,
  markReviewHelpful,
  getEligibleBookingsForReview
};