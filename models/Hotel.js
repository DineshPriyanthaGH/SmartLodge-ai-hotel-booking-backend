const mongoose = require('mongoose');
const { Schema } = mongoose;
const hotelSchema = new Schema({
  name: {
    type: String,
    required: [true, 'Hotel name is required'],
    trim: true,
    maxLength: [100, 'Hotel name cannot exceed 100 characters'],
    index: true
  },
  description: {
    type: String,
    required: [true, 'Hotel description is required'],
    maxLength: [2000, 'Description cannot exceed 2000 characters']
  },
  shortDescription: {
    type: String,
    maxLength: [200, 'Short description cannot exceed 200 characters']
  },
  location: {
    address: {
      type: String,
      required: [true, 'Address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true,
      index: true
    },
    state: {
      type: String,
      trim: true
    },
    country: {
      type: String,
      required: [true, 'Country is required'],
      trim: true,
      index: true
    },
    zipCode: {
      type: String,
      trim: true
    },
    coordinates: {
      latitude: {
        type: Number,
        min: [-90, 'Latitude must be between -90 and 90'],
        max: [90, 'Latitude must be between -90 and 90']
      },
      longitude: {
        type: Number,
        min: [-180, 'Longitude must be between -180 and 180'],
        max: [180, 'Longitude must be between -180 and 180']
      }
    },
    timezone: {
      type: String,
      default: 'UTC'
    }
  },
  contact: {
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
    },
    website: {
      type: String,
      match: [/^https?:\/\/.+/, 'Please enter a valid website URL']
    }
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    alt: {
      type: String,
      default: 'Hotel image'
    },
    isPrimary: {
      type: Boolean,
      default: false
    },
    category: {
      type: String,
      enum: ['exterior', 'lobby', 'room', 'amenity', 'dining', 'other'],
      default: 'other'
    }
  }],
  rating: {
    overall: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5'],
      default: 4.0
    },
    breakdown: {
      cleanliness: { type: Number, min: 1, max: 5, default: 4.0 },
      service: { type: Number, min: 1, max: 5, default: 4.0 },
      location: { type: Number, min: 1, max: 5, default: 4.0 },
      value: { type: Number, min: 1, max: 5, default: 4.0 },
      amenities: { type: Number, min: 1, max: 5, default: 4.0 }
    },
    reviewCount: {
      type: Number,
      default: 0,
      min: [0, 'Review count cannot be negative']
    }
  },
  pricing: {
    basePrice: {
      type: Number,
      required: [true, 'Base price is required'],
      min: [0, 'Price cannot be negative']
    },
    currency: {
      type: String,
      enum: ['USD', 'EUR', 'GBP', 'CAD'],
      default: 'USD'
    },
    taxRate: {
      type: Number,
      default: 0.12, // 12% default tax
      min: [0, 'Tax rate cannot be negative'],
      max: [1, 'Tax rate cannot exceed 100%']
    },
    serviceCharge: {
      type: Number,
      default: 0,
      min: [0, 'Service charge cannot be negative']
    },
    seasonalRates: [{
      name: { type: String, required: true }, // e.g., "Summer", "Holiday"
      startDate: { type: Date, required: true },
      endDate: { type: Date, required: true },
      multiplier: { type: Number, default: 1.0, min: 0.1, max: 5.0 } // Price multiplier
    }]
  },
  amenities: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    category: {
      type: String,
      enum: ['general', 'wellness', 'business', 'dining', 'entertainment', 'transportation', 'accessibility'],
      default: 'general'
    },
    isAvailable: {
      type: Boolean,
      default: true
    },
    additionalCost: {
      type: Number,
      default: 0,
      min: [0, 'Additional cost cannot be negative']
    }
  }],
  roomTypes: [{
    name: {
      type: String,
      required: true,
      trim: true
    },
    description: {
      type: String,
      trim: true
    },
    maxOccupancy: {
      type: Number,
      required: true,
      min: [1, 'Maximum occupancy must be at least 1'],
      max: [20, 'Maximum occupancy cannot exceed 20']
    },
    bedConfiguration: {
      type: String,
      required: true
    },
    size: {
      squareFeet: { type: Number, min: 0 },
      squareMeters: { type: Number, min: 0 }
    },
    amenities: [String],
    images: [{
      url: String,
      alt: String
    }],
    priceAdjustment: {
      type: Number,
      default: 0 // Adjustment to base price
    },
    totalRooms: {
      type: Number,
      required: true,
      min: [1, 'Must have at least 1 room'],
      max: [1000, 'Cannot exceed 1000 rooms']
    },
    availableRooms: {
      type: Number,
      required: true,
      min: [0, 'Available rooms cannot be negative']
    }
  }],
  policies: {
    checkIn: {
      time: { type: String, default: '15:00' },
      instructions: { type: String }
    },
    checkOut: {
      time: { type: String, default: '11:00' },
      instructions: { type: String }
    },
    cancellation: {
      type: String,
      enum: ['flexible', 'moderate', 'strict', 'super-strict'],
      default: 'moderate'
    },
    children: {
      allowed: { type: Boolean, default: true },
      ageLimit: { type: Number, default: 18 },
      additionalCharge: { type: Number, default: 0 }
    },
    pets: {
      allowed: { type: Boolean, default: false },
      restrictions: { type: String },
      additionalCharge: { type: Number, default: 0 }
    },
    smoking: {
      type: String,
      enum: ['no-smoking', 'designated-areas', 'all-areas'],
      default: 'no-smoking'
    }
  },
  sustainability: {
    certifications: [String], // e.g., ['LEED', 'Green Key']
    practices: [String], // e.g., ['Solar Power', 'Recycling Program']
    carbonFootprint: {
      rating: {
        type: String,
        enum: ['A', 'B', 'C', 'D', 'E'],
        default: 'C'
      },
      lastUpdated: Date
    }
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'maintenance', 'coming-soon'],
    default: 'active',
    index: true
  },
  featured: {
    type: Boolean,
    default: false,
    index: true
  },
  owner: {
    name: { type: String, required: true },
    contact: {
      email: String,
      phone: String
    }
  },
  staff: [{
    userId: { type: Schema.Types.ObjectId, ref: 'User' },
    role: {
      type: String,
      enum: ['manager', 'reception', 'housekeeping', 'maintenance', 'security'],
      required: true
    },
    permissions: [String]
  }]
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
hotelSchema.index({ 'location.city': 1, 'location.country': 1 });
hotelSchema.index({ 'rating.overall': -1 });
hotelSchema.index({ 'pricing.basePrice': 1 });
hotelSchema.index({ status: 1, featured: -1 });
hotelSchema.index({ name: 'text', description: 'text' });
// Temporarily commented out until Booking model is properly integrated
// hotelSchema.virtual('bookings', {
//   ref: 'Booking',
//   localField: '_id',
//   foreignField: 'hotel'
// });
// Temporarily commented out until Review model is properly integrated
// hotelSchema.virtual('reviews', {
//   ref: 'Review',
//   localField: '_id',
//   foreignField: 'hotel'
// });
hotelSchema.virtual('primaryImage').get(function() {
  if (!this.images || !Array.isArray(this.images) || this.images.length === 0) {
    return null;
  }
  
  const primaryImg = this.images.find(img => img && img.isPrimary);
  return primaryImg ? primaryImg.url : (this.images[0] ? this.images[0].url : null);
});
hotelSchema.virtual('currentPrice').get(function() {
  // Check if pricing exists and has required properties
  if (!this.pricing || !this.pricing.seasonalRates || !this.pricing.basePrice) {
    return this.pricing?.basePrice || 0;
  }

  const now = new Date();
  const seasonalRate = this.pricing.seasonalRates.find(rate => 
    rate && rate.startDate && rate.endDate &&
    now >= rate.startDate && now <= rate.endDate
  );
  
  if (seasonalRate && seasonalRate.multiplier) {
    return this.pricing.basePrice * seasonalRate.multiplier;
  }
  return this.pricing.basePrice;
});
hotelSchema.virtual('totalAvailableRooms').get(function() {
  if (!this.roomTypes || !Array.isArray(this.roomTypes)) {
    return 0;
  }
  return this.roomTypes.reduce((total, roomType) => {
    return total + (roomType && roomType.availableRooms ? roomType.availableRooms : 0);
  }, 0);
});
hotelSchema.methods.checkAvailability = function(checkIn, checkOut, guests = 1) {
  const availableRoomTypes = this.roomTypes.filter(room => 
    room.availableRooms > 0 && 
    room.maxOccupancy >= guests &&
    this.status === 'active'
  );
  return {
    available: availableRoomTypes.length > 0,
    roomTypes: availableRoomTypes,
    totalAvailableRooms: availableRoomTypes.reduce((total, room) => total + room.availableRooms, 0)
  };
};
hotelSchema.methods.calculateTotalPrice = function(nights = 1, roomTypeId = null) {
  let basePrice = this.currentPrice;
  if (roomTypeId) {
    const roomType = this.roomTypes.id(roomTypeId);
    if (roomType) {
      basePrice += roomType.priceAdjustment;
    }
  }
  const subtotal = basePrice * nights;
  const tax = subtotal * this.pricing.taxRate;
  const serviceCharge = this.pricing.serviceCharge;
  return {
    basePrice,
    subtotal,
    tax,
    serviceCharge,
    total: subtotal + tax + serviceCharge
  };
};
hotelSchema.statics.findByLocation = function(city, country) {
  return this.find({ 
    'location.city': new RegExp(city, 'i'),
    'location.country': new RegExp(country, 'i'),
    status: 'active'
  });
};
hotelSchema.statics.findFeatured = function(limit = 10) {
  return this.find({ featured: true, status: 'active' })
    .sort({ 'rating.overall': -1 })
    .limit(limit);
};
hotelSchema.pre('save', function(next) {
  if (this.images.length > 0) {
    const hasPrimary = this.images.some(img => img.isPrimary);
    if (!hasPrimary) {
      this.images[0].isPrimary = true;
    }
  }
  this.roomTypes.forEach(roomType => {
    if (roomType.availableRooms > roomType.totalRooms) {
      roomType.availableRooms = roomType.totalRooms;
    }
  });
  next();
});
module.exports = mongoose.model('Hotel', hotelSchema);
