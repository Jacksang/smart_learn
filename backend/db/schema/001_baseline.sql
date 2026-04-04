BEGIN;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'student',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS learning_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  current_mode VARCHAR(50),
  current_outline_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS source_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES learning_projects(id) ON DELETE CASCADE,
  source_kind VARCHAR(50) NOT NULL,
  material_type VARCHAR(50) NOT NULL,
  title VARCHAR(255),
  original_file_name VARCHAR(255),
  mime_type VARCHAR(255),
  storage_path TEXT,
  raw_text TEXT,
  extracted_text TEXT,
  weight NUMERIC(5,2) NOT NULL DEFAULT 1.00,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  source_version INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT source_materials_weight_nonnegative CHECK (weight >= 0),
  CONSTRAINT source_materials_source_version_positive CHECK (source_version > 0)
);

CREATE TABLE IF NOT EXISTS outlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES learning_projects(id) ON DELETE CASCADE,
  version_no INTEGER NOT NULL,
  generation_source VARCHAR(50) NOT NULL DEFAULT 'mock_ai',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  summary TEXT,
  created_from_material_version INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT outlines_version_no_positive CHECK (version_no > 0)
);

CREATE TABLE IF NOT EXISTS outline_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outline_id UUID NOT NULL REFERENCES outlines(id) ON DELETE CASCADE,
  parent_item_id UUID REFERENCES outline_items(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  summary TEXT,
  key_points JSONB,
  sort_order INTEGER NOT NULL,
  depth_level INTEGER NOT NULL DEFAULT 0,
  mastery_state VARCHAR(50),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT outline_items_sort_order_nonnegative CHECK (sort_order >= 0),
  CONSTRAINT outline_items_depth_level_nonnegative CHECK (depth_level >= 0)
);

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES learning_projects(id) ON DELETE CASCADE,
  outline_item_id UUID REFERENCES outline_items(id) ON DELETE SET NULL,
  batch_no INTEGER NOT NULL DEFAULT 1,
  position_in_batch INTEGER NOT NULL DEFAULT 1,
  question_type VARCHAR(50) NOT NULL,
  difficulty_level VARCHAR(50) NOT NULL DEFAULT 'medium',
  prompt TEXT NOT NULL,
  options JSONB,
  correct_answer JSONB,
  explanation TEXT,
  generation_source VARCHAR(50) NOT NULL DEFAULT 'mock_ai',
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT questions_batch_no_positive CHECK (batch_no > 0),
  CONSTRAINT questions_position_in_batch_positive CHECK (position_in_batch > 0)
);

CREATE TABLE IF NOT EXISTS progress_snapshots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES learning_projects(id) ON DELETE CASCADE,
  outline_item_id UUID REFERENCES outline_items(id) ON DELETE SET NULL,
  snapshot_type VARCHAR(50) NOT NULL,
  completion_percent NUMERIC(5,2),
  mastery_score NUMERIC(5,2),
  progress_state VARCHAR(50),
  weak_areas JSONB,
  strength_areas JSONB,
  summary_text TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT progress_snapshots_completion_percent_range CHECK (
    completion_percent IS NULL OR (completion_percent >= 0 AND completion_percent <= 100)
  ),
  CONSTRAINT progress_snapshots_mastery_score_range CHECK (
    mastery_score IS NULL OR (mastery_score >= 0 AND mastery_score <= 100)
  )
);

CREATE TABLE IF NOT EXISTS learning_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES learning_projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mode VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  current_outline_item_id UUID REFERENCES outline_items(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  session_summary TEXT,
  motivation_state JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS answer_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES learning_projects(id) ON DELETE CASCADE,
  session_id UUID,
  user_answer JSONB NOT NULL,
  is_correct BOOLEAN,
  score NUMERIC(5,2),
  feedback_text TEXT,
  attempt_no INTEGER NOT NULL DEFAULT 1,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT answer_attempts_attempt_no_positive CHECK (attempt_no > 0),
  CONSTRAINT answer_attempts_score_range CHECK (score IS NULL OR (score >= 0 AND score <= 100))
);

