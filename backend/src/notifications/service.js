const repository = require('./repository');

// ---------------------------------------------------------------------------
// Type → preference field mapping (snake_case DB columns → camelCase JS keys)
// ---------------------------------------------------------------------------
const TYPE_PREF_MAP = {
  achievement: 'achievementNotifications',
  streak: 'streakReminders',
  weekly_summary: 'weeklySummary',
  weeklySummary: 'weeklySummary',
  learning_tip: 'learningTips',
  learningTip: 'learningTips',
};

// Channel → preference field mapping
const CHANNEL_PREF_MAP = {
  email: 'emailNotifications',
  push: 'pushNotifications',
};

// ---------------------------------------------------------------------------
// 1. shouldDeliver
// ---------------------------------------------------------------------------
async function shouldDeliver(userId, channel, type) {
  const prefs = await repository.getPreferences(userId);

  // No preferences row → default allow
  if (!prefs) return true;

  const channelField = CHANNEL_PREF_MAP[channel];
  const typeField = TYPE_PREF_MAP[type];

  // Channel pref: if we have a mapped field, check it; otherwise default true
  const channelEnabled = channelField ? prefs[channelField] !== false : true;
  // Type pref: if we have a mapped field, check it; otherwise default true
  const typeEnabled = typeField ? prefs[typeField] !== false : true;

  return channelEnabled && typeEnabled;
}

// ---------------------------------------------------------------------------
// 2. applyTemplate
// ---------------------------------------------------------------------------
async function applyTemplate(templateName, variables) {
  const template = await repository.getTemplate(templateName, templateName);

  if (!template) {
    return { subject: '', emailBody: '', pushBody: '', inAppBody: '' };
  }

  // Replace {{variableName}} placeholders in each body field
  function interpolate(text) {
    if (!text) return text;
    return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return key in variables ? variables[key] : match;
    });
  }

  return {
    subject: interpolate(template.subject),
    emailBody: interpolate(template.emailBody),
    pushBody: interpolate(template.pushBody),
    inAppBody: interpolate(template.inAppBody),
  };
}

// ---------------------------------------------------------------------------
// 3. sendInApp
// ---------------------------------------------------------------------------
async function sendInApp(userId, type, title, body, data) {
  const notification = await repository.createNotification({
    userId,
    type,
    title,
    body,
    data,
    channel: 'in_app',
  });

  await repository.createDeliveryLog(
    notification.id,
    'in_app',
    'delivered'
  );

  return notification;
}

// ---------------------------------------------------------------------------
// 4. sendEmail
// ---------------------------------------------------------------------------
async function sendEmail(userId, type, title, body, data) {
  const allowed = await shouldDeliver(userId, 'email', type);
  if (!allowed) return { skipped: true };

  const notification = await repository.createNotification({
    userId,
    type,
    title,
    body,
    data,
    channel: 'email',
  });

  // Log pending first
  await repository.createDeliveryLog(
    notification.id,
    'email',
    'pending'
  );

  // Mock: mark as sent (SendGrid integration is future work)
  await repository.createDeliveryLog(
    notification.id,
    'email',
    'sent'
  );

  return notification;
}

// ---------------------------------------------------------------------------
// 5. sendPush
// ---------------------------------------------------------------------------
async function sendPush(userId, type, title, body, data) {
  const allowed = await shouldDeliver(userId, 'push', type);
  if (!allowed) return { skipped: true };

  const notification = await repository.createNotification({
    userId,
    type,
    title,
    body,
    data,
    channel: 'push',
  });

  // Log pending first
  await repository.createDeliveryLog(
    notification.id,
    'push',
    'pending'
  );

  // Mock: mark as sent (FCM integration is future work)
  await repository.createDeliveryLog(
    notification.id,
    'push',
    'sent'
  );

  return notification;
}

// ---------------------------------------------------------------------------
// 6. sendMultiChannel
// ---------------------------------------------------------------------------
async function sendMultiChannel(userId, type, title, body, data) {
  const [inApp, email, push] = await Promise.all([
    sendInApp(userId, type, title, body, data),
    sendEmail(userId, type, title, body, data),
    sendPush(userId, type, title, body, data),
  ]);

  return { inApp, email, push };
}

// ---------------------------------------------------------------------------
// 7. logDelivery
// ---------------------------------------------------------------------------
async function logDelivery(notificationId, channel, status, deliveryId, error) {
  const log = await repository.createDeliveryLog(
    notificationId,
    channel,
    status,
    deliveryId || null,
    error || null
  );
  return log;
}

// ---------------------------------------------------------------------------
// 8. getNotificationSummary
// ---------------------------------------------------------------------------
async function getNotificationSummary(userId) {
  // Fetch notifications for date-based counting (load enough to cover today + week)
  const { notifications, total, unreadCount } = await repository.getNotifications(
    userId,
    { limit: 1000 }
  );

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const startOfWeek = new Date(startOfToday);
  startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay());

  let today = 0;
  let thisWeek = 0;

  for (const n of notifications) {
    const createdAt = new Date(n.createdAt);
    if (createdAt >= startOfToday) {
      today++;
      thisWeek++;
    } else if (createdAt >= startOfWeek) {
      thisWeek++;
    }
  }

  return {
    total,
    unread: unreadCount,
    today,
    thisWeek,
  };
}

// ---------------------------------------------------------------------------
module.exports = {
  shouldDeliver,
  applyTemplate,
  sendInApp,
  sendEmail,
  sendPush,
  sendMultiChannel,
  logDelivery,
  getNotificationSummary,
};
