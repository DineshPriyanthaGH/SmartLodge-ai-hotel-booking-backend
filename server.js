// Emergency server.js - Bulletproof version for Vercel deployment
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5000;

console.log('🚀 Starting bulletproof server...');
console.log('Environment:', process.env.NODE_ENV);
console.log('Port:', PORT);

// EMERGENCY CORS - ALLOW EVERYTHING
app.use(cors({
  origin: true, // Allow all origins
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'HEAD'],
  allowedHeaders: ['*'],
  optionsSuccessStatus: 200
}));

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

// Catch all API routes
app.get('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found',
    endpoint: req.path,
    availableEndpoints: ['/health', '/api/test', '/api/hotels', '/api/hotels/:id']
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