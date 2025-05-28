const Cart = require('../models/Cart');
const Package = require('../models/Package');

// @desc    Get user cart
// @route   GET /api/cart
// @access  Private
exports.getCart = async (req, res, next) => {
  try {
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.package');
    
    if (!cart) {
      // Create empty cart if none exists
      cart = await Cart.create({
        user: req.user.id,
        items: []
      });
      
      cart = await Cart.findOne({ user: req.user.id }).populate('items.package');
    }
    
    // Calculate total
    const totalAmount = cart.items.reduce((acc, item) => {
      return acc + (item.package.price * item.quantity);
    }, 0);
    
    res.status(200).json({
      success: true,
      data: {
        cart,
        totalAmount
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Add item to cart
// @route   POST /api/cart
// @access  Private
exports.addToCart = async (req, res, next) => {
  try {
    const { packageId, quantity = 1 } = req.body;
    
    // Check if package exists
    const package = await Package.findById(packageId);
    
    if (!package) {
      return res.status(404).json({
        success: false,
        error: 'Package not found'
      });
    }
    
    // Find user's cart
    let cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      // Create new cart if none exists
      cart = await Cart.create({
        user: req.user.id,
        items: [{ package: packageId, quantity }]
      });
    } else {
      // Check if item already exists in cart
      const itemIndex = cart.items.findIndex(
        item => item.package.toString() === packageId
      );
      
      if (itemIndex > -1) {
        // Update quantity if item exists
        cart.items[itemIndex].quantity += quantity;
      } else {
        // Add new item
        cart.items.push({ package: packageId, quantity });
      }
      
      await cart.save();
    }
    
    // Get updated cart with populated package details
    cart = await Cart.findOne({ user: req.user.id }).populate('items.package');
    
    // Calculate total
    const totalAmount = cart.items.reduce((acc, item) => {
      return acc + (item.package.price * item.quantity);
    }, 0);
    
    res.status(200).json({
      success: true,
      data: {
        cart,
        totalAmount
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update cart item
// @route   PUT /api/cart/:packageId
// @access  Private
exports.updateCartItem = async (req, res, next) => {
  try {
    const { quantity } = req.body;
    const packageId = req.params.packageId;
    
    if (quantity < 1) {
      return res.status(400).json({
        success: false,
        error: 'Quantity must be at least 1'
      });
    }
    
    // Find user's cart
    let cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }
    
    // Find item index
    const itemIndex = cart.items.findIndex(
      item => item.package.toString() === packageId
    );
    
    if (itemIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Item not found in cart'
      });
    }
    
    // Update quantity
    cart.items[itemIndex].quantity = quantity;
    
    await cart.save();
    
    // Get updated cart with populated package details
    cart = await Cart.findOne({ user: req.user.id }).populate('items.package');
    
    // Calculate total
    const totalAmount = cart.items.reduce((acc, item) => {
      return acc + (item.package.price * item.quantity);
    }, 0);
    
    res.status(200).json({
      success: true,
      data: {
        cart,
        totalAmount
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Remove item from cart
// @route   DELETE /api/cart/:packageId
// @access  Private
exports.removeFromCart = async (req, res, next) => {
  try {
    const packageId = req.params.packageId;
    
    // Find user's cart
    let cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }
    
    // Remove item
    cart.items = cart.items.filter(
      item => item.package.toString() !== packageId
    );
    
    await cart.save();
    
    // Get updated cart with populated package details
    cart = await Cart.findOne({ user: req.user.id }).populate('items.package');
    
    // Calculate total
    const totalAmount = cart.items.reduce((acc, item) => {
      return acc + (item.package.price * item.quantity);
    }, 0);
    
    res.status(200).json({
      success: true,
      data: {
        cart,
        totalAmount
      }
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Clear cart
// @route   DELETE /api/cart
// @access  Private
exports.clearCart = async (req, res, next) => {
  try {
    // Find user's cart
    const cart = await Cart.findOne({ user: req.user.id });
    
    if (!cart) {
      return res.status(404).json({
        success: false,
        error: 'Cart not found'
      });
    }
    
    // Clear items
    cart.items = [];
    
    await cart.save();
    
    res.status(200).json({
      success: true,
      data: {
        cart,
        totalAmount: 0
      }
    });
  } catch (err) {
    next(err);
  }
};