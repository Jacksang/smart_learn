-- Migration: User Profile & Settings API v1.0
-- Description: Add profile fields, preferences, and session management
-- Date: 2026-04-09

-- =============================================
-- 1. Add new columns to users table
-- =============================================

ALTER TABLE users ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS daily_goal_minutes INTEGER DEFAULT 30 CHECK (daily_goal_minutes BETWEEN 15 AND 120);
ALTER TABLE users ADD COLUMN IF NOT EXISTS preferred_session_length INTEGER DEFAULT 25 CHECK (preferred_session_length BETWEEN 15 AND 60);
ALTER TABLE users ADD COLUMN IF NOT EXISTS difficulty_level VARCHAR(20) DEFAULT 'intermediate' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS learning_style VARCHAR(20) DEFAULT 'visual' CHECK (learning_style IN ('visual', 'auditory', 'read-write', 'kinesthetic'));
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_plan VARCHAR(50) DEFAULT 'free';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_status VARCHAR(50) DEFAULT 'active';
ALTER TABLE users ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS data_export_url VARCHAR(500);
ALTER TABLE users ADD COLUMN IF NOT EXISTS data_export_requested_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_changed_at TIMESTAMP;

-- Update column names for consistency
ALTER TABLE users RENAME COLUMN display_name TO display_name; -- Already has this

-- =============================================
-- 2. Create indexes for performance
-- =============================================

CREATE INDEX IF NOT EXISTS idx_users_display_name ON users(display_name);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_subscription_status ON users(subscription_status);
CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at);

-- Indexes for learning preferences
CREATE INDEX IF NOT EXISTS idx_users_difficulty ON users((difficulty_level));
CREATE INDEX IF NOT EXISTS idx_users_learning_style ON users((learning_style));

-- =============================================
-- 3. Create notification_preferences table
-- =============================================

