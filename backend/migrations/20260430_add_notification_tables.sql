-- D11.4 Notification System — Database Migration
-- Creates notifications, templates, and delivery_logs tables

BEGIN;

-- =============================================================
-- notifications
-- =============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL DEFAULT 'system',
  title VARCHAR(255) NOT NULL,
  body TEXT NOT NULL DEFAULT '',
  data JSONB DEFAULT '{}',
  channel VARCHAR(50) NOT NULL DEFAULT 'in_app',
  priority VARCHAR(20) DEFAULT 'normal',
  image_url VARCHAR(500),
  action_url VARCHAR(500),
  action_label VARCHAR(100),
  expires_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  delivered_at TIMESTAMPTZ,
  read_at TIMESTAMPTZ,
  is_read BOOLEAN DEFAULT false,
  is_sent BOOLEAN DEFAULT false,
  is_delivered BOOLEAN DEFAULT false,
  failed_attempts INTEGER DEFAULT 0,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- notification_templates
-- =============================================================

CREATE TABLE IF NOT EXISTS notification_templates (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type VARCHAR(50) NOT NULL,
  subject VARCHAR(255),
  email_body TEXT,
  push_body TEXT,
  in_app_body TEXT,
  variables JSONB NOT NULL DEFAULT '[]',
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(name, type)
);

-- =============================================================
-- notification_delivery_logs
-- =============================================================

CREATE TABLE IF NOT EXISTS notification_delivery_logs (
  id SERIAL PRIMARY KEY,
  notification_id INTEGER NOT NULL REFERENCES notifications(id) ON DELETE CASCADE,
  channel VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'pending',
  delivery_id VARCHAR(255),
  attempt INTEGER DEFAULT 1,
  error_message TEXT,
  metadata JSONB DEFAULT '{}',
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- Indexes
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_type ON notifications(type);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_sent ON notifications(is_sent, user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);

CREATE INDEX IF NOT EXISTS idx_delivery_logs_notification ON notification_delivery_logs(notification_id);
CREATE INDEX IF NOT EXISTS idx_delivery_logs_status ON notification_delivery_logs(status);

-- =============================================================
-- Triggers
-- =============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notifications_updated_at ON notifications;
CREATE TRIGGER trg_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS trg_notification_templates_updated_at ON notification_templates;
CREATE TRIGGER trg_notification_templates_updated_at
  BEFORE UPDATE ON notification_templates
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

-- =============================================================
-- Seed templates
-- =============================================================

INSERT INTO notification_templates (name, type, subject, push_body, in_app_body, variables)
VALUES
  ('achievement', 'achievement', '🏆 Achievement Unlocked!',
   'You earned: {{achievement_name}}!',
   '🎉 Congratulations! You earned the {{achievement_name}} achievement.',
   '["achievement_name","achievement_description"]'),
  ('streak_reminder', 'reminder', '🔥 Keep Your Streak Going!',
   'Day {{streak_days}} of your learning streak!',
   'You''re on a {{streak_days}}-day learning streak! Keep it going.',
   '["streak_days"]'),
  ('progress_weekly', 'progress', '📊 Weekly Progress Update',
   'You completed {{completed_topics}} topics this week.',
   'Weekly summary: {{completed_topics}} topics, {{accuracy}}% accuracy.',
   '["completed_topics","accuracy","time_spent"]'),
  ('session_summary', 'system', '📝 Session Summary Ready',
   'Your session summary is ready to view.',
   'Your learning session summary is ready. {{questions_answered}} questions answered with {{accuracy}}% accuracy.',
   '["questions_answered","accuracy","time_spent"]')
ON CONFLICT (name, type) DO NOTHING;

COMMIT;
