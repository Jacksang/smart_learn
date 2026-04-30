const {
  getNotifications,
  getNotificationById,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  markBatchAsRead,
  deleteNotification,
  deleteAllNotifications,
  createNotification,
  createDeliveryLog,
  getPreferences,
  updatePreferences,
  getTemplate,
} = require('./repository');

const {
  sendInApp,
  sendEmail,
  sendPush,
  sendMultiChannel,
  shouldDeliver,
  applyTemplate,
  logDelivery,
  getNotificationSummary,
} = require('./service');

// ---------------------------------------------------------------------------
// 1. GET /api/notifications?type=&read=&channel=&page=&limit=
// ---------------------------------------------------------------------------
exports.getNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const type = req.query.type;
    const channel = req.query.channel;
    const rawRead = req.query.read;

    let isRead;
    if (rawRead === 'true') isRead = true;
    else if (rawRead === 'false') isRead = false;
    // undefined → do not filter

    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const [{ notifications, total, unreadCount }, summary] = await Promise.all([
      getNotifications(userId, { type, isRead, channel, limit, offset }),
      getNotificationSummary(userId),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: {
        notifications,
        pagination: { page, limit, total, totalPages },
        summary: {
          total: summary.total,
          unread: summary.unread,
          ...summary,
        },
      },
    });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// 2. GET /api/notifications/:notificationId
// ---------------------------------------------------------------------------
exports.getNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const notification = await getNotificationById(notificationId, userId);

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      data: { notification },
    });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// 3. POST /api/notifications/:notificationId/read
// ---------------------------------------------------------------------------
exports.markRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const updated = await markAsRead(notificationId, userId);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        notificationId,
        read: true,
        readAt: updated.readAt,
      },
    });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// 4. POST /api/notifications/mark-all-read
// ---------------------------------------------------------------------------
exports.markAllRead = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const readCount = await markAllAsRead(userId);

    res.status(200).json({
      success: true,
      data: {
        readCount,
        readAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// 5. POST /api/notifications/read-all
// ---------------------------------------------------------------------------
exports.markBatchRead = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { notificationIds } = req.body;

    if (!Array.isArray(notificationIds) || notificationIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'notificationIds must be a non-empty array',
      });
    }

    const readCount = await markBatchAsRead(userId, notificationIds);

    res.status(200).json({
      success: true,
      data: {
        readCount,
        readAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// 6. DELETE /api/notifications/:notificationId
// ---------------------------------------------------------------------------
exports.deleteNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { notificationId } = req.params;

    const deleted = await deleteNotification(notificationId, userId);

    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: 'Notification not found',
      });
    }

    res.status(200).json({
      success: true,
      data: {
        message: 'Notification deleted successfully',
      },
    });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// 7. DELETE /api/notifications?type=&read=
// ---------------------------------------------------------------------------
exports.deleteAllNotifications = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const type = req.query.type;
    const rawRead = req.query.read;

    let isRead;
    if (rawRead === 'true') isRead = true;
    else if (rawRead === 'false') isRead = false;
    // undefined → do not filter

    const deletedCount = await deleteAllNotifications(userId, { type, isRead });

    res.status(200).json({
      success: true,
      data: {
        deletedCount,
        message: 'Notifications deleted successfully',
      },
    });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// 8. GET /api/notifications/preferences
// ---------------------------------------------------------------------------
exports.getPreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;

    const preferences = await getPreferences(userId);

    res.status(200).json({
      success: true,
      data: { preferences },
    });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// 9. PATCH /api/notifications/preferences
// ---------------------------------------------------------------------------
exports.updatePreferences = async (req, res, next) => {
  try {
    const userId = req.user.id;

    // Only pick known camelCase preference keys from the body
    const allowedKeys = [
      'emailNotifications',
      'pushNotifications',
      'weeklySummary',
      'streakReminders',
      'achievementNotifications',
      'learningTips',
    ];

    const updateData = {};
    for (const key of allowedKeys) {
      if (key in req.body) {
        updateData[key] = req.body[key];
      }
    }

    const preferences = await updatePreferences(userId, updateData);

    res.status(200).json({
      success: true,
      data: { preferences },
    });
  } catch (error) {
    return next(error);
  }
};

// ---------------------------------------------------------------------------
// 10. POST /api/notifications/test
// ---------------------------------------------------------------------------
exports.sendTestNotification = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { type, title, body, channel = 'in_app' } = req.body;

    if (!type) {
      return res.status(400).json({
        success: false,
        message: 'type is required',
      });
    }

    if (!title) {
      return res.status(400).json({
        success: false,
        message: 'title is required',
      });
    }

    // For a test notification, deliver exclusively through in_app
    // The body param gates which service function to call, but default to in_app
    let notification;
    if (channel === 'email') {
      notification = await sendEmail(userId, type, title, body, {});
    } else if (channel === 'push') {
      notification = await sendPush(userId, type, title, body, {});
    } else {
      notification = await sendInApp(userId, type, title, body, {});
    }

    res.status(201).json({
      success: true,
      data: { notification },
    });
  } catch (error) {
    return next(error);
  }
};
