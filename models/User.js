const mongoose = require('mongoose');
const { Schema } = mongoose;
const userSchema = new Schema({
  clerkId: {
    type: String,
    unique: true,
    sparse: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function() {
      return !this.clerkId && !this.isGuest;
    },
    minLength: [6, 'Password must be at least 6 characters'],
    select: false
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
        if (!value) return true;
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
  role: {
    type: String,
    enum: ['user', 'admin', 'staff'],
    default: 'user'
  },
  isActive: { type: Boolean, default: true },
  isGuest: { type: Boolean, default: false },
  lastLogin: { type: Date },
  profileImage: { type: String },
  verificationStatus: {
    email: { type: Boolean, default: false },
    phone: { type: Boolean, default: false },
    identity: { type: Boolean, default: false }
  },
  resetPasswordToken: String,
  resetPasswordExpire: Date,
  emailVerificationToken: String,
  emailVerificationExpire: Date
}, {
  timestamps: true,
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});
userSchema.index({ 'loyaltyProgram.membershipLevel': 1 });
userSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});
userSchema.virtual('bookings', {
  ref: 'Booking',
  localField: '_id',
  foreignField: 'user'
});
userSchema.methods.addLoyaltyPoints = function(points) {
  this.loyaltyProgram.points += points;
  if (this.loyaltyProgram.points >= 10000) {
    this.loyaltyProgram.membershipLevel = 'Platinum';
  } else if (this.loyaltyProgram.points >= 5000) {
    this.loyaltyProgram.membershipLevel = 'Gold';
  } else if (this.loyaltyProgram.points >= 1000) {
    this.loyaltyProgram.membershipLevel = 'Silver';
  }
  return this.save();
};
userSchema.methods.getDiscountPercentage = function() {
  const discounts = {
    Bronze: 0,
    Silver: 5,
    Gold: 10,
    Platinum: 15
  };
  return discounts[this.loyaltyProgram.membershipLevel] || 0;
};
userSchema.statics.findByMembershipLevel = function(level) {
  return this.find({ 'loyaltyProgram.membershipLevel': level, isActive: true });
};
userSchema.pre('save', function(next) {
  if (this.isNew) {
    this.lastLogin = new Date();
  }
  next();
});
userSchema.pre('remove', async function(next) {
  try {
    await this.model('Booking').deleteMany({ user: this._id });
    next();
  } catch (error) {
    next(error);
  }
});
module.exports = mongoose.model('User', userSchema);
