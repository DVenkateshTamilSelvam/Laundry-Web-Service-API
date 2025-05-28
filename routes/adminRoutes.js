const express = require('express');
const { protect, authorize } = require('../middleware/auth');

// Import controllers for admin routes
const packageController = require('../controllers/packageController');
const userController = require('../controllers/userController');
const orderController = require('../controllers/orderController');
const feedbackController = require('../controllers/feedbackController');
const blogController = require('../controllers/blogController');

const router = express.Router();

// Protect all routes and authorize only admin
router.use(protect, authorize('admin'));

// Admin dashboard stats
router.get('/dashboard', (req, res) => {
  // This would typically fetch various statistics
  res.status(200).json({
    success: true,
    message: 'Admin dashboard data'
  });
});

// Admin package management routes
router.get('/packages', packageController.getPackages);
router.post('/packages', packageController.createPackage);
router.put('/packages/:id', packageController.updatePackage);
router.delete('/packages/:id', packageController.deletePackage);

// Admin customer management routes
router.get('/customers', userController.getUsers);
router.get('/customers/:id', userController.getUser);

// Admin order management routes
router.get('/orders', orderController.getOrders);
router.get('/orders/:id', orderController.getOrder);
router.put('/orders/:id/status', orderController.updateOrderStatus);
router.put('/orders/:id/assign-worker', orderController.assignWorker);
router.put('/orders/:id/assign-deliverer', orderController.assignDeliverer);

// Admin feedback management routes
router.get('/feedback', feedbackController.getAllFeedback);
router.put('/feedback/:id/respond', feedbackController.respondToFeedback);

// Admin blog management routes
router.get('/blogs', blogController.getBlogs);
router.post('/blogs', blogController.createBlog);
router.put('/blogs/:id', blogController.updateBlog);
router.delete('/blogs/:id', blogController.deleteBlog);

module.exports = router;