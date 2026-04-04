const express = require('express');
const { register, login, getProfile } = require('./controller');
const { protect } = require('./middleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.get('/me', protect, getProfile);

module.exports = router;
