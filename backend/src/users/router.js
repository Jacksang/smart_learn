const express = require('express');
const { register, login, getProfile } = require('./controller');
const { protect } = require('./middleware');

const profileRouter = require('./profile-router');

const router = express.Router();

// Authentication routes
router.post('/register', register);
router.post('/login', login);

// Protected user routes
router.get('/me', protect, getProfile);

// Profile management routes (includes all new profile APIs)
// Note: profile-router already has its own authentication middleware
router.use('/profile', profileRouter);

module.exports = router;
