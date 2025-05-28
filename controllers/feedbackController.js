const Feedback = require('../models/Feedback');
const Order = require('../models/Order');

// @desc    Get all feedback
// @route   GET /api/feedback
// @access  Private/Admin
exports.getAllFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.find()
      .populate({
        path: 'user',
        select: 'name email'
      })
      .populate({
        path: 'order',
        select: 'totalAmount items.package items.quantity status'
      });
    
    res.status(200).json({
      success: true,
      count: feedback.length,
      data: feedback
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get user feedback
// @route   GET /api/feedback/user
// @access  Private
exports.getUserFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.find({ user: req.user.id })
      .populate({
        path: 'order',
        select: 'totalAmount items.package items.quantity status'
      });
    
    res.status(200).json({
      success: true,
      count: feedback.length,
      data: feedback
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Get single feedback
// @route   GET /api/feedback/:id
// @access  Private/Admin
exports.getFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id)
      .populate({
        path: 'user',
        select: 'name email'
      })
      .populate({
        path: 'order',
        select: 'totalAmount items.package items.quantity status'
      });
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }
    
    // Make sure user is feedback owner or admin
    if (feedback.user._id.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to view this feedback'
      });
    }
    
    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Create feedback for an order
// @route   POST /api/feedback
// @access  Private
exports.createFeedback = async (req, res, next) => {
  try {
    const { orderId, rating, comment, serviceQuality, punctuality, staffBehavior, isPublic } = req.body;
    
    // Check if order exists and belongs to user
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found'
      });
    }
    
    if (order.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to create feedback for this order'
      });
    }
    
    // Check if order is delivered
    if (order.status !== 'delivered') {
      return res.status(400).json({
        success: false,
        error: 'Cannot provide feedback until order is delivered'
      });
    }
    
    // Check if feedback already exists for this order
    const existingFeedback = await Feedback.findOne({ 
      user: req.user.id,
      order: orderId
    });
    
    if (existingFeedback) {
      return res.status(400).json({
        success: false,
        error: 'Feedback already submitted for this order'
      });
    }
    
    // Create feedback
    const feedback = await Feedback.create({
      user: req.user.id,
      order: orderId,
      rating,
      comment,
      serviceQuality,
      punctuality,
      staffBehavior,
      isPublic: isPublic !== undefined ? isPublic : true
    });
    
    res.status(201).json({
      success: true,
      data: feedback
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Update feedback
// @route   PUT /api/feedback/:id
// @access  Private
exports.updateFeedback = async (req, res, next) => {
  try {
    let feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }
    
    // Make sure user is feedback owner
    if (feedback.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to update this feedback'
      });
    }
    
    feedback = await Feedback.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    
    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Delete feedback
// @route   DELETE /api/feedback/:id
// @access  Private
exports.deleteFeedback = async (req, res, next) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }
    
    // Make sure user is feedback owner or admin
    if (feedback.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Not authorized to delete this feedback'
      });
    }
    
    await feedback.deleteOne();
    
    res.status(200).json({
      success: true,
      data: {}
    });
  } catch (err) {
    next(err);
  }
};

// @desc    Admin respond to feedback
// @route   PUT /api/feedback/:id/respond
// @access  Private/Admin
exports.respondToFeedback = async (req, res, next) => {
  try {
    const { comment } = req.body;
    
    const feedback = await Feedback.findById(req.params.id);
    
    if (!feedback) {
      return res.status(404).json({
        success: false,
        error: 'Feedback not found'
      });
    }
    
    // Update admin response
    feedback.adminResponse = {
      comment,
      respondedAt: Date.now(),
      respondedBy: req.user.id
    };
    
    await feedback.save();
    
    res.status(200).json({
      success: true,
      data: feedback
    });
  } catch (err) {
    next(err);
  }
};