CREATE TABLE IF NOT EXISTS notification_preferences (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT true,
    push_notifications BOOLEAN DEFAULT false,
    weekly_summary BOOLEAN DEFAULT true,
    streak_reminders BOOLEAN DEFAULT true,
    achievement_notifications BOOLEAN DEFAULT true,
    learning_tips BOOLEAN DEFAULT true,
    marketing_emails BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- Create index for quick lookups
CREATE INDEX IF NOT EXISTS idx_notification_preferences_user_id ON notification_preferences(user_id);

-- =============================================
-- 4. Create user_sessions table for session management
-- =============================================

CREATE TABLE IF NOT EXISTS user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(500) NOT NULL,
    device_info VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent VARCHAR(500),
    last_active_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    expires_at TIMESTAMP,
    is_revoked BOOLEAN DEFAULT false,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- =============================================
-- 5. Create subscription_plans table (future-proofing)
-- =============================================

CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    plan_name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    price_amount DECIMAL(10, 2),
    price_currency VARCHAR(3) DEFAULT 'USD',
    billing_period VARCHAR(20) DEFAULT 'monthly',
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default subscription plans
INSERT INTO subscription_plans (plan_name, description, price_amount, price_currency, billing_period, features, is_active)
VALUES 
    ('free', 'Free tier with basic features', 0.00, 'USD', 'monthly', 
     '["basic_analytics", "limited_sessions", "standard_support"]', true)
    ON CONFLICT (plan_name) DO NOTHING;

INSERT INTO subscription_plans (plan_name, description, price_amount, price_currency, billing_period, features, is_active)
VALUES 
    ('premium', 'Premium tier with advanced features', 12.99, 'USD', 'monthly',
     '["advanced_analytics", "unlimited_sessions", "priority_support", "custom_avatars", "export_data"]', true)
    ON CONFLICT (plan_name) DO NOTHING;

INSERT INTO subscription_plans (plan_name, description, price_amount, price_currency, billing_period, features, is_active)
VALUES 
    ('enterprise', 'Enterprise tier for teams', 29.99, 'USD', 'monthly',
     '["all_premium_features", "team_collaboration", "custom_integrations", "dedicated_support", "sso"]', true)
    ON CONFLICT (plan_name) DO NOTHING;

CREATE INDEX IF NOT EXISTS idx_subscription_plans_active ON subscription_plans(is_active);

-- =============================================
-- 6. Add constraints and defaults
-- =============================================

-- Ensure password_hash is not null for security
ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;

-- Add unique constraint on data_export_url
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS unique_export_url UNIQUE (data_export_url);

-- Add check constraints for subscription
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS valid_subscription_plan CHECK (subscription_plan IN ('free', 'premium', 'enterprise'));
ALTER TABLE users ADD CONSTRAINT IF NOT EXISTS valid_subscription_status CHECK (subscription_status IN ('active', 'cancelled', 'expired', 'trial'));

-- =============================================
-- 7. Create functions and triggers
-- =============================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for notification_preferences
DROP TRIGGER IF EXISTS update_notification_preferences ON notification_preferences;
CREATE TRIGGER update_notification_preferences
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Function to update user last_login_at on successful login
CREATE OR REPLACE FUNCTION update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.password_hash IS NULL OR OLD.password_hash IS DISTINCT FROM NEW.password_hash THEN
        -- Password was changed
        NEW.password_changed_at = NOW();
    END IF;
    
    -- Update last_active (existing functionality)
    NEW.updated_at = NOW();
    
    RETURN NEW;
END;
$$ language 'plpgsql';

-- =============================================
-- 8. Create views for common queries
-- =============================================

-- View for public user profiles (without sensitive data)
CREATE OR REPLACE VIEW v_user_public_profiles AS
SELECT 
    u.id,
    u.email,
    u.display_name,
    u.avatar_url,
    u.bio,
    u.role,
    u.status,
    u.created_at,
    u.updated_at,
    u.last_login_at,
    u.subscription_plan,
    u.subscription_status,
    u.subscription_expires_at,
    (SELECT COUNT(*) FROM learning_projects WHERE user_id = u.id) as project_count,
    (SELECT COUNT(*) FROM learning_sessions WHERE user_id = u.id AND status = 'completed') as completed_sessions
FROM users u
WHERE u.status = 'active';

-- View for user with full profile and subscription details
CREATE OR REPLACE VIEW v_user_full_profiles AS
SELECT 
    v.*,
    sp.description as subscription_description,
    sp.features,
    CASE 
        WHEN u.subscription_status = 'active' THEN
            EXTRACT(epoch FROM (u.subscription_expires_at - CURRENT_TIMESTAMP))/86400
        ELSE 0
    END as days_remaining
FROM v_user_public_profiles v
LEFT JOIN subscription_plans sp ON u.subscription_plan = sp.plan_name AND sp.is_active = true;

-- =============================================
-- 9. Add comments for documentation
-- =============================================

COMMENT ON TABLE users IS 'User accounts with profile and subscription information';
COMMENT ON TABLE notification_preferences IS 'User notification preferences across channels';
COMMENT ON TABLE user_sessions IS 'Active user sessions across devices';
COMMENT ON TABLE subscription_plans IS 'Available subscription tiers and their features';

COMMENT ON COLUMN users.avatar_url IS 'URL to user profile picture';
COMMENT ON COLUMN users.bio IS 'User biography or description';
COMMENT ON COLUMN users.daily_goal_minutes IS 'Daily learning goal in minutes (15-120)';
COMMENT ON COLUMN users.preferred_session_length IS 'Preferred session duration (15-60 minutes)';
COMMENT ON COLUMN users.difficulty_level IS 'Self-reported difficulty preference';
COMMENT ON COLUMN users.learning_style IS 'Learning preference: visual, auditory, read-write, kinesthetic';
COMMENT ON COLUMN users.subscription_plan IS 'Current subscription tier: free, premium, enterprise';
COMMENT ON COLUMN users.subscription_status IS 'Current subscription status: active, cancelled, expired, trial';
COMMENT ON COLUMN users.password_changed_at IS 'Timestamp when password was last changed';

COMMENT ON TABLE notification_preferences IS 'Granular notification preferences per user';

COMMENT ON TABLE user_sessions IS 'Tracks user login sessions for security and UX';
COMMENT ON COLUMN user_sessions.device_info IS 'Detected device/browser information';
COMMENT ON COLUMN user_sessions.ip_address IS 'IP address of session origin';
COMMENT ON COLUMN user_sessions.expires_at IS 'Session expiration timestamp';

COMMENT ON TABLE subscription_plans IS 'Available subscription tiers';

-- =============================================
-- END OF MIGRATION
-- =============================================
