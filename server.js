// Emergency server.js - Bulletproof version for Vercel deployment with Admin Panel
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 Starting bulletproof server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', PORT);

// EMERGENCY CORS - ALLOW EVERYTHING
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:3000',
  process.env.FRONTEND_URL,
  'https://smart-lodge-ai-hotel-booking-fronte.vercel.app',
  'https://ai-hotel-booking-frontend.vercel.app',
  'https://smartlodge-ai-hotel-booking.vercel.app',
  'https://smart-lodge-ai-hotel-booking.vercel.app',
  'https://smartlodge-ai-hotel-booking-frontend.vercel.app',
  'https://smart-lodge-ai-hotel-booking-frontend.vercel.app'
].filter(Boolean); // Remove undefined values

// Ultra-permissive CORS for Vercel deployment
app.use((req, res, next) => {
  const origin = req.headers.origin;
  res.header('Access-Control-Allow-Origin', origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.indexOf(origin) !== -1 || origin.includes('vercel.app')) {
      return callback(null, true);
    }
    
    return callback(null, true); // Allow all for now
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
  optionsSuccessStatus: 200
}));

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, HEAD, PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.sendStatus(200);
});

// Parse JSON with error handling
app.use((req, res, next) => {
  express.json({ limit: '10mb' })(req, res, (err) => {
    if (err) {
      console.error('JSON parsing error:', err);
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid JSON',
        message: 'Request body contains invalid JSON'
      });
    }
    next();
  });
});

app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Request logging
app.use((req, res, next) => {
  console.log(`📝 ${req.method} ${req.path} - Origin: ${req.headers.origin || 'none'}`);
  next();
});

// ==============================================
// ADMIN AUTHENTICATION & MIDDLEWARE
// ==============================================

// Admin credentials (in production, store in secure database)
const ADMIN_CREDENTIALS = {
  username: process.env.ADMIN_USERNAME || 'admin',
  passwordHash: bcrypt.hashSync(process.env.ADMIN_PASSWORD || 'SmartLodge@Admin2024!', 10)
};

// Admin authentication middleware
const authenticateAdmin = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Admin access denied. No token provided.'
      });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET || 'super-secret-admin-jwt-key');
    
    if (decoded.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin access denied. Invalid role.'
      });
    }

    req.admin = decoded;
    next();
  } catch (error) {
    console.error('Admin auth error:', error);
    res.status(401).json({
      success: false,
      message: 'Admin access denied. Invalid token.',
      error: error.message
    });
  }
};

// ==============================================
// DATA STORAGE (Mock Database)
// ==============================================

