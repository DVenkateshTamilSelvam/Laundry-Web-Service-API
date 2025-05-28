const express = require('express');
const { getUsers, getUser, updateProfile, updatePassword, deleteAccount } = require('../controllers/userController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Routes that require authentication
router.use(protect);

// Routes for all authenticated users
router.put('/profile', updateProfile);
router.put('/updatepassword', updatePassword);
router.delete('/profile', deleteAccount);

// Routes that require admin role
router.use(authorize('admin'));
router.get('/', getUsers);
router.get('/:id', getUser);

module.exports = router;