const mongoose = require('mongoose');
const { Schema } = mongoose;

// Booking Schema
const bookingSchema = new Schema({
  bookingReference: {
    type: String,
    unique: true,
    required: true,
    uppercase: true
  },
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
  roomType: {
    roomTypeId: {
      type: Schema.Types.ObjectId,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    maxOccupancy: {
      type: Number,
      required: true
    }
  },
  dates: {
    checkIn: {
      type: Date,
      required: [true, 'Check-in date is required'],
      validate: {
        validator: function(value) {
          return value >= new Date(new Date().setHours(0, 0, 0, 0));
        },
        message: 'Check-in date cannot be in the past'
      }
    },
    checkOut: {
      type: Date,
      required: [true, 'Check-out date is required'],
      validate: {
        validator: function(value) {
          return this.dates.checkIn && value > this.dates.checkIn;
        },
        message: 'Check-out date must be after check-in date'
      }
    },
    nights: {
      type: Number,
      required: true,
      min: [1, 'Minimum 1 night stay required']
    }
  },
  guests: {
    adults: {
      type: Number,
      required: [true, 'Number of adults is required'],
      min: [1, 'At least 1 adult is required'],
      max: [20, 'Maximum 20 guests allowed']
    },
    children: {
      type: Number,
      default: 0,
      min: [0, 'Children count cannot be negative'],
      max: [10, 'Maximum 10 children allowed']
    },
    infants: {
      type: Number,
      default: 0,
      min: [0, 'Infants count cannot be negative'],
      max: [5, 'Maximum 5 infants allowed']
    }
  },
  guestDetails: {
    primaryGuest: {
      firstName: {
        type: String,
        required: [true, 'Primary guest first name is required'],
        trim: true
      },
      lastName: {
        type: String,
        required: [true, 'Primary guest last name is required'],
        trim: true
      },
      email: {
        type: String,
        required: [true, 'Primary guest email is required'],
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
      },
      phone: {
        type: String,
        required: [true, 'Primary guest phone is required'],
        match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
      },
      dateOfBirth: Date,
      nationality: String,
      passportNumber: String,
      specialRequests: String
    },
    additionalGuests: [{
      firstName: { type: String, trim: true },
      lastName: { type: String, trim: true },
      age: { type: Number, min: 0, max: 120 },
      relationship: { 
        type: String, 
        enum: ['spouse', 'child', 'parent', 'sibling', 'friend', 'colleague', 'other'],
        default: 'other'
      }
    }]
  },
  pricing: {
    basePrice: {
      type: Number,
      required: true,
      min: [0, 'Base price cannot be negative']
    },
    roomPrice: {
      type: Number,
      required: true,
      min: [0, 'Room price cannot be negative']
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'Subtotal cannot be negative']
    },
    taxes: {
      amount: {
        type: Number,
        default: 0,
        min: [0, 'Tax amount cannot be negative']
      },
      rate: {
        type: Number,
        default: 0.12,
        min: [0, 'Tax rate cannot be negative'],
        max: [1, 'Tax rate cannot exceed 100%']
      }
    },
    fees: [{
      name: { type: String, required: true },
      amount: { type: Number, required: true, min: 0 },
      description: String
    }],
    discounts: [{
      name: { type: String, required: true },
      amount: { type: Number, required: true, min: 0 },
      type: { 
        type: String, 
        enum: ['percentage', 'fixed'], 
        default: 'fixed' 
      },
      code: String
    }],
    total: {
      type: Number,
      required: true,
      min: [0, 'Total amount cannot be negative']
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'CAD'],
      default: 'USD'
    },
    paidAmount: {
      type: Number,
      default: 0,
      min: [0, 'Paid amount cannot be negative']
    },
    remainingAmount: {
      type: Number,
      default: 0,
      min: [0, 'Remaining amount cannot be negative']
    }
  },
  payment: {
    method: {
      type: String,
      enum: ['credit-card', 'debit-card', 'paypal', 'apple-pay', 'google-pay', 'bank-transfer', 'cash'],
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'processing', 'completed', 'failed', 'refunded', 'partially-refunded'],
      default: 'pending',
      index: true
    },
    transactionId: String,
    stripePaymentIntentId: String,
    paymentDate: Date,
    refunds: [{
      amount: { type: Number, required: true, min: 0 },
      reason: { type: String, required: true },
      processedDate: { type: Date, default: Date.now },
      transactionId: String
    }]
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'checked-in', 'checked-out', 'cancelled', 'no-show'],
    default: 'pending',
    index: true
  },
  confirmation: {
    isConfirmed: {
      type: Boolean,
      default: false
    },
    confirmedAt: Date,
    confirmationMethod: {
      type: String,
      enum: ['email', 'sms', 'phone', 'in-person']
    }
  },
  checkin: {
    actualTime: Date,
    notes: String,
    staffMember: String,
    roomNumber: String,
    keyCards: Number
  },
  checkout: {
    actualTime: Date,
    notes: String,
    staffMember: String,
    damages: [{
      description: String,
      cost: { type: Number, min: 0 },
      resolved: { type: Boolean, default: false }
    }],
    minibarCharges: Number,
    additionalCharges: [{
      description: String,
      amount: { type: Number, min: 0 }
    }]
  },
  specialRequests: [{
    type: {
      type: String,
      enum: ['accessibility', 'dietary', 'room-preference', 'celebration', 'transportation', 'other'],
      required: true
    },
    description: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'fulfilled', 'denied'],
      default: 'pending'
    },
    cost: {
      type: Number,
      default: 0,
      min: [0, 'Cost cannot be negative']
    }
  }],
  cancellation: {
    isCancelled: {
      type: Boolean,
      default: false
    },
    cancelledAt: Date,
    reason: {
      type: String,
      enum: ['guest-request', 'hotel-issue', 'payment-failed', 'force-majeure', 'other']
    },
    refundAmount: {
      type: Number,
      default: 0,
      min: [0, 'Refund amount cannot be negative']
    },
    cancellationFee: {
      type: Number,
      default: 0,
      min: [0, 'Cancellation fee cannot be negative']
    }
  },
  communication: [{
    type: {
      type: String,
      enum: ['email', 'sms', 'phone', 'in-app'],
      required: true
    },
    subject: String,
    message: {
      type: String,
      required: true
    },
    sentAt: {
      type: Date,
      default: Date.now
    },
    sentBy: String, // Staff member or system
    read: {
      type: Boolean,
      default: false
    }
  }],
  reviews: [{
    reviewId: {
      type: Schema.Types.ObjectId,
      ref: 'Review'
    },
    submitted: {
      type: Boolean,
      default: false
    }
  }],
  loyaltyProgram: {
    pointsEarned: {
      type: Number,
      default: 0,
      min: [0, 'Points earned cannot be negative']
    },
    pointsRedeemed: {
      type: Number,
      default: 0,
      min: [0, 'Points redeemed cannot be negative']
    }
  },
  metadata: {
    source: {
      type: String,
      enum: ['website', 'mobile-app', 'phone', 'walk-in', 'third-party'],
      default: 'website'
    },
    userAgent: String,
    ipAddress: String,
    referrer: String,
    utm: {
      source: String,
      medium: String,
      campaign: String,
      term: String,
      content: String
    }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance (avoid duplicates with unique: true and index: true)
bookingSchema.index({ user: 1, status: 1 });
bookingSchema.index({ hotel: 1, 'dates.checkIn': 1, 'dates.checkOut': 1 });
bookingSchema.index({ createdAt: -1 });

// Virtual for total guests
bookingSchema.virtual('totalGuests').get(function() {
  return this.guests.adults + this.guests.children + this.guests.infants;
});

// Virtual for booking duration in days
bookingSchema.virtual('duration').get(function() {
  if (this.dates.checkIn && this.dates.checkOut) {
    const diffTime = Math.abs(this.dates.checkOut - this.dates.checkIn);
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for days until check-in
bookingSchema.virtual('daysUntilCheckIn').get(function() {
  if (this.dates.checkIn) {
    const now = new Date();
    const diffTime = this.dates.checkIn - now;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return 0;
});

// Virtual for booking status display
bookingSchema.virtual('statusDisplay').get(function() {
  const statusMap = {
    'pending': 'Pending Confirmation',
    'confirmed': 'Confirmed',
    'checked-in': 'Checked In',
    'checked-out': 'Completed',
    'cancelled': 'Cancelled',
    'no-show': 'No Show'
  };
  return statusMap[this.status] || this.status;
});

// Instance method to generate booking reference
bookingSchema.methods.generateBookingReference = function() {
  const timestamp = Date.now().toString(36).toUpperCase();
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  this.bookingReference = `SL${timestamp}${random}`;
  return this.bookingReference;
};

// Instance method to calculate nights
bookingSchema.methods.calculateNights = function() {
  if (this.dates.checkIn && this.dates.checkOut) {
    const diffTime = Math.abs(this.dates.checkOut - this.dates.checkIn);
    this.dates.nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }
  return this.dates.nights;
};

// Instance method to check if cancellation is allowed
bookingSchema.methods.canCancel = function() {
  const now = new Date();
  const checkInDate = new Date(this.dates.checkIn);
  const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);
  
  // Can cancel if more than 24 hours before check-in and not already cancelled
  return hoursUntilCheckIn > 24 && !this.cancellation.isCancelled && this.status !== 'cancelled';
};

// Instance method to calculate cancellation fee
bookingSchema.methods.calculateCancellationFee = function() {
  const now = new Date();
  const checkInDate = new Date(this.dates.checkIn);
  const hoursUntilCheckIn = (checkInDate - now) / (1000 * 60 * 60);
  
  let feePercentage = 0;
  
  if (hoursUntilCheckIn <= 24) {
    feePercentage = 1.0; // 100% if less than 24 hours
  } else if (hoursUntilCheckIn <= 72) {
    feePercentage = 0.5; // 50% if less than 72 hours
  } else if (hoursUntilCheckIn <= 168) {
    feePercentage = 0.25; // 25% if less than 1 week
  }
  
  return this.pricing.total * feePercentage;
};

// Instance method to add communication
bookingSchema.methods.addCommunication = function(type, subject, message, sentBy = 'System') {
  this.communication.push({
    type,
    subject,
    message,
    sentBy,
    sentAt: new Date()
  });
  return this.save();
};

// Static method to find bookings by date range
bookingSchema.statics.findByDateRange = function(startDate, endDate) {
  return this.find({
    $or: [
      {
        'dates.checkIn': { $gte: startDate, $lte: endDate }
      },
      {
        'dates.checkOut': { $gte: startDate, $lte: endDate }
      },
      {
        'dates.checkIn': { $lte: startDate },
        'dates.checkOut': { $gte: endDate }
      }
    ]
  });
};

// Static method to find active bookings for a hotel
bookingSchema.statics.findActiveByHotel = function(hotelId) {
  return this.find({
    hotel: hotelId,
    status: { $in: ['confirmed', 'checked-in'] }
  });
};

// Pre-save middleware
bookingSchema.pre('save', function(next) {
  // Generate booking reference if not exists
  if (!this.bookingReference) {
    this.generateBookingReference();
  }
  
  // Calculate nights
  if (this.isModified('dates.checkIn') || this.isModified('dates.checkOut')) {
    this.calculateNights();
  }
  
  // Calculate remaining amount
  this.pricing.remainingAmount = Math.max(0, this.pricing.total - this.pricing.paidAmount);
  
  next();
});

// Pre-remove middleware
bookingSchema.pre('remove', async function(next) {
  try {
    // Remove associated reviews
    await this.model('Review').deleteMany({ booking: this._id });
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('Booking', bookingSchema);