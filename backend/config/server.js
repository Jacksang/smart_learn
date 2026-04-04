const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
const userRoutes = require('../src/users/router');
const outlineRoutes = require('../src/outline/router');
const questionRoutes = require('../src/questions/router');
const answerRoutes = require('../src/answers/router');

// Mount routes
app.use('/api/users', userRoutes);
app.use('/api/outline', outlineRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/answers', answerRoutes);

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Smart Learn API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(err.status || 500).json({
        message: err.message,
        error: process.env.NODE_ENV === 'development' ? err.stack : {}
    });
});

const PORT = process.env.PORT || 3000;

const server = app.listen(PORT, async () => {
    await db.connect();
    console.log(`🚀 Smart Learn API server running on port ${PORT}`);
    console.log(`📍 Health check: http://localhost:${PORT}/api/health`);
});

module.exports = server;
