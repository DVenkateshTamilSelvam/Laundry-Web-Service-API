const express = require('express');
const { protect, authorize } = require('../middleware/auth');
const orderController = require('../controllers/orderController');
const userController = require('../controllers/userController');

const router = express.Router();

// Protect all routes and authorize only manager
router.use(protect, authorize('manager'));

// Manager dashboard
router.get('/dashboard', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Manager dashboard data'
  });
});

// Order management
router.get('/orders', orderController.getOrders);
router.get('/orders/:id', orderController.getOrder);
router.put('/orders/:id/status', orderController.updateOrderStatus);
router.put('/orders/:id/assign-worker', orderController.assignWorker);
router.put('/orders/:id/assign-deliverer', orderController.assignDeliverer);

// Staff management (limited to workers and deliverers)
router.get('/staff', async (req, res, next) => {
  try {
    const staff = await userController.getUsers.find({
      role: { $in: ['worker', 'deliverer'] }
    });
    
    res.status(200).json({
      success: true,
      count: staff.length,
      data: staff
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;