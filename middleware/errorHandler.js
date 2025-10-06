const winston = require('winston');
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/error.log', level: 'error' })
  ]
});
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;
  logger.error(`${err.message}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query
  });
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = { message, statusCode: 404 };
  }
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue)[0];
    const message = `${field} already exists`;
    error = { message, statusCode: 400 };
  }
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(error => error.message).join(', ');
    error = { message, statusCode: 400 };
  }
  if (err.name === 'JsonWebTokenError') {
    const message = 'Invalid token';
    error = { message, statusCode: 401 };
  }
  if (err.name === 'TokenExpiredError') {
    const message = 'Token expired';
    error = { message, statusCode: 401 };
  }
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = 'File too large';
    error = { message, statusCode: 400 };
  }
  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    const message = 'Too many files or unexpected field name';
    error = { message, statusCode: 400 };
  }
  if (err.type === 'StripeCardError') {
    const message = 'Payment failed: ' + err.message;
    error = { message, statusCode: 400 };
  }
  if (err.type === 'StripeInvalidRequestError') {
    const message = 'Invalid payment request';
    error = { message, statusCode: 400 };
  }
  if (err.name === 'MongoNetworkError') {
    const message = 'Database connection error';
    error = { message, statusCode: 503 };
  }
  if (err.name === 'MongooseServerSelectionError') {
    const message = 'Database server unavailable';
    error = { message, statusCode: 503 };
  }
  if (err.statusCode === 429) {
    const message = 'Too many requests, please try again later';
    error = { message, statusCode: 429 };
  }
  const statusCode = error.statusCode || 500;
  const message = error.message || 'Server Error';
  const errorResponse = {
    success: false,
    message,
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      error: err
    })
  };
  if (statusCode === 400) {
    errorResponse.type = 'ValidationError';
  } else if (statusCode === 401) {
    errorResponse.type = 'AuthenticationError';
  } else if (statusCode === 403) {
    errorResponse.type = 'AuthorizationError';
  } else if (statusCode === 404) {
    errorResponse.type = 'NotFoundError';
  } else if (statusCode === 409) {
    errorResponse.type = 'ConflictError';
  } else if (statusCode === 429) {
    errorResponse.type = 'RateLimitError';
    errorResponse.retryAfter = 60; // seconds
  } else if (statusCode >= 500) {
    errorResponse.type = 'ServerError';
  }
  res.status(statusCode).json(errorResponse);
};
module.exports = errorHandler;
