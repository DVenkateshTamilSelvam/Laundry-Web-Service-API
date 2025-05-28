const Payment = require('../models/Payment');
const Order = require('../models/Order');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// @desc    Process payment with Stripe
// @route   POST /api/payment/process
// @access  Private
exports.processPayment = async (req, res, next) => {
  try {
    const { orderId, paymentMethodId } = req.body;
    
    // Get order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Check if order belongs to user
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to process payment for this order'
      });
    }
    
    // Check if order is already paid
    if (order.paymentStatus === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Order is already paid'
      });
    }
    
    // Create payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(order.totalAmount * 100), // Stripe requires amount in cents
      currency: 'usd',
      payment_method: paymentMethodId,
      confirm: true,
      description: `Payment for Order ${order._id}`
    });
    
    // Create payment record
    const payment = await Payment.create({
      order: orderId,
      user: req.user.id,
      amount: order.totalAmount,
      paymentMethod: 'credit-card',
      status: 'successful',
      transactionId: paymentIntent.id,
      paymentGateway: 'stripe',
      paymentDetails: {
        cardLast4: paymentIntent.payment_method_details?.card?.last4 || '',
        cardBrand: paymentIntent.payment_method_details?.card?.brand || '',
        expiryMonth: paymentIntent.payment_method_details?.card?.exp_month?.toString() || '',
        expiryYear: paymentIntent.payment_method_details?.card?.exp_year?.toString() || ''
      }
    });
    
    // Update order payment status
    order.paymentStatus = 'paid';
    order.paymentId = payment._id;
    
    // If order was pending, update to confirmed
    if (order.status === 'pending') {
      order.status = 'confirmed';
      order.statusHistory.push({
        status: 'confirmed',
        timestamp: Date.now(),
        updatedBy: req.user.id
      });
    }
    
    await order.save();
    
    res.status(200).json({
      success: true,
      data: {
        payment,
        order
      }
    });
  } catch (err) {
    if (err.type === 'StripeCardError') {
      return res.status(400).json({
        success: false,
        error: err.message
      });
    }
    next(err);
  }
};

// @desc    Get payment by order ID
// @route   GET /api/payment/order/:orderId
// @access  Private
exports.getPaymentByOrder = async (req, res, next) => {
  try {
    const orderId = req.params.orderId;
    
    // Get order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Check if order belongs to user or user is admin
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view payment for this order'
      });
    }
    
    // Get payment
    const payment = await Payment.findOne({ order: orderId });
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found for this order'
      });
    }
    
    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create cash on delivery payment
// @route   POST /api/payment/cod
// @access  Private
exports.createCashOnDeliveryPayment = async (req, res, next) => {
  try {
    const { orderId } = req.body;
    
    // Get order
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Check if order belongs to user
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to process payment for this order'
      });
    }
    
    // Check if order is already paid
    if (order.paymentStatus !== 'pending') {
      return res.status(400).json({
        success: false,
        error: 'Payment status already updated for this order'
      });
    }
    
    // Create payment record
    const payment = await Payment.create({
      order: orderId,
      user: req.user.id,
      amount: order.totalAmount,
      paymentMethod: 'cash-on-delivery',
      status: 'pending',
      paymentGateway: 'cash'
    });
    
    // Update order payment method
    order.paymentMethod = 'cash-on-delivery';
    order.paymentId = payment._id;
    
    // If order was pending, update to confirmed
    if (order.status === 'pending') {
      order.status = 'confirmed';
      order.statusHistory.push({
        status: 'confirmed',
        timestamp: Date.now(),
        updatedBy: req.user.id
      });
    }
    
    await order.save();
    
    res.status(200).json({
      success: true,
      data: {
        payment,
        order
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Mark cash on delivery payment as paid
// @route   PUT /api/payment/cod/:paymentId
// @access  Private/Admin/Deliverer
exports.markCashPaymentAsPaid = async (req, res, next) => {
  try {
    const paymentId = req.params.paymentId;
    
    // Get payment
    const payment = await Payment.findById(paymentId);
    
    if (!payment) {
      return res.status(404).json({
        success: false,
        error: 'Payment not found'
      });
    }
    
    // Check if payment method is cash on delivery
    if (payment.paymentMethod !== 'cash-on-delivery') {
      return res.status(400).json({
        success: false,
        error: 'Only cash on delivery payments can be manually marked as paid'
      });
    }
    
    // Update payment status
    payment.status = 'successful';
    await payment.save();
    
    // Update order payment status
    const order = await Order.findById(payment.order);
    order.paymentStatus = 'paid';
    await order.save();
    
    res.status(200).json({
      success: true,
      data: payment
    });
  } catch (err) {
    next(err);
  }
};