CREATE TABLE IF NOT EXISTS deferred_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES learning_projects(id) ON DELETE CASCADE,
  session_id UUID REFERENCES learning_sessions(id) ON DELETE SET NULL,
  outline_item_id UUID REFERENCES outline_items(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  defer_reason VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'deferred',
  brief_response TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE learning_projects
  DROP CONSTRAINT IF EXISTS learning_projects_current_outline_id_fkey;

ALTER TABLE learning_projects
  ADD CONSTRAINT learning_projects_current_outline_id_fkey
  FOREIGN KEY (current_outline_id) REFERENCES outlines(id) ON DELETE SET NULL;

ALTER TABLE answer_attempts
  DROP CONSTRAINT IF EXISTS answer_attempts_session_id_fkey;

ALTER TABLE answer_attempts
  ADD CONSTRAINT answer_attempts_session_id_fkey
  FOREIGN KEY (session_id) REFERENCES learning_sessions(id) ON DELETE SET NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_learning_projects_current_outline_id_unique
  ON learning_projects (current_outline_id)
  WHERE current_outline_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_learning_projects_user_status_updated_at
  ON learning_projects (user_id, status, updated_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_projects_user_created_at
  ON learning_projects (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_source_materials_project_active_created_at
  ON source_materials (project_id, is_active, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_source_materials_project_source_kind
  ON source_materials (project_id, source_kind);

CREATE UNIQUE INDEX IF NOT EXISTS idx_outlines_project_version_no
  ON outlines (project_id, version_no);

CREATE INDEX IF NOT EXISTS idx_outlines_project_status_created_at
  ON outlines (project_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_outline_items_outline_parent_sort_order
  ON outline_items (outline_id, parent_item_id, sort_order);

CREATE INDEX IF NOT EXISTS idx_outline_items_outline_depth_sort_order
  ON outline_items (outline_id, depth_level, sort_order);

CREATE INDEX IF NOT EXISTS idx_questions_project_status_created_at
  ON questions (project_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_questions_project_outline_item_batch_position
  ON questions (project_id, outline_item_id, batch_no, position_in_batch);

CREATE INDEX IF NOT EXISTS idx_questions_project_batch_no
  ON questions (project_id, batch_no);

CREATE INDEX IF NOT EXISTS idx_answer_attempts_question_answered_at
  ON answer_attempts (question_id, answered_at DESC);

CREATE INDEX IF NOT EXISTS idx_answer_attempts_project_session_answered_at
  ON answer_attempts (project_id, session_id, answered_at DESC);

CREATE UNIQUE INDEX IF NOT EXISTS idx_answer_attempts_question_attempt_no
  ON answer_attempts (question_id, attempt_no);

CREATE INDEX IF NOT EXISTS idx_progress_snapshots_project_created_at
  ON progress_snapshots (project_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_progress_snapshots_project_outline_item_created_at
  ON progress_snapshots (project_id, outline_item_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_progress_snapshots_project_snapshot_type_created_at
  ON progress_snapshots (project_id, snapshot_type, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deferred_questions_project_status_created_at
  ON deferred_questions (project_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deferred_questions_session_status_created_at
  ON deferred_questions (session_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_deferred_questions_outline_item_status_created_at
  ON deferred_questions (outline_item_id, status, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_sessions_project_status_started_at
  ON learning_sessions (project_id, status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_sessions_user_status_started_at
  ON learning_sessions (user_id, status, started_at DESC);

CREATE INDEX IF NOT EXISTS idx_learning_sessions_project_current_outline_item
  ON learning_sessions (project_id, current_outline_item_id);

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS learning_projects_set_updated_at ON learning_projects;
CREATE TRIGGER learning_projects_set_updated_at
BEFORE UPDATE ON learning_projects
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS source_materials_set_updated_at ON source_materials;
CREATE TRIGGER source_materials_set_updated_at
BEFORE UPDATE ON source_materials
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS outlines_set_updated_at ON outlines;
CREATE TRIGGER outlines_set_updated_at
BEFORE UPDATE ON outlines
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS outline_items_set_updated_at ON outline_items;
CREATE TRIGGER outline_items_set_updated_at
BEFORE UPDATE ON outline_items
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS questions_set_updated_at ON questions;
CREATE TRIGGER questions_set_updated_at
BEFORE UPDATE ON questions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS learning_sessions_set_updated_at ON learning_sessions;
CREATE TRIGGER learning_sessions_set_updated_at
BEFORE UPDATE ON learning_sessions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS deferred_questions_set_updated_at ON deferred_questions;
CREATE TRIGGER deferred_questions_set_updated_at
BEFORE UPDATE ON deferred_questions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;
