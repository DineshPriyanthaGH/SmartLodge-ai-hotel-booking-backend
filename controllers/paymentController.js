const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Booking = require('../models/Booking');
const winston = require('winston');
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/payment.log' })
  ]
});
const createPaymentIntent = async (req, res, next) => {
  try {
    const { bookingId, amount, currency = 'usd' } = req.body;
    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return res.status(404).json({
        success: false,
        message: 'Booking not found'
      });
    }
    if (booking.user.toString() !== req.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert to cents
      currency,
      metadata: {
        bookingId: bookingId.toString(),
        userId: req.userId.toString()
      }
    });
    booking.payment.stripePaymentIntentId = paymentIntent.id;
    booking.payment.status = 'processing';
    await booking.save();
    logger.info(`Payment intent created: ${paymentIntent.id} for booking: ${bookingId}`);
    res.status(200).json({
      success: true,
      data: {
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id
      }
    });
  } catch (error) {
    next(error);
  }
};
const confirmPayment = async (req, res, next) => {
  try {
    const { paymentIntentId, bookingId } = req.body;
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    if (paymentIntent.status === 'succeeded') {
      const booking = await Booking.findById(bookingId);
      if (booking) {
        booking.payment.status = 'completed';
        booking.payment.paymentDate = new Date();
        booking.payment.transactionId = paymentIntent.id;
        booking.status = 'confirmed';
        booking.pricing.paidAmount = paymentIntent.amount / 100;
        await booking.save();
        logger.info(`Payment confirmed for booking: ${bookingId}`);
        res.status(200).json({
          success: true,
          message: 'Payment confirmed successfully',
          data: { booking }
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'Booking not found'
        });
      }
    } else {
      res.status(400).json({
        success: false,
        message: 'Payment not completed'
      });
    }
  } catch (error) {
    next(error);
  }
};
const getPaymentHistory = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const bookings = await Booking.find({ 
      user: req.userId,
      'payment.status': { $in: ['completed', 'refunded', 'partially-refunded'] }
    })
      .populate('hotel', 'name location')
      .sort({ 'payment.paymentDate': -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);
    const total = await Booking.countDocuments({ 
      user: req.userId,
      'payment.status': { $in: ['completed', 'refunded', 'partially-refunded'] }
    });
    res.status(200).json({
      success: true,
      data: {
        payments: bookings,
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
const processStripeWebhook = async (req, res, next) => {
  try {
    const sig = req.headers['stripe-signature'];
    const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
    } catch (err) {
      logger.error(`Webhook signature verification failed: ${err.message}`);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        const bookingId = paymentIntent.metadata.bookingId;
        if (bookingId) {
          await Booking.findByIdAndUpdate(bookingId, {
            'payment.status': 'completed',
            'payment.paymentDate': new Date(),
            'payment.transactionId': paymentIntent.id,
            'status': 'confirmed',
            'pricing.paidAmount': paymentIntent.amount / 100
          });
          logger.info(`Payment succeeded via webhook for booking: ${bookingId}`);
        }
        break;
      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        const failedBookingId = failedPayment.metadata.bookingId;
        if (failedBookingId) {
          await Booking.findByIdAndUpdate(failedBookingId, {
            'payment.status': 'failed'
          });
          logger.error(`Payment failed via webhook for booking: ${failedBookingId}`);
        }
        break;
      default:
        logger.info(`Unhandled event type: ${event.type}`);
    }
    res.json({ received: true });
  } catch (error) {
    next(error);
  }
};
const refundPayment = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Refund payment functionality to be implemented'
    });
  } catch (error) {
    next(error);
  }
};
const getPaymentById = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Get payment by ID functionality to be implemented'
    });
  } catch (error) {
    next(error);
  }
};
const getAllPayments = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Get all payments functionality to be implemented'
    });
  } catch (error) {
    next(error);
  }
};
const getPaymentStats = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Get payment stats functionality to be implemented'
    });
  } catch (error) {
    next(error);
  }
};
const createRefund = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Create refund functionality to be implemented'
    });
  } catch (error) {
    next(error);
  }
};
const getRefunds = async (req, res, next) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Get refunds functionality to be implemented'
    });
  } catch (error) {
    next(error);
  }
};
module.exports = {
  createPaymentIntent,
  confirmPayment,
  refundPayment,
  getPaymentHistory,
  getPaymentById,
  processStripeWebhook,
  getAllPayments,
  getPaymentStats,
  createRefund,
  getRefunds
};
