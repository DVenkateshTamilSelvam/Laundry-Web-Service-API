const express = require('express');
const { register, login, getMe, logout, moderatorLogin } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/moderator/login', moderatorLogin);
router.get('/me', protect, getMe);
router.get('/logout', protect, logout);

module.exports = router;