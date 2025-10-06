const mongoose = require('mongoose');
const { Schema } = mongoose;

// User Schema
const userSchema = new Schema({
  clerkId: {
    type: String,
    unique: true,
    sparse: true // Allows null values for guest users
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  firstName: {
    type: String,
    required: true,
    trim: true,
    maxLength: [50, 'First name cannot exceed 50 characters']
  },
  lastName: {
    type: String,
    required: true,
    trim: true,
    maxLength: [50, 'Last name cannot exceed 50 characters']
  },
  phone: {
    type: String,
    trim: true,
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  dateOfBirth: {
    type: Date,
    validate: {
      validator: function(value) {
        if (!value) return true; // Optional field
        return value < new Date();
      },
      message: 'Date of birth must be in the past'
    }
  },
  address: {
    street: { type: String, trim: true },
    city: { type: String, trim: true },
    state: { type: String, trim: true },
    country: { type: String, trim: true },
    zipCode: { type: String, trim: true }
  },
  preferences: {
    currency: { type: String, default: 'USD', enum: ['USD', 'EUR', 'GBP', 'CAD'] },
    language: { type: String, default: 'en', enum: ['en', 'es', 'fr', 'de'] },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      marketing: { type: Boolean, default: false }
    },
    accessibility: {
      wheelchairAccess: { type: Boolean, default: false },
      hearingImpaired: { type: Boolean, default: false },
      visuallyImpaired: { type: Boolean, default: false }
    }
  },
  loyaltyProgram: {
    membershipLevel: { 
      type: String, 
      enum: ['Bronze', 'Silver', 'Gold', 'Platinum'], 
      default: 'Bronze' 
    },
    points: { type: Number, default: 0, min: 0 },
    memberSince: { type: Date, default: Date.now }
  },
  emergencyContact: {
    name: { type: String, trim: true },
    relationship: { type: String, trim: true },
    phone: { 
      type: String, 
      trim: true,
      match: [/^\+?[\d\s-()]+$/, 'Please enter a valid emergency contact phone number']
    }
  },
  isActive: { type: Boolean, default: true },
  isGuest: { type: Boolean, default: false },
  lastLogin: { type: Date },
  profileImage: { type: String }, // URL to profile image
  verificationStatus: {
    email: { type: Boolean, default: false },
    phone: { type: Boolean, default: false },
    identity: { type: Boolean, default: false }
  }
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

// Indexes for better performance
userSchema.index({ email: 1 });
userSchema.index({ clerkId: 1 });
userSchema.index({ 'loyaltyProgram.membershipLevel': 1 });

// Virtual for full name
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Virtual for bookings
userSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'user'
});

// Instance method to calculate loyalty points
userSchema.methods.addLoyaltyPoints = function(points) {
  this.loyaltyProgram.points += points;
  
  // Update membership level based on points
  if (this.loyaltyProgram.points >= 10000) {
    this.loyaltyProgram.membershipLevel = 'Platinum';
  } else if (this.loyaltyProgram.points >= 5000) {
    this.loyaltyProgram.membershipLevel = 'Gold';
  } else if (this.loyaltyProgram.points >= 1000) {
    this.loyaltyProgram.membershipLevel = 'Silver';
  }
  
  return this.save();
};

// Instance method to get discount percentage based on membership
userSchema.methods.getDiscountPercentage = function() {
  const discounts = {
    Bronze: 0,
    Silver: 5,
    Gold: 10,
    Platinum: 15
  };
  return discounts[this.loyaltyProgram.membershipLevel] || 0;
};

// Static method to find users by membership level
userSchema.statics.findByMembershipLevel = function(level) {
  return this.find({ 'loyaltyProgram.membershipLevel': level, isActive: true });
};

// Pre-save middleware to update lastLogin
userSchema.pre('save', function(next) {
  if (this.isNew) {
    this.lastLogin = new Date();
  }
  next();
});

// Pre-remove middleware to handle cascading deletes
userSchema.pre('remove', async function(next) {
  try {
    // Remove all bookings for this user
    await this.model('Booking').deleteMany({ user: this._id });
    next();
  } catch (error) {
    next(error);
  }
});

module.exports = mongoose.model('User', userSchema);