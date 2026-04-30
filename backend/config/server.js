const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./database');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes - Import routers
const userRouter = require('../src/users/router');
const authRouter = require('../src/auth/auth-router');
const outlineRouter = require('../src/outline/router');
const answerRouter = require('../src/answers/router');
const progressRouter = require('../src/progress/router');
const sessionRouter = require('../src/sessions/router');
const deferredQuestionRouter = require('../src/deferred-questions/router');
const reinforceRouter = require('../src/reinforce/router');
const projectRouter = require('../src/projects/router');
const materialRouter = require('../src/materials/router');

// Mount routes using router instances
app.use('/api/users', userRouter);
app.use('/api/auth', authRouter);
app.use('/api/outline', outlineRouter);
app.use('/api', answerRouter);
app.use('/api', progressRouter);
app.use('/api', sessionRouter);
app.use('/api', deferredQuestionRouter);
app.use('/api', reinforceRouter);
app.use('/api/answers', answerRouter);
app.use('/api/projects', projectRouter);
app.use('/api/materials', materialRouter);

// Health check
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'OK', message: 'Smart Learn API is running' });
});

// Error handling middleware
app.use((err, req, res, next) => {
    const isPostgresSchemaGap = err && ['42P01', '42703', '23503'].includes(err.code);

    if (isPostgresSchemaGap) {
        console.error('PostgreSQL MVP schema gap:', err.message);
        return res.status(503).json({
            message: 'This endpoint is not ready in the PostgreSQL-only MVP yet.',
            detail: 'The requested operation still depends on schema/runtime work that has not been completed.',
        });
    }

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
