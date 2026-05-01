/**
 * User Profile Repository
 * Database operations for profile, preferences, subscriptions, and sessions
 */

const db = require('../../config/database');

/**
 * Update user profile fields
 */
async function updateProfile(userId, fields) {
  const allowedFields = {
    display_name: 'display_name',
    bio: 'bio',
    avatar_url: 'avatar_url'
  };
  
  const setClauses = [];
  const values = [];
  let index = 1;
  
  for (const [key, dbField] of Object.entries(fields)) {
    if (allowedFields[key]) {
      setClauses.push(`${dbField} = $${index}`);
      values.push(fields[key]);
      index++;
    }
  }
  
  if (setClauses.length === 0) {
    return null;
  }
  
  setClauses.push(`updated_at = NOW()`);
  values.push(userId);
  
  const query = `
    UPDATE users 
    SET ${setClauses.join(', ')}
    WHERE id = $${index}
    RETURNING id, email, display_name, avatar_url, bio, role, status, created_at, updated_at
  `;
  
  const result = await db.query(query, values);
  return result.rows[0] || null;
}

/**
 * Update user preferences (learning or notification)
 */
async function updatePreferences(userId, type, preferences) {
  const user = await getUserByField('id', userId);
  if (!user) {
    return null;
  }
  
  if (type === 'learning') {
    // Update columns directly
    const setClauses = [];
    const values = [];
    let index = 1;
    
    const allowedFields = {
      daily_goal_minutes: 'daily_goal_minutes',
      preferred_session_length: 'preferred_session_length',
      difficulty_level: 'difficulty_level',
      learning_style: 'learning_style'
    };
    
    for (const [key, dbField] of Object.entries(preferences)) {
      if (allowedFields[key] && preferences[key] !== undefined) {
        setClauses.push(`${dbField} = $${index}`);
        values.push(preferences[key]);
        index++;
      }
    }
    
    if (setClauses.length === 0) {
      return user;
    }
    
    setClauses.push('updated_at = NOW()');
    values.push(userId);
    
    const query = `
      UPDATE users 
      SET ${setClauses.join(', ')}
      WHERE id = $${index}
      RETURNING id, daily_goal_minutes, preferred_session_length, difficulty_level, learning_style
    `;
    
    const result = await db.query(query, values);
    return result.rows[0];
  }
  
  if (type === 'notifications') {
    // Check if notification preferences exist
    const existing = await db.query(
      'SELECT id FROM notification_preferences WHERE user_id = $1',
      [userId]
    );
    
    const setClauses = [];
    const values = [];
    let index = 1;
    
    const allowedFields = {
      email_notifications: 'email_notifications',
      push_notifications: 'push_notifications',
      weekly_summary: 'weekly_summary',
      streak_reminders: 'streak_reminders',
      achievement_notifications: 'achievement_notifications',
      learning_tips: 'learning_tips'
    };
    
    for (const [key, dbField] of Object.entries(preferences)) {
      if (allowedFields[key] && preferences[key] !== undefined) {
        setClauses.push(`${dbField} = $${index}`);
        values.push(preferences[key]);
        index++;
      }
    }
    
    if (setClauses.length === 0) {
      return existing.rows[0] ? await getNotificationPreferences(userId) : null;
    }
    
    setClauses.push('updated_at = NOW()');
    values.push(userId);
    
    if (existing.rows.length > 0) {
      // Update existing
      setClauses.push(`id = $${index}`);
      values.push(existing.rows[0].id);
      const query = `
        UPDATE notification_preferences 
        SET ${setClauses.join(', ')}
        WHERE id = $${index}
        RETURNING email_notifications, push_notifications, weekly_summary, 
                  streak_reminders, achievement_notifications, learning_tips, updated_at
      `;
      
      const result = await db.query(query, values);
      return result.rows[0];
    } else {
      // Insert new
      setClauses.push(`user_id = $${index}`);
      const query = `
        INSERT INTO notification_preferences (${setClauses.map((_, i) => {
          const keys = Object.keys(preferences);
          const fields = ['email_notifications', 'push_notifications', 'weekly_summary', 
                         'streak_reminders', 'achievement_notifications', 'learning_tips', 'user_id'];
          return fields[i];
        }).join(', ')})
        VALUES (${setClauses.map(() => `$${index}`).join(', ')})
        RETURNING email_notifications, push_notifications, weekly_summary, 
                  streak_reminders, achievement_notifications, learning_tips, created_at
      `;
      
      const result = await db.query(query, values);
      return result.rows[0];
    }
  }
  
  return null;
}

/**
 * Change user password
 */
