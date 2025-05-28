const express = require('express');
const { 
  getAllFeedback, 
  getUserFeedback, 
  getFeedback, 
  createFeedback, 
  updateFeedback, 
  deleteFeedback, 
  respondToFeedback 
} = require('../controllers/feedbackController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Protect all routes
router.use(protect);

// Routes for all authenticated users
router.get('/user', getUserFeedback);
router.post('/', createFeedback);
router.put('/:id', updateFeedback);
router.delete('/:id', deleteFeedback);

// Routes for admin only
router.get('/', authorize('admin'), getAllFeedback);
router.get('/:id', getFeedback);
router.put('/:id/respond', authorize('admin'), respondToFeedback);

module.exports = router;