const mongoose = require('mongoose');
const { Schema } = mongoose;

const reviewSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  hotel: {
    type: Schema.Types.ObjectId,
    ref: 'Hotel',
    required: true,
    index: true
  },
  booking: {
    type: Schema.Types.ObjectId,
    ref: 'Booking',
    required: false,
    index: true
  },
  rating: {
    overall: {
      type: Number,
      required: [true, 'Overall rating is required'],
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    breakdown: {
      cleanliness: { type: Number, min: 1, max: 5 },
      service: { type: Number, min: 1, max: 5 },
      location: { type: Number, min: 1, max: 5 },
      value: { type: Number, min: 1, max: 5 },
      amenities: { type: Number, min: 1, max: 5 }
    }
  },
  title: {
    type: String,
    required: [true, 'Review title is required'],
    trim: true,
    maxLength: [100, 'Title cannot exceed 100 characters']
  },
  comment: {
    type: String,
    required: [true, 'Review comment is required'],
    trim: true,
    maxLength: [1000, 'Comment cannot exceed 1000 characters']
  },
  pros: [{
    type: String,
    trim: true,
    maxLength: [200, 'Pro cannot exceed 200 characters']
  }],
  cons: [{
    type: String,
    trim: true,
    maxLength: [200, 'Con cannot exceed 200 characters']
  }],
  stayDetails: {
    roomType: String,
    stayDuration: Number, // nights
    travelType: {
      type: String,
      enum: ['business', 'leisure', 'family', 'couples', 'solo', 'group'],
      default: 'leisure'
    },
    stayMonth: {
      type: String,
      enum: ['January', 'February', 'March', 'April', 'May', 'June', 
             'July', 'August', 'September', 'October', 'November', 'December']
    }
  },
  helpfulVotes: {
    type: Number,
    default: 0,
    min: [0, 'Helpful votes cannot be negative']
  },
  verified: {
    type: Boolean,
    default: false
  },
  response: {
    message: String,
    respondedBy: String,
    respondedAt: Date
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected', 'hidden'],
    default: 'pending',
    index: true
  },
  moderationNotes: String,
  images: [{
    url: String,
    caption: String,
    approved: { type: Boolean, default: false }
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes
reviewSchema.index({ hotel: 1, 'rating.overall': -1 });
reviewSchema.index({ user: 1, createdAt: -1 });
reviewSchema.index({ verified: 1, status: 1 });

// Ensure one review per booking
reviewSchema.index({ booking: 1 }, { unique: true });

// Virtual for formatted date
reviewSchema.virtual('formattedDate').get(function() {
  return this.createdAt.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
});

// Virtual for reviewer initials
reviewSchema.virtual('reviewerInitials').get(function() {
  if (this.user && this.user.firstName && this.user.lastName) {
    return `${this.user.firstName[0]}${this.user.lastName[0]}`.toUpperCase();
  }
  return 'AN'; // Anonymous
});

// Static method to get average ratings for a hotel
reviewSchema.statics.getHotelRatings = async function(hotelId) {
  const pipeline = [
    { $match: { hotel: hotelId, status: 'approved' } },
    {
      $group: {
        _id: '$hotel',
        overall: { $avg: '$rating.overall' },
        cleanliness: { $avg: '$rating.breakdown.cleanliness' },
        service: { $avg: '$rating.breakdown.service' },
        location: { $avg: '$rating.breakdown.location' },
        value: { $avg: '$rating.breakdown.value' },
        amenities: { $avg: '$rating.breakdown.amenities' },
        count: { $sum: 1 }
      }
    }
  ];

  const result = await this.aggregate(pipeline);
  return result[0] || {
    overall: 0,
    cleanliness: 0,
    service: 0,
    location: 0,
    value: 0,
    amenities: 0,
    count: 0
  };
};

// Instance method to mark as helpful
reviewSchema.methods.markHelpful = function() {
  this.helpfulVotes += 1;
  return this.save();
};

// Pre-save middleware to update hotel ratings
reviewSchema.pre('save', async function(next) {
  if (this.isNew || this.isModified('rating.overall')) {
    try {
      const Hotel = require('./Hotel');
      const ratings = await this.constructor.getHotelRatings(this.hotel);
      
      await Hotel.findByIdAndUpdate(this.hotel, {
        'rating.overall': Math.round(ratings.overall * 10) / 10,
        'rating.breakdown.cleanliness': Math.round(ratings.cleanliness * 10) / 10,
        'rating.breakdown.service': Math.round(ratings.service * 10) / 10,
        'rating.breakdown.location': Math.round(ratings.location * 10) / 10,
        'rating.breakdown.value': Math.round(ratings.value * 10) / 10,
        'rating.breakdown.amenities': Math.round(ratings.amenities * 10) / 10,
        'rating.reviewCount': ratings.count
      });
    } catch (error) {
      console.error('Error updating hotel ratings:', error);
    }
  }
  next();
});

module.exports = mongoose.model('Review', reviewSchema);