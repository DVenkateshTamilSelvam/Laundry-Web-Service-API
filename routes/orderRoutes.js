const express = require('express');
const { 
  getOrders, 
  getOrder, 
  createOrder, 
  updateOrderStatus, 
  assignWorker, 
  assignDeliverer, 
  cancelOrder, 
  getOrderHistory 
} = require('../controllers/orderController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes for all authenticated users
router.post('/', createOrder);
router.get('/history', getOrderHistory);
router.put('/:id/cancel', cancelOrder);

// Routes for all staff roles
router.get('/', getOrders);
router.get('/:id', getOrder);
router.put('/:id/status', authorize('admin', 'manager', 'worker', 'deliverer'), updateOrderStatus);

// Routes for admin and manager only
router.put('/:id/assign-worker', authorize('admin', 'manager'), assignWorker);
router.put('/:id/assign-deliverer', authorize('admin', 'manager'), assignDeliverer);

module.exports = router;