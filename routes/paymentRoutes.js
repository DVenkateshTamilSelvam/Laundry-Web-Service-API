const express = require('express');
const { processPayment, getPaymentByOrder, createCashOnDeliveryPayment } = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Payment routes
router.post('/process', processPayment);
router.post('/cod', createCashOnDeliveryPayment);
router.get('/order/:orderId', getPaymentByOrder);

module.exports = router;