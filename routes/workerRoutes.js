const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const orderController = require('../controllers/orderController');

const router = express.Router();

// Protect all routes and authorize only worker
router.use(protect, authorize('worker'));

// Worker dashboard
router.get('/dashboard', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Worker dashboard data'
  });
});

// Get assigned orders
router.get('/orders', orderController.getOrders);
router.get('/orders/:id', orderController.getOrder);
router.put('/orders/:id/status', orderController.updateOrderStatus);

module.exports = router;