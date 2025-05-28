const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const orderController = require('../controllers/orderController');
const paymentController = require('../controllers/paymentController');

const router = express.Router();

// Protect all routes and authorize only deliverer
router.use(protect, authorize('deliverer'));

// Deliverer dashboard
router.get('/dashboard', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Deliverer dashboard data'
  });
});

// Get assigned orders
router.get('/orders', orderController.getOrders);
router.get('/orders/:id', orderController.getOrder);
router.put('/orders/:id/status', orderController.updateOrderStatus);

// Mark cash on delivery as paid
router.put('/payment/cod/:paymentId', paymentController.markCashPaymentAsPaid);

module.exports = router;