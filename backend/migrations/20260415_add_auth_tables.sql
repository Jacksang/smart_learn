-- Smart Learn Enhanced Authentication Database Setup
-- Creates tables for password reset, email verification, sessions, and OAuth

-- == SECTION 1: Password Reset Tokens ==
CREATE TABLE IF NOT EXISTS password_reset_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP
);

-- Index for token lookup
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_token ON password_reset_tokens(token);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_user ON password_reset_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_password_reset_tokens_expires ON password_reset_tokens(expires_at);

-- == SECTION 2: Email Verification Tokens ==
CREATE TABLE IF NOT EXISTS email_verification_tokens (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    token VARCHAR(255) UNIQUE NOT NULL,
    email VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    used_at TIMESTAMP
);

-- Index for token lookup
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_token ON email_verification_tokens(token);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_user ON email_verification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_email_verification_tokens_expires ON email_verification_tokens(expires_at);

-- == SECTION 3: OAuth Users ==
CREATE TABLE IF NOT EXISTS oauth_users (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    provider VARCHAR(50) NOT NULL,
    provider_user_id VARCHAR(255) NOT NULL,
    access_token TEXT,
    refresh_token TEXT,
    token_expires_at TIMESTAMP,
    email VARCHAR(255),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(provider, provider_user_id)
);

-- Index for token lookup
CREATE INDEX IF NOT EXISTS idx_oauth_users_user ON oauth_users(user_id);
CREATE INDEX IF NOT EXISTS idx_oauth_users_provider ON oauth_users(provider);

-- == SECTION 4: Add columns to users table ==

-- Add email verification column if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'email_verified'
    ) THEN
        ALTER TABLE users ADD COLUMN email_verified BOOLEAN DEFAULT false;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_password_reset_at'
    ) THEN
        ALTER TABLE users ADD COLUMN last_password_reset_at TIMESTAMP;
    END IF;
END $$;

-- == SECTION 5: Database functions and triggers ==

-- Function to update updated_at timestamp for oauth_users
CREATE OR REPLACE FUNCTION update_oauth_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for oauth_users table
DROP TRIGGER IF EXISTS update_oauth_updated_at ON oauth_users;
CREATE TRIGGER update_oauth_updated_at
    BEFORE UPDATE ON oauth_users
    FOR EACH ROW
    EXECUTE FUNCTION update_oauth_updated_at_column();

-- Function to expire tokens (called via cron or trigger)
CREATE OR REPLACE FUNCTION expire_tokens()
RETURNS void AS $$
BEGIN
    -- Expire password reset tokens older than 1 hour
    DELETE FROM password_reset_tokens 
    WHERE expires_at < NOW() OR used_at IS NOT NULL;
    
    -- Expire email verification tokens older than 24 hours
    DELETE FROM email_verification_tokens 
    WHERE expires_at < NOW() OR used_at IS NOT NULL;
    
    -- Expire OAuth tokens older than their expiration
    UPDATE oauth_users 
    SET access_token = NULL, refresh_token = NULL, token_expires_at = NULL
    WHERE token_expires_at IS NOT NULL AND token_expires_at < NOW();
END;
$$ language 'plpgsql';

-- == SECTION 6: Views ==

-- View for active password reset tokens
CREATE OR REPLACE VIEW v_active_password_reset_tokens AS
SELECT 
    prt.id,
    prt.user_id,
    prt.token,
    prt.expires_at,
    prt.created_at
FROM password_reset_tokens prt
WHERE prt.used_at IS NULL 
  AND prt.expires_at > NOW();

-- View for active email verification tokens
CREATE OR REPLACE VIEW v_active_email_verification_tokens AS
SELECT 
    evt.id,
    evt.user_id,
    evt.token,
    evt.email,
    evt.expires_at,
    evt.created_at
FROM email_verification_tokens evt
WHERE evt.used_at IS NULL 
  AND evt.expires_at > NOW();

-- View for OAuth users with providers
CREATE OR REPLACE VIEW v_oauth_users_extended AS
SELECT 
    ou.id,
    ou.user_id,
    ou.provider,
    ou.provider_user_id,
    ou.access_token,
    ou.refresh_token,
    ou.token_expires_at,
    ou.email,
    ou.created_at,
    ou.updated_at,
    u.display_name,
    u.email as user_email
FROM oauth_users ou
LEFT JOIN users u ON ou.user_id = u.id;

-- == SECTION 7: Comments ==

COMMENT ON TABLE password_reset_tokens IS 'Password reset tokens with expiration tracking';
COMMENT ON TABLE email_verification_tokens IS 'Email verification tokens with expiration tracking';
COMMENT ON TABLE oauth_users IS 'OAuth provider integrations for user accounts';
COMMENT ON VIEW v_active_password_reset_tokens IS 'Active (non-expired, non-used) password reset tokens';
COMMENT ON VIEW v_active_email_verification_tokens IS 'Active (non-expired, non-used) email verification tokens';
COMMENT ON VIEW v_oauth_users_extended IS 'OAuth users with user details';

COMMENT ON COLUMN password_reset_tokens.token IS 'Cryptographically secure random token';
COMMENT ON COLUMN password_reset_tokens.expires_at IS 'Token expiration (1 hour from creation)';
COMMENT ON COLUMN password_reset_tokens.used_at IS 'Timestamp when token was used';
COMMENT ON COLUMN email_verification_tokens.token IS 'Cryptographically secure random token';
COMMENT ON COLUMN email_verification_tokens.expires_at IS 'Token expiration (24 hours from creation)';
COMMENT ON COLUMN email_verification_tokens.used_at IS 'Timestamp when token was used';
COMMENT ON COLUMN oauth_users.access_token IS 'Encrypted access token from provider';
COMMENT ON COLUMN oauth_users.refresh_token IS 'Encrypted refresh token from provider';
