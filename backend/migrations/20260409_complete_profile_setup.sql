-- Smart Learn User Profile & Settings Database Extension
-- Creates or extends the users table with profile management features

-- == SECTION 1: Create users table if it doesn't exist ==
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),
    display_name VARCHAR(100),
    avatar_url TEXT,
    bio TEXT,
    learning_style VARCHAR(50),
    daily_goal_minutes INTEGER DEFAULT 30 CHECK (daily_goal_minutes >= 15 AND daily_goal_minutes <= 120),
    preferred_session_length INTEGER DEFAULT 30,
    difficulty_level VARCHAR(50),
    role VARCHAR(50) DEFAULT 'student',
    status VARCHAR(50) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
    subscription_plan VARCHAR(50) DEFAULT 'free',
    subscription_status VARCHAR(50) DEFAULT 'active',
    subscription_expires_at TIMESTAMP,
    last_data_export_at TIMESTAMP,
    password_changed_at TIMESTAMP,
    last_login_at TIMESTAMP,
    last_active_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- == SECTION 2: Create supporting tables ==

-- Notification preferences table
CREATE TABLE IF NOT EXISTS notification_preferences (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    email_notifications BOOLEAN DEFAULT TRUE,
    push_notifications BOOLEAN DEFAULT TRUE,
    weekly_summary BOOLEAN DEFAULT TRUE,
    streak_reminders BOOLEAN DEFAULT TRUE,
    achievement_notifications BOOLEAN DEFAULT TRUE,
    learning_tips BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id)
);

-- User sessions table for session management
CREATE TABLE IF NOT EXISTS user_sessions (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    session_token VARCHAR(255) UNIQUE NOT NULL,
    refresh_token VARCHAR(255) UNIQUE NOT NULL,
    device_info JSONB,
    ip_address VARCHAR(45),
    is_active BOOLEAN DEFAULT TRUE,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_accessed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Extension: subscription_plans table (if not already created)
CREATE TABLE IF NOT EXISTS subscription_plans (
    id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    monthly_price DECIMAL(10,2),
    yearly_price DECIMAL(10,2),
    features JSONB,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert default subscription plans
INSERT INTO subscription_plans (name, description, monthly_price, yearly_price, features)
VALUES 
    ('free', 'Basic free tier', 0.00, 0.00, 
     '["unlimited_learning", "5_materials", "basic_analytics", "email_support"]'::jsonb)
    ON CONFLICT (name) DO NOTHING;

INSERT INTO subscription_plans (name, description, monthly_price, yearly_price, features)
VALUES 
    ('premium', 'Premium features', 9.99, 99.99, 
     '["unlimited_learning", "unlimited_materials", "advanced_analytics", "priority_support", "offline_access", "ai_tutor"]'::jsonb)
    ON CONFLICT (name) DO NOTHING;

INSERT INTO subscription_plans (name, description, monthly_price, yearly_price, features)
VALUES 
    ('enterprise', 'Enterprise/Team plan', 29.99, 299.99, 
     '["unlimited_learning", "unlimited_materials", "analytics_dashboard", "api_access", "custom_branding", "team_management"]'::jsonb)
    ON CONFLICT (name) DO NOTHING;

-- == SECTION 3: Create views and indexes ==

-- View for safe public profile queries
CREATE OR REPLACE VIEW v_user_public_profiles AS
SELECT 
    u.id,
    u.display_name,
    u.avatar_url,
    u.bio,
    u.created_at,
    u.status,
    'free' as subscription_plan
FROM users u
WHERE u.status = 'active' AND u.display_name IS NOT NULL;

-- View for complete user data with subscription
CREATE OR REPLACE VIEW v_user_full_profiles AS
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
    u.learning_style,
    u.daily_goal_minutes,
    u.preferred_session_length,
    u.difficulty_level,
    COALESCE(sp.name, 'free') as subscription_plan,
    COALESCE(sp.monthly_price, 0.00) as monthly_price,
    COALESCE(sp.yearly_price, 0.00) as yearly_price,
    u.subscription_status,
    u.subscription_expires_at
FROM users u
LEFT JOIN subscription_plans sp ON u.subscription_plan = sp.name;

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_users_last_active ON users(last_active_at);
CREATE INDEX IF NOT EXISTS idx_notification_prefs_user ON notification_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_user_sessions_user ON user_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_sessions_expires ON user_sessions(expires_at);

-- == SECTION 4: Database functions and triggers ==

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for users table
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger for notification_preferences table
DROP TRIGGER IF EXISTS update_notification_prefs_updated_at ON notification_preferences;
CREATE TRIGGER update_notification_prefs_updated_at
    BEFORE UPDATE ON notification_preferences
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- == SECTION 5: Add constraints if columns exist ==

-- Add constraints for export tracking
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'last_data_export_at') THEN
        BEGIN
            ALTER TABLE users ADD CONSTRAINT unique_export_tracking 
                CHECK (last_data_export_at IS NULL OR last_data_export_at > NOW() - INTERVAL '30 days');
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'Export tracking constraint already exists, skipping';
        END;
    END IF;
END $$;

-- Add constraints for subscription validation
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'subscription_plan') THEN
        BEGIN
            ALTER TABLE users ADD CONSTRAINT valid_subscription_plan 
                CHECK (subscription_plan IN ('free', 'premium', 'enterprise'));
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'Subscription plan constraint already exists, skipping';
        END;
    END IF;
END $$;

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns 
               WHERE table_name = 'users' AND column_name = 'subscription_status') THEN
        BEGIN
            ALTER TABLE users ADD CONSTRAINT valid_subscription_status 
                CHECK (subscription_status IN ('active', 'expired', 'cancelled'));
        EXCEPTION WHEN others THEN
            RAISE NOTICE 'Subscription status constraint already exists, skipping';
        END;
    END IF;
END $$;

-- == SECTION 6: Comments for documentation ==
COMMENT ON TABLE users IS 'User accounts with profile management and preferences';
COMMENT ON TABLE notification_preferences IS 'User notification preferences across all channels';
COMMENT ON TABLE user_sessions IS 'Active user sessions for security and management';
COMMENT ON TABLE subscription_plans IS 'Available subscription tiers and pricing';
COMMENT ON VIEW v_user_public_profiles IS 'Safe view for public user profiles';
COMMENT ON VIEW v_user_full_profiles IS 'Complete user data with subscription details';
