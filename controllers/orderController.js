const Order = require('../models/Order');
const Cart = require('../models/Cart');
const User = require('../models/User');
const Package = require('../models/Package');

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
exports.getOrders = async (req, res, next) => {
  try {
    let query;
    
    // Different queries based on user role
    if (req.user.role === 'admin' || req.user.role === 'manager') {
      query = Order.find();
    } else if (req.user.role === 'worker') {
      query = Order.find({ assignedWorker: req.user.id });
    } else if (req.user.role === 'deliverer') {
      query = Order.find({ assignedDeliverer: req.user.id });
    } else {
      query = Order.find({ user: req.user.id });
    }
    
    // Add filters from query params
    if (req.query.status) {
      query = query.find({ status: req.query.status });
    }
    
    // Sorting
    if (req.query.sort) {
      const sortBy = req.query.sort.split(',').join(' ');
      query = query.sort(sortBy);
    } else {
      query = query.sort('-createdAt');
    }
    
    // Pagination
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 10;
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;
    const total = await Order.countDocuments(query);
    
    query = query.skip(startIndex).limit(limit);
    
    // Populate
    query = query.populate([
      { path: 'user', select: 'name email phone' },
      { path: 'items.package', select: 'name price category' },
      { path: 'assignedWorker', select: 'name' },
      { path: 'assignedDeliverer', select: 'name' }
    ]);
    
    // Execute query
    const orders = await query;
    
    // Pagination result
    const pagination = {};
    
    if (endIndex < total) {
      pagination.next = {
        page: page + 1,
        limit
      };
    }
    
    if (startIndex > 0) {
      pagination.prev = {
        page: page - 1,
        limit
      };
    }
    
    res.status(200).json({
      success: true,
      count: orders.length,
      pagination,
      data: orders
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single order
// @route   GET /api/orders/:id
// @access  Private
exports.getOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id).populate([
      { path: 'user', select: 'name email phone' },
      { path: 'items.package', select: 'name price category' },
      { path: 'assignedWorker', select: 'name' },
      { path: 'assignedDeliverer', select: 'name' },
      { path: 'statusHistory.updatedBy', select: 'name role' }
    ]);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Check if user is authorized to view this order
    if (
      req.user.role !== 'admin' && 
      req.user.role !== 'manager' && 
      order.user._id.toString() !== req.user.id && 
      (order.assignedWorker && order.assignedWorker._id.toString() !== req.user.id) && 
      (order.assignedDeliverer && order.assignedDeliverer._id.toString() !== req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to access this order'
      });
    }
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create order from cart
// @route   POST /api/orders
// @access  Private
exports.createOrder = async (req, res, next) => {
  try {
    const { 
      pickupDate, 
      deliveryDate, 
      deliveryAddress, 
      deliveryInstructions,
      paymentMethod 
    } = req.body;
    
    // Get user's cart
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.package');
    
    if (!cart || cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'Your cart is empty'
      });
    }
    
    // Create order items and calculate total
    let totalAmount = 0;
    const orderItems = cart.items.map(item => {
      const itemTotal = item.package.price * item.quantity;
      totalAmount += itemTotal;
      
      return {
        package: item.package._id,
        quantity: item.quantity,
        price: item.package.price
      };
    });
    
    // Create new order
    const order = await Order.create({
      user: req.user.id,
      items: orderItems,
      totalAmount,
      pickupDate,
      deliveryDate,
      deliveryAddress: deliveryAddress || req.user.address,
      deliveryInstructions,
      paymentMethod,
      statusHistory: [
        {
          status: 'pending',
          timestamp: Date.now(),
          updatedBy: req.user.id
        }
      ]
    });
    
    // Clear the user's cart
    await Cart.findOneAndUpdate(
      { user: req.user.id },
      { $set: { items: [] } }
    );
    
    res.status(201).json({
      success: true,
      data: order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update order status
// @route   PUT /api/orders/:id/status
// @access  Private/Admin/Worker/Manager/Deliverer
exports.updateOrderStatus = async (req, res, next) => {
  try {
    const { status } = req.body;
    
    // Find order
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Check if user is authorized to update this order
    if (
      req.user.role !== 'admin' && 
      req.user.role !== 'manager' && 
      (req.user.role === 'worker' && order.assignedWorker.toString() !== req.user.id) &&
      (req.user.role === 'deliverer' && order.assignedDeliverer.toString() !== req.user.id)
    ) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this order'
      });
    }
    
    // Update status
    order.status = status;
    
    // Add to status history
    order.statusHistory.push({
      status,
      timestamp: Date.now(),
      updatedBy: req.user.id
    });
    
    await order.save();
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Assign worker to order
// @route   PUT /api/orders/:id/assign-worker
// @access  Private/Admin/Manager
exports.assignWorker = async (req, res, next) => {
  try {
    const { workerId } = req.body;
    
    // Check if worker exists and is a worker
    const worker = await User.findById(workerId);
    
    if (!worker || worker.role !== 'worker') {
      return res.status(404).json({
        success: false,
        error: 'Worker not found'
      });
    }
    
    // Find order
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Assign worker
    order.assignedWorker = workerId;
    
    await order.save();
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Assign deliverer to order
// @route   PUT /api/orders/:id/assign-deliverer
// @access  Private/Admin/Manager
exports.assignDeliverer = async (req, res, next) => {
  try {
    const { delivererId } = req.body;
    
    // Check if deliverer exists and is a deliverer
    const deliverer = await User.findById(delivererId);
    
    if (!deliverer || deliverer.role !== 'deliverer') {
      return res.status(404).json({
        success: false,
        error: 'Deliverer not found'
      });
    }
    
    // Find order
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Assign deliverer
    order.assignedDeliverer = delivererId;
    
    await order.save();
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
exports.cancelOrder = async (req, res, next) => {
  try {
    // Find order
    const order = await Order.findById(req.params.id);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    // Check if user is the order owner
    if (order.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to cancel this order'
      });
    }
    
    // Check if order can be cancelled (only pending or confirmed orders)
    if (order.status !== 'pending' && order.status !== 'confirmed') {
      return res.status(400).json({
        success: false,
        error: 'Order cannot be cancelled at this stage'
      });
    }
    
    // Update status to cancelled
    order.status = 'cancelled';
    
    // Add to status history
    order.statusHistory.push({
      status: 'cancelled',
      timestamp: Date.now(),
      updatedBy: req.user.id
    });
    
    await order.save();
    
    res.status(200).json({
      success: true,
      data: order
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user's order history
// @route   GET /api/orders/history
// @access  Private
exports.getOrderHistory = async (req, res, next) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .sort('-createdAt')
      .populate([
        { path: 'items.package', select: 'name price category' }
      ]);
    
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });
  } catch (err) {
    next(err);
  }
};