const { Pool } = require('pg');
const db = new Pool({
  user: 'smartlearn',
  host: 'localhost',
  database: 'smartlearn',
  password: 'password',
  port: 5432,
});

// ---------------------------------------------------------------------------
// Helper
// ---------------------------------------------------------------------------
function toCamelCase(rows) {
  if (Array.isArray(rows)) return rows.map((r) => toCamelCase(r));
  if (!rows || typeof rows !== 'object') return rows;
  const out = {};
  for (const [k, v] of Object.entries(rows)) {
    const camel = k.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
    out[camel] = v;
  }
  return out;
}

// ---------------------------------------------------------------------------
// 1. getNotifications
// ---------------------------------------------------------------------------
async function getNotifications(userId, options = {}) {
  const { type, isRead, channel, limit = 20, offset = 0 } = options;

  const conditions = ['user_id = $1'];
  const params = [userId];
  let idx = 2;

  if (type !== undefined) {
    conditions.push(`type = $${idx++}`);
    params.push(type);
  }
  if (isRead !== undefined) {
    conditions.push(`is_read = $${idx++}`);
    params.push(isRead);
  }
  if (channel !== undefined) {
    conditions.push(`channel = $${idx++}`);
    params.push(channel);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

  const [dataResult, countResult, unreadResult] = await Promise.all([
    db.query(
      `SELECT * FROM notifications ${where} ORDER BY created_at DESC LIMIT $${idx} OFFSET $${idx + 1}`,
      [...params, limit, offset]
    ),
    db.query(
      `SELECT COUNT(*)::int AS total FROM notifications ${where}`,
      params
    ),
    db.query(
      'SELECT COUNT(*)::int AS unread_count FROM notifications WHERE user_id = $1 AND is_read = false',
      [userId]
    ),
  ]);

  return {
    notifications: dataResult.rows.map(toCamelCase),
    total: countResult.rows[0].total,
    unreadCount: unreadResult.rows[0].unreadCount,
  };
}

// ---------------------------------------------------------------------------
// 2. getNotificationById
// ---------------------------------------------------------------------------
async function getNotificationById(notificationId, userId) {
  const result = await db.query(
    'SELECT * FROM notifications WHERE id = $1 AND user_id = $2 LIMIT 1',
    [notificationId, userId]
  );
  return result.rows.length ? toCamelCase(result.rows[0]) : null;
}

// ---------------------------------------------------------------------------
// 3. getUnreadCount
// ---------------------------------------------------------------------------
async function getUnreadCount(userId) {
  const result = await db.query(
    'SELECT COUNT(*)::int AS count FROM notifications WHERE user_id = $1 AND is_read = false',
    [userId]
  );
  return result.rows[0].count;
}

// ---------------------------------------------------------------------------
// 4. markAsRead
// ---------------------------------------------------------------------------
async function markAsRead(notificationId, userId) {
  const result = await db.query(
    `UPDATE notifications
       SET is_read = true, read_at = NOW(), updated_at = NOW()
     WHERE id = $1 AND user_id = $2
     RETURNING *`,
    [notificationId, userId]
  );
  return result.rows.length ? toCamelCase(result.rows[0]) : null;
}

// ---------------------------------------------------------------------------
// 5. markAllAsRead
// ---------------------------------------------------------------------------
async function markAllAsRead(userId) {
  const result = await db.query(
    `UPDATE notifications
       SET is_read = true, read_at = NOW(), updated_at = NOW()
     WHERE user_id = $1 AND is_read = false
     RETURNING id`,
    [userId]
  );
  return result.rowCount;
}

// ---------------------------------------------------------------------------
// 6. markBatchAsRead
// ---------------------------------------------------------------------------
async function markBatchAsRead(userId, notificationIds) {
  const result = await db.query(
    `UPDATE notifications
       SET is_read = true, read_at = NOW(), updated_at = NOW()
     WHERE user_id = $1 AND id = ANY($2::int[])
     RETURNING id`,
    [userId, notificationIds]
  );
  return result.rowCount;
}

// ---------------------------------------------------------------------------
// 7. deleteNotification
// ---------------------------------------------------------------------------
async function deleteNotification(notificationId, userId) {
  const result = await db.query(
    'DELETE FROM notifications WHERE id = $1 AND user_id = $2',
    [notificationId, userId]
  );
  return result.rowCount > 0;
}

// ---------------------------------------------------------------------------
// 8. deleteAllNotifications
// ---------------------------------------------------------------------------
async function deleteAllNotifications(userId, filters = {}) {
  const { type, isRead } = filters;

  const conditions = ['user_id = $1'];
  const params = [userId];
  let idx = 2;

  if (type !== undefined) {
    conditions.push(`type = $${idx++}`);
    params.push(type);
  }
  if (isRead !== undefined) {
    conditions.push(`is_read = $${idx++}`);
    params.push(isRead);
  }

  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const result = await db.query(
    `DELETE FROM notifications ${where}`,
    params
  );
  return result.rowCount;
}

// ---------------------------------------------------------------------------
// 9. createNotification
// ---------------------------------------------------------------------------
async function createNotification(data) {
  const {
    userId,
    type,
    title,
    body,
    data: notificationData,
    channel,
    priority,
    imageUrl,
    actionUrl,
    actionLabel,
    expiresAt,
    metadata,
  } = data;

  const result = await db.query(
    `INSERT INTO notifications
       (user_id, type, title, body, data, channel, priority,
        image_url, action_url, action_label, expires_at, metadata)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
     RETURNING *`,
    [
      userId,
      type,
      title,
      body,
      notificationData ? JSON.stringify(notificationData) : null,
      channel,
      priority || 'normal',
      imageUrl || null,
      actionUrl || null,
      actionLabel || null,
      expiresAt || null,
      metadata ? JSON.stringify(metadata) : null,
    ]
  );
  return toCamelCase(result.rows[0]);
}

// ---------------------------------------------------------------------------
// 10. createDeliveryLog
// ---------------------------------------------------------------------------
async function createDeliveryLog(notificationId, channel, status, deliveryId, errorMessage) {
  const result = await db.query(
    `INSERT INTO notification_delivery_logs
       (notification_id, channel, status, delivery_id, attempt, error_message, attempted_at)
     VALUES ($1, $2, $3, $4, 1, $5, NOW())
     RETURNING *`,
    [notificationId, channel, status, deliveryId || null, errorMessage || null]
  );
  return toCamelCase(result.rows[0]);
}

// ---------------------------------------------------------------------------
// 11. getPreferences
// ---------------------------------------------------------------------------
const DEFAULT_PREFERENCES = {
  emailNotifications: true,
  pushNotifications: true,
  weeklySummary: true,
  streakReminders: true,
  achievementNotifications: true,
  learningTips: true,
};

async function getPreferences(userId) {
  const result = await db.query(
    'SELECT * FROM notification_preferences WHERE user_id = $1 LIMIT 1',
    [userId]
  );
  if (result.rows.length) {
    return toCamelCase(result.rows[0]);
  }
  return { userId, ...DEFAULT_PREFERENCES };
}

// ---------------------------------------------------------------------------
// 12. updatePreferences
// ---------------------------------------------------------------------------
async function updatePreferences(userId, data) {
  const columnMap = {
    emailNotifications: 'email_notifications',
    pushNotifications: 'push_notifications',
    weeklySummary: 'weekly_summary',
    streakReminders: 'streak_reminders',
    achievementNotifications: 'achievement_notifications',
    learningTips: 'learning_tips',
  };

  const insertCols = ['user_id'];
  const insertVals = ['$1'];
  const updateSets = [];
  const params = [userId];
  let idx = 2;

  for (const [camel, col] of Object.entries(columnMap)) {
    if (camel in data) {
      insertCols.push(col);
      insertVals.push(`$${idx}`);
      updateSets.push(`${col} = $${idx}`);
      params.push(data[camel]);
      idx++;
    }
  }

  if (updateSets.length === 0) {
    return getPreferences(userId);
  }

  // Always touch updated_at on update path
  insertCols.push('updated_at');
  insertVals.push('NOW()');
  updateSets.push('updated_at = NOW()');

  const result = await db.query(
    `INSERT INTO notification_preferences (${insertCols.join(', ')})
     VALUES (${insertVals.join(', ')})
     ON CONFLICT (user_id)
     DO UPDATE SET ${updateSets.join(', ')}
     RETURNING *`,
    params
  );

  return toCamelCase(result.rows[0]);
}

// ---------------------------------------------------------------------------
// 13. getTemplate
// ---------------------------------------------------------------------------
async function getTemplate(name, type) {
  const result = await db.query(
    'SELECT * FROM notification_templates WHERE name = $1 AND type = $2 AND is_active = true LIMIT 1',
    [name, type]
  );
  return result.rows.length ? toCamelCase(result.rows[0]) : null;
}

// ---------------------------------------------------------------------------
module.exports = {
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
};
