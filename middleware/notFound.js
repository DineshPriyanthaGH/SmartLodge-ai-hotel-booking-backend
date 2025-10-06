// 404 Not Found middleware
const notFound = (req, res, next) => {
  const error = new Error(`Not found - ${req.originalUrl}`);
  error.statusCode = 404;
  
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found`,
    type: 'NotFoundError',
    availableRoutes: {
      auth: '/api/auth',
      hotels: '/api/hotels',
      bookings: '/api/bookings',
      users: '/api/users',
      payments: '/api/payments',
      health: '/health',
      documentation: '/api'
    }
  });
};

module.exports = notFound;