async function changePassword(userId, newPassword) {
  const bcrypt = require('bcrypt');
  const passwordHash = await bcrypt.hash(newPassword, 12);
  
  const query = `
    UPDATE users 
    SET password_hash = $1,
        password_changed_at = NOW(),
        updated_at = NOW()
    WHERE id = $2
    RETURNING id
  `;
  
  const result = await db.query(query, [passwordHash, userId]);
  return result.rows[0] || null;
}

/**
 * Get user notification preferences
 */
async function getNotificationPreferences(userId) {
  const query = `
    SELECT email_notifications, push_notifications, weekly_summary, 
           streak_reminders, achievement_notifications, learning_tips, updated_at
    FROM notification_preferences
    WHERE user_id = $1
  `;
  
  const result = await db.query(query, [userId]);
  return result.rows[0] || null;
}

/**
 * Create notification preferences for new user
 */
async function createNotificationPreferences(userId) {
  const query = `
    INSERT INTO notification_preferences (
      user_id, email_notifications, push_notifications, weekly_summary, 
      streak_reminders, achievement_notifications, learning_tips
    ) VALUES ($1, true, false, true, true, true, true, false)
    RETURNING id, user_id, email_notifications, push_notifications, weekly_summary, 
              streak_reminders, achievement_notifications, learning_tips, created_at
  `;
  
  const result = await db.query(query, [userId]);
  return result.rows[0];
}

/**
 * Get user subscription information
 */
async function getUserSubscriptions(userId) {
  const query = `
    SELECT 
      u.subscription_plan,
      u.subscription_status,
      u.subscription_expires_at,
      u.created_at as current_period_start,
      sp.description,
      sp.features,
      sp.price_amount,
      sp.price_currency,
      sp.billing_period,
      CASE 
        WHEN u.subscription_status = 'active' THEN
          EXTRACT(EPOCH FROM (u.subscription_expires_at - CURRENT_TIMESTAMP))/86400
        ELSE 0
      END as days_remaining
    FROM users u
    LEFT JOIN subscription_plans sp ON u.subscription_plan = sp.plan_name AND sp.is_active = true
    WHERE u.id = $1
  `;
  
  const result = await db.query(query, [userId]);
  return result.rows[0] || null;
}

/**
 * Get active user sessions
 */
async function getActiveSessions(userId) {
  const query = `
    SELECT id, device_info, ip_address, user_agent, last_active_at, 
           expires_at, is_revoked, created_at
    FROM user_sessions
    WHERE user_id = $1 
      AND expires_at > NOW() 
      AND is_revoked = false
    ORDER BY last_active_at DESC
  `;
  
  const result = await db.query(query, [userId]);
  return result.rows || [];
}

/**
 * Create new user session
 */
async function createSession(userId, token, deviceInfo, ipAddress, userAgent) {
  const query = `
    INSERT INTO user_sessions (
      user_id, token, device_info, ip_address, user_agent, expires_at
    ) VALUES ($1, $2, $3, $4, $5, NOW() + INTERVAL '7 days')
    RETURNING id, token, device_info, ip_address, user_agent, 
              last_active_at, expires_at, created_at
  `;
  
  const result = await db.query(query, [userId, token, deviceInfo, ipAddress, userAgent]);
  return result.rows[0];
}

/**
 * Revoke specific session
 */
async function revokeSession(userId, sessionId) {
  const query = `
    UPDATE user_sessions
    SET is_revoked = true,
        updated_at = NOW()
    WHERE id = $1 
      AND user_id = $2
      AND is_revoked = false
    RETURNING id
  `;
  
  const result = await db.query(query, [sessionId, userId]);
  return result.rows[0] || null;
}

/**
 * Revoke all sessions
 */
async function revokeAllSessions(userId) {
  const query = `
    UPDATE user_sessions
    SET is_revoked = true,
        updated_at = NOW()
    WHERE user_id = $1 
      AND is_revoked = false
  `;
  
  await db.query(query, [userId]);
  return true;
}

/**
 * Update data export URL
 */
async function updateDataExport(userId, exportUrl) {
  const query = `
    UPDATE users
    SET data_export_url = $1,
        data_export_requested_at = NOW(),
        updated_at = NOW()
    WHERE id = $2
    RETURNING id, data_export_url, data_export_requested_at
  `;
  
  const result = await db.query(query, [exportUrl, userId]);
  return result.rows[0] || null;
}

module.exports = {
  updateProfile,
  updatePreferences,
  changePassword,
  getNotificationPreferences,
  createNotificationPreferences,
  getUserSubscriptions,
  getActiveSessions,
  createSession,
  revokeSession,
  revokeAllSessions,
  updateDataExport,
};
