const express = require('express');
const { protect } = require('../users/middleware');
const {
  getNotifications,
  getNotification,
  markRead,
  markAllRead,
  markBatchRead,
  deleteNotification,
  deleteAllNotifications,
  getPreferences,
  updatePreferences,
  sendTestNotification,
} = require('./controller');

const router = express.Router();

// All routes require auth
router.use(protect);

// GET /api/notifications — list with pagination
router.get('/', getNotifications);

// GET /api/notifications/preferences — must come BEFORE /:notificationId
router.get('/preferences', getPreferences);
router.patch('/preferences', updatePreferences);

// GET /api/notifications/:notificationId
router.get('/:notificationId', getNotification);

// POST /api/notifications/mark-all-read — must come BEFORE /:notificationId/read
router.post('/mark-all-read', markAllRead);

// POST /api/notifications/read-all — batch
router.post('/read-all', markBatchRead);

// POST /api/notifications/test
router.post('/test', sendTestNotification);

// POST /api/notifications/:notificationId/read
router.post('/:notificationId/read', markRead);

// DELETE /api/notifications/:notificationId
router.delete('/:notificationId', deleteNotification);

// DELETE /api/notifications/
router.delete('/', deleteAllNotifications);

module.exports = router;
