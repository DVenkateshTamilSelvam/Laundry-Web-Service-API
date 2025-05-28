const express = require('express');
const { getCart, addToCart, updateCartItem, removeFromCart, clearCart } = require('../controllers/cartController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

router.get('/', getCart);
router.post('/', addToCart);
router.put('/:packageId', updateCartItem);
router.delete('/:packageId', removeFromCart);
router.delete('/', clearCart);

module.exports = router;