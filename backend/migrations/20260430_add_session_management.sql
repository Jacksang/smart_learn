-- D11.3 Session Management APIs — Database Migration
-- Uses INTEGER IDs to match existing users table

BEGIN;

-- =============================================================
-- SECTION 1: learning_sessions (core + D11.3 extensions)
-- =============================================================

CREATE TABLE IF NOT EXISTS learning_sessions (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode VARCHAR(50) NOT NULL DEFAULT 'learn',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  current_outline_item_id INTEGER,
  current_question_id VARCHAR(255),
  progress INTEGER DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  paused_at TIMESTAMPTZ,
  ended_at TIMESTAMPTZ,
  session_summary TEXT,
  motivation_state JSONB,
  -- D11.3 new columns
  current_mode VARCHAR(50) DEFAULT 'learn',
  pause_reason VARCHAR(100),
  session_duration INTEGER DEFAULT 0,
  last_progress_update TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- SECTION 2: session_progress_snapshots
-- =============================================================

CREATE TABLE IF NOT EXISTS session_progress_snapshots (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  progress INTEGER NOT NULL DEFAULT 0,
  current_outline_item_id INTEGER,
  current_question_id VARCHAR(255),
  questions_answered INTEGER DEFAULT 0,
  correct_answers INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0,
  mood INTEGER CHECK (mood IS NULL OR (mood >= 1 AND mood <= 5)),
  notes TEXT,
  data JSONB DEFAULT '{}'
);

-- =============================================================
-- SECTION 3: session_summaries
-- =============================================================

CREATE TABLE IF NOT EXISTS session_summaries (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
  title VARCHAR(255),
  summary TEXT,
  insights JSONB DEFAULT '{}',
  weak_areas JSONB DEFAULT '[]',
  strengths JSONB DEFAULT '[]',
  next_recommendations JSONB DEFAULT '[]',
  mastery_change INTEGER DEFAULT 0,
  time_spent INTEGER DEFAULT 0,
  questions_attempted INTEGER DEFAULT 0,
  questions_correct INTEGER DEFAULT 0,
  accuracy NUMERIC(5,2),
  created BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- SECTION 4: session_mode_history
-- =============================================================

CREATE TABLE IF NOT EXISTS session_mode_history (
  id SERIAL PRIMARY KEY,
  session_id INTEGER NOT NULL REFERENCES learning_sessions(id) ON DELETE CASCADE,
  from_mode VARCHAR(50),
  to_mode VARCHAR(50) NOT NULL,
  reason VARCHAR(255),
  previous_mode_data JSONB,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- SECTION 5: Indexes
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_learning_sessions_prj_status
  ON learning_sessions(project_id, status);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_usr_status
  ON learning_sessions(user_id, status);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_prj_started
  ON learning_sessions(project_id, started_at DESC);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_mode
  ON learning_sessions(mode, project_id);
CREATE INDEX IF NOT EXISTS idx_learning_sessions_progress
  ON learning_sessions(project_id, last_progress_update);

CREATE INDEX IF NOT EXISTS idx_session_progress_session
  ON session_progress_snapshots(session_id);
CREATE INDEX IF NOT EXISTS idx_session_progress_ts
  ON session_progress_snapshots(session_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_session_summaries_session
  ON session_summaries(session_id);

CREATE INDEX IF NOT EXISTS idx_session_mode_session
  ON session_mode_history(session_id);
CREATE INDEX IF NOT EXISTS idx_session_mode_ts
  ON session_mode_history(session_id, timestamp DESC);

-- =============================================================
-- SECTION 6: Trigger for auto updated_at
-- =============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_learning_sessions_updated_at ON learning_sessions;
CREATE TRIGGER trg_learning_sessions_updated_at
  BEFORE UPDATE ON learning_sessions
  FOR EACH ROW
  EXECUTE FUNCTION set_updated_at();

COMMIT;