// In-memory storage (in production, use MongoDB)
let adminData = {
  hotels: [
    {
      _id: 'hotel_1',
      name: 'Grand Luxury Hotel',
      location: { 
        city: 'New York', 
        state: 'NY',
        country: 'USA',
        address: '123 Luxury Avenue',
        zipCode: '10001'
      },
      rating: { 
        overall: 4.8,
        reviewCount: 256
      },
      pricing: { 
        basePrice: 299,
        currency: 'USD'
      },
      images: [{
        url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500',
        alt: 'Luxury Hotel Exterior'
      }],
      amenities: [
        { name: 'Free WiFi', icon: 'wifi' },
        { name: 'Swimming Pool', icon: 'pool' },
        { name: 'Spa & Wellness', icon: 'spa' },
        { name: 'Restaurant', icon: 'restaurant' },
        { name: 'Gym', icon: 'fitness' }
      ],
      description: 'Experience luxury at its finest in the heart of New York City.',
      featured: true,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'hotel_2',
      name: 'Cozy Boutique Inn',
      location: { 
        city: 'San Francisco', 
        state: 'CA',
        country: 'USA',
        address: '456 Boutique Street',
        zipCode: '94102'
      },
      rating: { 
        overall: 4.5,
        reviewCount: 128
      },
      pricing: { 
        basePrice: 189,
        currency: 'USD'
      },
      images: [{
        url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=500',
        alt: 'Boutique Hotel Room'
      }],
      amenities: [
        { name: 'Free WiFi', icon: 'wifi' },
        { name: 'Pet Friendly', icon: 'pet' },
        { name: 'Breakfast', icon: 'breakfast' },
        { name: 'Business Center', icon: 'business' }
      ],
      description: 'A charming boutique experience in the heart of San Francisco.',
      featured: false,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'hotel_3',
      name: 'Beach Resort Paradise',
      location: { 
        city: 'Miami', 
        state: 'FL',
        country: 'USA',
        address: '789 Ocean Drive',
        zipCode: '33139'
      },
      rating: { 
        overall: 4.9,
        reviewCount: 412
      },
      pricing: { 
        basePrice: 399,
        currency: 'USD'
      },
      images: [{
        url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500',
        alt: 'Beach Resort View'
      }],
      amenities: [
        { name: 'Beach Access', icon: 'beach' },
        { name: 'Multiple Pools', icon: 'pool' },
        { name: 'Water Sports', icon: 'sports' },
        { name: 'Spa', icon: 'spa' },
        { name: 'Fine Dining', icon: 'restaurant' }
      ],
      description: 'Tropical paradise with pristine beaches and world-class amenities.',
      featured: true,
      status: 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  rooms: [
    {
      _id: 'room_1',
      hotelId: 'hotel_1',
      roomNumber: '101',
      type: 'Deluxe Suite',
      capacity: { adults: 2, children: 1 },
      pricing: { 
        basePrice: 299,
        currency: 'USD'
      },
      amenities: ['King Bed', 'City View', 'Mini Bar', 'Safe'],
      size: '45 sqm',
      description: 'Luxurious suite with stunning city views',
      images: ['https://images.unsplash.com/photo-1631049307264-da0ec9d70304?w=500'],
      status: 'available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'room_2',
      hotelId: 'hotel_1',
      roomNumber: '201',
      type: 'Standard Room',
      capacity: { adults: 2, children: 0 },
      pricing: { 
        basePrice: 199,
        currency: 'USD'
      },
      amenities: ['Queen Bed', 'WiFi', 'TV', 'AC'],
      size: '30 sqm',
      description: 'Comfortable standard room with modern amenities',
      images: ['https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=500'],
      status: 'available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'room_3',
      hotelId: 'hotel_2',
      roomNumber: '301',
      type: 'Boutique Room',
      capacity: { adults: 2, children: 1 },
      pricing: { 
        basePrice: 189,
        currency: 'USD'
      },
      amenities: ['Double Bed', 'Boutique Decor', 'Free Breakfast', 'Pet Friendly'],
      size: '35 sqm',
      description: 'Stylish boutique room with unique character',
      images: ['https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?w=500'],
      status: 'available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  bookings: [
    {
      _id: 'booking_1',
      hotelId: 'hotel_1',
      roomId: 'room_1',
      guestInfo: {
        name: 'John Doe',
        email: 'john.doe@example.com',
        phone: '+1-234-567-8900'
      },
      checkIn: '2024-11-01',
      checkOut: '2024-11-05',
      guests: { adults: 2, children: 1 },
      totalAmount: 1196, // 4 nights * 299
      currency: 'USD',
      status: 'confirmed',
      paymentStatus: 'paid',
      bookingDate: new Date().toISOString(),
      specialRequests: 'Late check-in requested',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      _id: 'booking_2',
      hotelId: 'hotel_2',
      roomId: 'room_3',
      guestInfo: {
        name: 'Jane Smith',
        email: 'jane.smith@example.com',
        phone: '+1-234-567-8901'
      },
      checkIn: '2024-10-25',
      checkOut: '2024-10-27',
      guests: { adults: 1, children: 0 },
      totalAmount: 378, // 2 nights * 189
      currency: 'USD',
      status: 'confirmed',
      paymentStatus: 'paid',
      bookingDate: new Date().toISOString(),
      specialRequests: '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ]
};

// Helper function to generate IDs
const generateId = (type) => {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `${type}_${timestamp}_${random}`;
};

// Emergency error handler - prevent crashes
app.use((err, req, res, next) => {
  console.error('💥 Server Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal Server Error',
    message: 'Something went wrong, but server is still running',
    timestamp: new Date().toISOString()
  });
});

// BULLETPROOF ENDPOINTS

// Health check - always works
app.get('/health', (req, res) => {
  try {
    res.status(200).json({
      status: 'OK',
      message: 'Server is running perfectly!',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      cors: 'All origins allowed',
      environment: process.env.NODE_ENV || 'development',
      version: '2.0.0-emergency'
    });
  } catch (error) {
    console.error('Health check error:', error);
    res.status(200).json({
      status: 'ERROR_BUT_RUNNING',
      message: 'Server has issues but is still alive',
      error: error.message
    });
  }
});

// Test endpoint
app.get('/api/test', (req, res) => {
  try {
    res.json({
      success: true,
      message: 'API is working! CORS is fixed!',
      origin: req.headers.origin,
      timestamp: new Date().toISOString(),
      headers: {
        'user-agent': req.headers['user-agent'],
        'origin': req.headers.origin,
        'referer': req.headers.referer
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Emergency hotels endpoint with mock data
app.get('/api/hotels', (req, res) => {
  try {
    console.log('🏨 Hotels endpoint called');
    
    // Return mock data to verify CORS is working
    const mockHotels = [
      {
        _id: 'hotel_1',
        name: 'Grand Luxury Hotel',
        location: { 
          city: 'New York', 
          state: 'NY',
          country: 'USA',
          address: '123 Luxury Avenue'
        },
        rating: { 
          overall: 4.8,
          reviewCount: 256
        },
        pricing: { 
          basePrice: 299,
          currency: 'USD'
        },
        images: [{
          url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500',
          alt: 'Luxury Hotel Exterior'
        }],
        amenities: [
          { name: 'Free WiFi', icon: 'wifi' },
          { name: 'Swimming Pool', icon: 'pool' },
          { name: 'Spa & Wellness', icon: 'spa' },
          { name: 'Restaurant', icon: 'restaurant' },
          { name: 'Gym', icon: 'fitness' }
        ],
        description: 'Experience luxury at its finest in the heart of New York City.',
        featured: true,
        status: 'active'
      },
      {
        _id: 'hotel_2',
        name: 'Cozy Boutique Inn',
        location: { 
          city: 'San Francisco', 
          state: 'CA',
          country: 'USA',
          address: '456 Boutique Street'
        },
        rating: { 
          overall: 4.5,
          reviewCount: 128
        },
        pricing: { 
          basePrice: 189,
          currency: 'USD'
        },
        images: [{
          url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=500',
          alt: 'Boutique Hotel Room'
        }],
        amenities: [
          { name: 'Free WiFi', icon: 'wifi' },
          { name: 'Pet Friendly', icon: 'pet' },
          { name: 'Breakfast', icon: 'breakfast' },
          { name: 'Business Center', icon: 'business' }
        ],
        description: 'A charming boutique experience in the heart of San Francisco.',
        featured: false,
        status: 'active'
      },
      {
        _id: 'hotel_3',
        name: 'Beach Resort Paradise',
        location: { 
          city: 'Miami', 
          state: 'FL',
          country: 'USA',
          address: '789 Ocean Drive'
        },
        rating: { 
          overall: 4.9,
          reviewCount: 412
        },
        pricing: { 
          basePrice: 399,
          currency: 'USD'
        },
        images: [{
          url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500',
          alt: 'Beach Resort View'
        }],
        amenities: [
          { name: 'Beach Access', icon: 'beach' },
          { name: 'Multiple Pools', icon: 'pool' },
          { name: 'Water Sports', icon: 'sports' },
          { name: 'Spa', icon: 'spa' },
          { name: 'Fine Dining', icon: 'restaurant' }
        ],
        description: 'Tropical paradise with pristine beaches and world-class amenities.',
        featured: true,
        status: 'active'
      }
    ];

    res.status(200).json({
      success: true,
      message: 'Hotels loaded successfully! CORS is working!',
      data: {
        hotels: mockHotels,
        pagination: {
          current: 1,
          pages: 1,
          total: mockHotels.length
        }
      },
      metadata: {
        source: 'emergency-mock-data',
        timestamp: new Date().toISOString(),
        cors_status: 'fixed'
      }
    });
    
  } catch (error) {
    console.error('Hotels endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Hotels endpoint failed, but server is stable'
    });
  }
});

// Get individual hotel by ID
app.get('/api/hotels/:id', (req, res) => {
  try {
    console.log(`🏨 Individual hotel endpoint called for ID: ${req.params.id}`);
    
    const hotelId = req.params.id;
    
    // Mock data - same as above but for individual lookup
    const mockHotels = [
      {
        _id: 'hotel_1',
        name: 'Grand Luxury Hotel',
        location: { 
          city: 'New York', 
          state: 'NY',
          country: 'USA',
          address: '123 Luxury Avenue'
        },
        rating: { 
          overall: 4.8,
          reviewCount: 256
        },
        pricing: { 
          basePrice: 299,
          currency: 'USD'
        },
        images: [{
          url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=500',
          alt: 'Luxury Hotel Exterior'
        }],
        amenities: [
          { name: 'Free WiFi', icon: 'wifi' },
          { name: 'Swimming Pool', icon: 'pool' },
          { name: 'Spa & Wellness', icon: 'spa' },
          { name: 'Restaurant', icon: 'restaurant' },
          { name: 'Gym', icon: 'fitness' }
        ],
        description: 'Experience luxury at its finest in the heart of New York City.',
        featured: true,
        status: 'active'
      },
      {
        _id: 'hotel_2',
        name: 'Cozy Boutique Inn',
        location: { 
          city: 'San Francisco', 
          state: 'CA',
          country: 'USA',
          address: '456 Boutique Street'
        },
        rating: { 
          overall: 4.5,
          reviewCount: 128
        },
        pricing: { 
          basePrice: 189,
          currency: 'USD'
        },
        images: [{
          url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=500',
          alt: 'Boutique Hotel Room'
        }],
        amenities: [
          { name: 'Free WiFi', icon: 'wifi' },
          { name: 'Pet Friendly', icon: 'pet' },
          { name: 'Breakfast', icon: 'breakfast' },
          { name: 'Business Center', icon: 'business' }
        ],
        description: 'A charming boutique experience in the heart of San Francisco.',
        featured: false,
        status: 'active'
      },
      {
        _id: 'hotel_3',
        name: 'Beach Resort Paradise',
        location: { 
          city: 'Miami', 
          state: 'FL',
          country: 'USA',
          address: '789 Ocean Drive'
        },
        rating: { 
          overall: 4.9,
          reviewCount: 412
        },
        pricing: { 
          basePrice: 399,
          currency: 'USD'
        },
        images: [{
          url: 'https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=500',
          alt: 'Beach Resort View'
        }],
        amenities: [
          { name: 'Beach Access', icon: 'beach' },
          { name: 'Multiple Pools', icon: 'pool' },
          { name: 'Water Sports', icon: 'sports' },
          { name: 'Spa', icon: 'spa' },
          { name: 'Fine Dining', icon: 'restaurant' }
        ],
        description: 'Tropical paradise with pristine beaches and world-class amenities.',
        featured: true,
        status: 'active'
      }
    ];

    // Find hotel by ID
    const hotel = mockHotels.find(h => h._id === hotelId);
    
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: `Hotel with ID '${hotelId}' not found`,
        availableIds: mockHotels.map(h => h._id)
      });
    }

    res.status(200).json({
      success: true,
      message: `Hotel '${hotel.name}' loaded successfully!`,
      data: {
        hotel: hotel
      },
      metadata: {
        source: 'emergency-mock-data',
        timestamp: new Date().toISOString(),
        hotelId: hotelId
      }
    });
    
  } catch (error) {
    console.error('Individual hotel endpoint error:', error);
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Hotel details endpoint failed, but server is stable'
    });
  }
});

// ==============================================
// ADMIN AUTHENTICATION ENDPOINTS
// ==============================================

// Admin login
app.post('/admin/login', async (req, res) => {
  try {
    console.log('🔐 Admin login attempt');
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required'
      });
    }

    // Verify credentials
    if (username !== ADMIN_CREDENTIALS.username) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    const isPasswordValid = await bcrypt.compare(password, ADMIN_CREDENTIALS.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        username: username,
        role: 'admin',
        loginTime: new Date().toISOString()
      },
      process.env.ADMIN_JWT_SECRET || 'super-secret-admin-jwt-key',
      { expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '24h' }
    );

    res.json({
      success: true,
      message: 'Admin login successful',
      data: {
        token: token,
        expiresIn: process.env.ADMIN_JWT_EXPIRES_IN || '24h',
        admin: {
          username: username,
          role: 'admin'
        }
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
});

// ==============================================
// ADMIN HOTEL MANAGEMENT ENDPOINTS
// ==============================================

// Get all hotels (Admin)
app.get('/admin/hotels', authenticateAdmin, (req, res) => {
  try {
    console.log('🏨 Admin: Get all hotels');
    
    const { page = 1, limit = 10, status, search } = req.query;
    let hotels = [...adminData.hotels];
    
    // Filter by status
    if (status) {
      hotels = hotels.filter(hotel => hotel.status === status);
    }
    
    // Search functionality
    if (search) {
      const searchLower = search.toLowerCase();
      hotels = hotels.filter(hotel => 
        hotel.name.toLowerCase().includes(searchLower) ||
        hotel.location.city.toLowerCase().includes(searchLower) ||
        hotel.location.state.toLowerCase().includes(searchLower)
      );
    }
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedHotels = hotels.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        hotels: paginatedHotels,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(hotels.length / limit),
          total: hotels.length,
          limit: parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Admin get hotels error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get single hotel (Admin)
app.get('/admin/hotels/:id', authenticateAdmin, (req, res) => {
  try {
    const hotel = adminData.hotels.find(h => h._id === req.params.id);
    
    if (!hotel) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }
    
    res.json({
      success: true,
      data: { hotel }
    });
    
  } catch (error) {
    console.error('Admin get hotel error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new hotel (Admin)
app.post('/admin/hotels', authenticateAdmin, (req, res) => {
  try {
    console.log('🏨 Admin: Create new hotel');
    
    const { name, location, rating, pricing, images, amenities, description, featured, status } = req.body;
    
    // Validation
    if (!name || !location || !pricing) {
      return res.status(400).json({
        success: false,
        message: 'Name, location, and pricing are required'
      });
    }
    
    const newHotel = {
      _id: generateId('hotel'),
      name,
      location: {
        city: location.city || '',
        state: location.state || '',
        country: location.country || 'USA',
        address: location.address || '',
        zipCode: location.zipCode || ''
      },
      rating: {
        overall: rating?.overall || 0,
        reviewCount: rating?.reviewCount || 0
      },
      pricing: {
        basePrice: pricing.basePrice || 0,
        currency: pricing.currency || 'USD'
      },
      images: images || [],
      amenities: amenities || [],
      description: description || '',
      featured: featured || false,
      status: status || 'active',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    adminData.hotels.push(newHotel);
    
    res.status(201).json({
      success: true,
      message: 'Hotel created successfully',
      data: { hotel: newHotel }
    });
    
  } catch (error) {
    console.error('Admin create hotel error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update hotel (Admin)
app.put('/admin/hotels/:id', authenticateAdmin, (req, res) => {
  try {
    console.log(`🏨 Admin: Update hotel ${req.params.id}`);
    
    const hotelIndex = adminData.hotels.findIndex(h => h._id === req.params.id);
    
    if (hotelIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }
    
    const currentHotel = adminData.hotels[hotelIndex];
    const updates = req.body;
    
    // Update hotel data
    adminData.hotels[hotelIndex] = {
      ...currentHotel,
      ...updates,
      _id: currentHotel._id, // Preserve ID
      createdAt: currentHotel.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Hotel updated successfully',
      data: { hotel: adminData.hotels[hotelIndex] }
    });
    
  } catch (error) {
    console.error('Admin update hotel error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete hotel (Admin)
app.delete('/admin/hotels/:id', authenticateAdmin, (req, res) => {
  try {
    console.log(`🗑️ Admin: Delete hotel ${req.params.id}`);
    
    const hotelIndex = adminData.hotels.findIndex(h => h._id === req.params.id);
    
    if (hotelIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Hotel not found'
      });
    }
    
    // Also delete associated rooms and bookings
    adminData.rooms = adminData.rooms.filter(room => room.hotelId !== req.params.id);
    adminData.bookings = adminData.bookings.filter(booking => booking.hotelId !== req.params.id);
    
    const deletedHotel = adminData.hotels.splice(hotelIndex, 1)[0];
    
    res.json({
      success: true,
      message: 'Hotel and associated data deleted successfully',
      data: { deletedHotel }
    });
    
  } catch (error) {
    console.error('Admin delete hotel error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==============================================
// ADMIN ROOM MANAGEMENT ENDPOINTS
// ==============================================

// Get all rooms (Admin)
app.get('/admin/rooms', authenticateAdmin, (req, res) => {
  try {
    console.log('🛏️ Admin: Get all rooms');
    
    const { page = 1, limit = 10, hotelId, status, search } = req.query;
    let rooms = [...adminData.rooms];
    
    // Filter by hotel ID
    if (hotelId) {
      rooms = rooms.filter(room => room.hotelId === hotelId);
    }
    
    // Filter by status
    if (status) {
      rooms = rooms.filter(room => room.status === status);
    }
    
    // Search functionality
    if (search) {
      const searchLower = search.toLowerCase();
      rooms = rooms.filter(room => 
        room.roomNumber.toLowerCase().includes(searchLower) ||
        room.type.toLowerCase().includes(searchLower)
      );
    }
    
    // Add hotel information to each room
    rooms = rooms.map(room => {
      const hotel = adminData.hotels.find(h => h._id === room.hotelId);
      return {
        ...room,
        hotel: hotel ? { _id: hotel._id, name: hotel.name, location: hotel.location } : null
      };
    });
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedRooms = rooms.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        rooms: paginatedRooms,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(rooms.length / limit),
          total: rooms.length,
          limit: parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Admin get rooms error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get single room (Admin)
app.get('/admin/rooms/:id', authenticateAdmin, (req, res) => {
  try {
    const room = adminData.rooms.find(r => r._id === req.params.id);
    
    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    // Add hotel information
    const hotel = adminData.hotels.find(h => h._id === room.hotelId);
    const roomWithHotel = {
      ...room,
      hotel: hotel ? { _id: hotel._id, name: hotel.name, location: hotel.location } : null
    };
    
    res.json({
      success: true,
      data: { room: roomWithHotel }
    });
    
  } catch (error) {
    console.error('Admin get room error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new room (Admin)
app.post('/admin/rooms', authenticateAdmin, (req, res) => {
  try {
    console.log('🛏️ Admin: Create new room');
    
    const { hotelId, roomNumber, type, capacity, pricing, amenities, size, description, images, status } = req.body;
    
    // Validation
    if (!hotelId || !roomNumber || !type || !capacity || !pricing) {
      return res.status(400).json({
        success: false,
        message: 'Hotel ID, room number, type, capacity, and pricing are required'
      });
    }
    
    // Check if hotel exists
    const hotel = adminData.hotels.find(h => h._id === hotelId);
    if (!hotel) {
      return res.status(400).json({
        success: false,
        message: 'Hotel not found'
      });
    }
    
    // Check if room number already exists in this hotel
    const existingRoom = adminData.rooms.find(r => r.hotelId === hotelId && r.roomNumber === roomNumber);
    if (existingRoom) {
      return res.status(400).json({
        success: false,
        message: 'Room number already exists in this hotel'
      });
    }
    
    const newRoom = {
      _id: generateId('room'),
      hotelId,
      roomNumber,
      type,
      capacity: {
        adults: capacity.adults || 1,
        children: capacity.children || 0
      },
      pricing: {
        basePrice: pricing.basePrice || 0,
        currency: pricing.currency || 'USD'
      },
      amenities: amenities || [],
      size: size || '',
      description: description || '',
      images: images || [],
      status: status || 'available',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    adminData.rooms.push(newRoom);
    
    res.status(201).json({
      success: true,
      message: 'Room created successfully',
      data: { room: newRoom }
    });
    
  } catch (error) {
    console.error('Admin create room error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update room (Admin)
app.put('/admin/rooms/:id', authenticateAdmin, (req, res) => {
  try {
    console.log(`🛏️ Admin: Update room ${req.params.id}`);
    
    const roomIndex = adminData.rooms.findIndex(r => r._id === req.params.id);
    
    if (roomIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    const currentRoom = adminData.rooms[roomIndex];
    const updates = req.body;
    
    // If room number is being updated, check for conflicts
    if (updates.roomNumber && updates.roomNumber !== currentRoom.roomNumber) {
      const existingRoom = adminData.rooms.find(r => 
        r.hotelId === currentRoom.hotelId && 
        r.roomNumber === updates.roomNumber &&
        r._id !== req.params.id
      );
      if (existingRoom) {
        return res.status(400).json({
          success: false,
          message: 'Room number already exists in this hotel'
        });
      }
    }
    
    // Update room data
    adminData.rooms[roomIndex] = {
      ...currentRoom,
      ...updates,
      _id: currentRoom._id, // Preserve ID
      createdAt: currentRoom.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Room updated successfully',
      data: { room: adminData.rooms[roomIndex] }
    });
    
  } catch (error) {
    console.error('Admin update room error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete room (Admin)
app.delete('/admin/rooms/:id', authenticateAdmin, (req, res) => {
  try {
    console.log(`🗑️ Admin: Delete room ${req.params.id}`);
    
    const roomIndex = adminData.rooms.findIndex(r => r._id === req.params.id);
    
    if (roomIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    // Also delete associated bookings
    adminData.bookings = adminData.bookings.filter(booking => booking.roomId !== req.params.id);
    
    const deletedRoom = adminData.rooms.splice(roomIndex, 1)[0];
    
    res.json({
      success: true,
      message: 'Room and associated bookings deleted successfully',
      data: { deletedRoom }
    });
    
  } catch (error) {
    console.error('Admin delete room error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==============================================
// ADMIN BOOKING MANAGEMENT ENDPOINTS
// ==============================================

// Get all bookings (Admin)
app.get('/admin/bookings', authenticateAdmin, (req, res) => {
  try {
    console.log('📅 Admin: Get all bookings');
    
    const { page = 1, limit = 10, hotelId, status, paymentStatus, search } = req.query;
    let bookings = [...adminData.bookings];
    
    // Filter by hotel ID
    if (hotelId) {
      bookings = bookings.filter(booking => booking.hotelId === hotelId);
    }
    
    // Filter by status
    if (status) {
      bookings = bookings.filter(booking => booking.status === status);
    }
    
    // Filter by payment status
    if (paymentStatus) {
      bookings = bookings.filter(booking => booking.paymentStatus === paymentStatus);
    }
    
    // Search functionality
    if (search) {
      const searchLower = search.toLowerCase();
      bookings = bookings.filter(booking => 
        booking.guestInfo.name.toLowerCase().includes(searchLower) ||
        booking.guestInfo.email.toLowerCase().includes(searchLower) ||
        booking._id.toLowerCase().includes(searchLower)
      );
    }
    
    // Add hotel and room information to each booking
    bookings = bookings.map(booking => {
      const hotel = adminData.hotels.find(h => h._id === booking.hotelId);
      const room = adminData.rooms.find(r => r._id === booking.roomId);
      return {
        ...booking,
        hotel: hotel ? { _id: hotel._id, name: hotel.name, location: hotel.location } : null,
        room: room ? { _id: room._id, roomNumber: room.roomNumber, type: room.type } : null
      };
    });
    
    // Sort by booking date (newest first)
    bookings.sort((a, b) => new Date(b.bookingDate) - new Date(a.bookingDate));
    
    // Pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedBookings = bookings.slice(startIndex, endIndex);
    
    res.json({
      success: true,
      data: {
        bookings: paginatedBookings,
        pagination: {
          current: parseInt(page),
          pages: Math.ceil(bookings.length / limit),
          total: bookings.length,
          limit: parseInt(limit)
        }
      }
    });
    
  } catch (error) {
    console.error('Admin get bookings error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Get single booking (Admin)
app.get('/admin/bookings/:id', authenticateAdmin, (req, res) => {
  try {
    const booking = adminData.bookings.find(b => b._id === req.params.id);
    
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    // Add hotel and room information
    const hotel = adminData.hotels.find(h => h._id === booking.hotelId);
    const room = adminData.rooms.find(r => r._id === booking.roomId);
    const bookingWithDetails = {
      ...booking,
      hotel: hotel ? { _id: hotel._id, name: hotel.name, location: hotel.location } : null,
      room: room ? { _id: room._id, roomNumber: room.roomNumber, type: room.type } : null
    };
    
    res.json({
      success: true,
      data: { booking: bookingWithDetails }
    });
    
  } catch (error) {
    console.error('Admin get booking error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Create new booking (Admin)
app.post('/admin/bookings', authenticateAdmin, (req, res) => {
  try {
    console.log('📅 Admin: Create new booking');
    
    const { hotelId, roomId, guestInfo, checkIn, checkOut, guests, totalAmount, currency, status, paymentStatus, specialRequests } = req.body;
    
    // Validation
    if (!hotelId || !roomId || !guestInfo || !checkIn || !checkOut || !guests) {
      return res.status(400).json({
        success: false,
        message: 'Hotel ID, room ID, guest info, check-in, check-out, and guests are required'
      });
    }
    
    // Check if hotel exists
    const hotel = adminData.hotels.find(h => h._id === hotelId);
    if (!hotel) {
      return res.status(400).json({
        success: false,
        message: 'Hotel not found'
      });
    }
    
    // Check if room exists
    const room = adminData.rooms.find(r => r._id === roomId);
    if (!room) {
      return res.status(400).json({
        success: false,
        message: 'Room not found'
      });
    }
    
    // Validate dates
    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    if (checkInDate >= checkOutDate) {
      return res.status(400).json({
        success: false,
        message: 'Check-out date must be after check-in date'
      });
    }
    
    const newBooking = {
      _id: generateId('booking'),
      hotelId,
      roomId,
      guestInfo: {
        name: guestInfo.name || '',
        email: guestInfo.email || '',
        phone: guestInfo.phone || ''
      },
      checkIn,
      checkOut,
      guests: {
        adults: guests.adults || 1,
        children: guests.children || 0
      },
      totalAmount: totalAmount || 0,
      currency: currency || 'USD',
      status: status || 'confirmed',
      paymentStatus: paymentStatus || 'pending',
      bookingDate: new Date().toISOString(),
      specialRequests: specialRequests || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    adminData.bookings.push(newBooking);
    
    res.status(201).json({
      success: true,
      message: 'Booking created successfully',
      data: { booking: newBooking }
    });
    
  } catch (error) {
    console.error('Admin create booking error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Update booking (Admin)
app.put('/admin/bookings/:id', authenticateAdmin, (req, res) => {
  try {
    console.log(`📅 Admin: Update booking ${req.params.id}`);
    
    const bookingIndex = adminData.bookings.findIndex(b => b._id === req.params.id);
    
    if (bookingIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    const currentBooking = adminData.bookings[bookingIndex];
    const updates = req.body;
    
    // Validate dates if being updated
    if (updates.checkIn || updates.checkOut) {
      const checkInDate = new Date(updates.checkIn || currentBooking.checkIn);
      const checkOutDate = new Date(updates.checkOut || currentBooking.checkOut);
      if (checkInDate >= checkOutDate) {
        return res.status(400).json({
          success: false,
          message: 'Check-out date must be after check-in date'
        });
      }
    }
    
    // Update booking data
    adminData.bookings[bookingIndex] = {
      ...currentBooking,
      ...updates,
      _id: currentBooking._id, // Preserve ID
      createdAt: currentBooking.createdAt, // Preserve creation date
      updatedAt: new Date().toISOString()
    };
    
    res.json({
      success: true,
      message: 'Booking updated successfully',
      data: { booking: adminData.bookings[bookingIndex] }
    });
    
  } catch (error) {
    console.error('Admin update booking error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Delete booking (Admin)
app.delete('/admin/bookings/:id', authenticateAdmin, (req, res) => {
  try {
    console.log(`🗑️ Admin: Delete booking ${req.params.id}`);
    
    const bookingIndex = adminData.bookings.findIndex(b => b._id === req.params.id);
    
    if (bookingIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    
    const deletedBooking = adminData.bookings.splice(bookingIndex, 1)[0];
    
    res.json({
      success: true,
      message: 'Booking deleted successfully',
      data: { deletedBooking }
    });
    
  } catch (error) {
    console.error('Admin delete booking error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// ==============================================
// ADMIN DASHBOARD & STATISTICS
// ==============================================

// Admin dashboard statistics
app.get('/admin/dashboard', authenticateAdmin, (req, res) => {
  try {
    console.log('📊 Admin: Get dashboard statistics');
    
    // Calculate statistics
    const totalHotels = adminData.hotels.length;
    const activeHotels = adminData.hotels.filter(h => h.status === 'active').length;
    const totalRooms = adminData.rooms.length;
    const availableRooms = adminData.rooms.filter(r => r.status === 'available').length;
    const totalBookings = adminData.bookings.length;
    const confirmedBookings = adminData.bookings.filter(b => b.status === 'confirmed').length;
    const paidBookings = adminData.bookings.filter(b => b.paymentStatus === 'paid').length;
    
    // Revenue calculations
    const totalRevenue = adminData.bookings
      .filter(b => b.paymentStatus === 'paid')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    
    const pendingRevenue = adminData.bookings
      .filter(b => b.paymentStatus === 'pending')
      .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
    
    // Recent bookings (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const recentBookings = adminData.bookings.filter(b => 
      new Date(b.bookingDate) >= sevenDaysAgo
    ).length;
    
    // Top performing hotels by bookings
    const hotelBookings = {};
    adminData.bookings.forEach(booking => {
      if (hotelBookings[booking.hotelId]) {
        hotelBookings[booking.hotelId].count++;
        hotelBookings[booking.hotelId].revenue += booking.totalAmount || 0;
      } else {
        hotelBookings[booking.hotelId] = {
          count: 1,
          revenue: booking.totalAmount || 0
        };
      }
    });
    
    const topHotels = Object.entries(hotelBookings)
      .map(([hotelId, stats]) => {
        const hotel = adminData.hotels.find(h => h._id === hotelId);
        return {
          hotel: hotel ? { _id: hotel._id, name: hotel.name, location: hotel.location } : null,
          bookings: stats.count,
          revenue: stats.revenue
        };
      })
      .sort((a, b) => b.bookings - a.bookings)
      .slice(0, 5);
    
    // Monthly revenue trend (last 6 months)
    const monthlyRevenue = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
      const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const monthRevenue = adminData.bookings
        .filter(b => {
          const bookingDate = new Date(b.bookingDate);
          return bookingDate >= monthStart && bookingDate <= monthEnd && b.paymentStatus === 'paid';
        })
        .reduce((sum, b) => sum + (b.totalAmount || 0), 0);
      
      monthlyRevenue.push({
        month: date.toLocaleString('default', { month: 'short', year: 'numeric' }),
        revenue: monthRevenue
      });
    }
    
    res.json({
      success: true,
      data: {
        summary: {
          hotels: {
            total: totalHotels,
            active: activeHotels,
            inactive: totalHotels - activeHotels
          },
          rooms: {
            total: totalRooms,
            available: availableRooms,
            occupied: totalRooms - availableRooms
          },
          bookings: {
            total: totalBookings,
            confirmed: confirmedBookings,
            pending: totalBookings - confirmedBookings,
            recent: recentBookings
          },
          revenue: {
            total: totalRevenue,
            pending: pendingRevenue,
            currency: 'USD'
          }
        },
        analytics: {
          topHotels,
          monthlyRevenue
        },
        lastUpdated: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('Admin dashboard error:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Catch all admin routes
app.use('/admin/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Admin endpoint not found',
    endpoint: req.path,
    method: req.method,
    availableEndpoints: [
      'POST /admin/login',
      'GET /admin/dashboard',
      'GET /admin/hotels',
      'GET /admin/hotels/:id',
      'POST /admin/hotels',
      'PUT /admin/hotels/:id',
      'DELETE /admin/hotels/:id',
      'GET /admin/rooms',
      'GET /admin/rooms/:id',
      'POST /admin/rooms',
      'PUT /admin/rooms/:id',
      'DELETE /admin/rooms/:id',
      'GET /admin/bookings',
      'GET /admin/bookings/:id',
      'POST /admin/bookings',
      'PUT /admin/bookings/:id',
      'DELETE /admin/bookings/:id'
    ]
  });
});

// Catch all API routes
app.get('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    endpoint: req.path,
    availableEndpoints: [
      '/health', 
      '/api/test', 
      '/api/hotels', 
      '/api/hotels/:id',
      '/admin/login',
      '/admin/dashboard',
      '/admin/hotels',
      '/admin/hotels/:id',
      '/admin/rooms',
      '/admin/rooms/:id',
      '/admin/bookings',
      '/admin/bookings/:id'
    ]
  });
});

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'SmartLodge API is running!',
    version: '2.0.0-emergency',
    status: 'healthy',
    endpoints: {
      health: '/health',
      test: '/api/test',
      hotels: '/api/hotels'
    }
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Final error handler
app.use((err, req, res, next) => {
  console.error('💥 Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: 'Something went wrong',
    message: 'Server error occurred but is handled gracefully'
  });
});

// Start server
const server = app.listen(PORT, () => {
  console.log(`✅ Emergency server running on port ${PORT}`);
  console.log(`🌍 Health check: http://localhost:${PORT}/health`);
  console.log(`🧪 Test CORS: http://localhost:${PORT}/api/test`);
  console.log(`🏨 Hotels API: http://localhost:${PORT}/api/hotels`);
});

// Handle server shutdown gracefully
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

// Export for Vercel
module.exports = app;