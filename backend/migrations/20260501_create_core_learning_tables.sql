-- Core Learning Tables (INTEGER-compatible with existing users table)
-- Creates all tables needed for project/learning workflow

BEGIN;

-- =============================================================
-- learning_projects
-- =============================================================
CREATE TABLE IF NOT EXISTS learning_projects (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  subject VARCHAR(255),
  status VARCHAR(50) NOT NULL DEFAULT 'active',
  current_mode VARCHAR(50),
  current_outline_id INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- source_materials
-- =============================================================
CREATE TABLE IF NOT EXISTS source_materials (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES learning_projects(id) ON DELETE CASCADE,
  source_kind VARCHAR(50) NOT NULL DEFAULT 'upload',
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
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- outlines
-- =============================================================
CREATE TABLE IF NOT EXISTS outlines (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES learning_projects(id) ON DELETE CASCADE,
  title VARCHAR(255),
  status VARCHAR(50) DEFAULT 'active',
  version INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- outline_items
-- =============================================================
CREATE TABLE IF NOT EXISTS outline_items (
  id SERIAL PRIMARY KEY,
  outline_id INTEGER NOT NULL REFERENCES outlines(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES learning_projects(id) ON DELETE CASCADE,
  parent_id INTEGER REFERENCES outline_items(id) ON DELETE SET NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  sort_order INTEGER DEFAULT 0,
  depth INTEGER DEFAULT 0,
  estimated_minutes INTEGER,
  completed BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- questions
-- =============================================================
CREATE TABLE IF NOT EXISTS questions (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES learning_projects(id) ON DELETE CASCADE,
  outline_item_id INTEGER REFERENCES outline_items(id) ON DELETE SET NULL,
  question_type VARCHAR(50) NOT NULL DEFAULT 'multiple_choice',
  question_text TEXT NOT NULL,
  options JSONB DEFAULT '[]',
  correct_answer TEXT,
  explanation TEXT,
  difficulty INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- answer_attempts
-- =============================================================
CREATE TABLE IF NOT EXISTS answer_attempts (
  id SERIAL PRIMARY KEY,
  question_id INTEGER NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  project_id INTEGER NOT NULL REFERENCES learning_projects(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id INTEGER REFERENCES learning_sessions(id) ON DELETE SET NULL,
  user_answer TEXT NOT NULL,
  is_correct BOOLEAN,
  score NUMERIC(5,2),
  feedback_text TEXT,
  attempt_no INTEGER DEFAULT 1,
  answered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- deferred_questions
-- =============================================================
CREATE TABLE IF NOT EXISTS deferred_questions (
  id SERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES learning_projects(id) ON DELETE CASCADE,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  session_id INTEGER REFERENCES learning_sessions(id) ON DELETE SET NULL,
  outline_item_id INTEGER REFERENCES outline_items(id) ON DELETE SET NULL,
  question_text TEXT NOT NULL,
  defer_reason VARCHAR(50),
  status VARCHAR(50) DEFAULT 'deferred',
  brief_response TEXT,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =============================================================
-- Indexes
-- =============================================================
CREATE INDEX IF NOT EXISTS idx_learning_projects_user ON learning_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_source_materials_project ON source_materials(project_id);
CREATE INDEX IF NOT EXISTS idx_outlines_project ON outlines(project_id);
CREATE INDEX IF NOT EXISTS idx_outline_items_outline ON outline_items(outline_id);
CREATE INDEX IF NOT EXISTS idx_questions_project ON questions(project_id);
CREATE INDEX IF NOT EXISTS idx_questions_outline_item ON questions(outline_item_id);
CREATE INDEX IF NOT EXISTS idx_answer_attempts_question ON answer_attempts(question_id);
CREATE INDEX IF NOT EXISTS idx_answer_attempts_user ON answer_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_deferred_questions_user ON deferred_questions(user_id);

-- =============================================================
-- Triggers for updated_at
-- =============================================================
DO $$
DECLARE
  t text;
BEGIN
  FOR t IN SELECT table_name FROM information_schema.tables 
           WHERE table_schema='public' AND table_name IN (
             'learning_projects','source_materials','outlines','outline_items',
             'questions','answer_attempts','deferred_questions')
  LOOP
    EXECUTE format('DROP TRIGGER IF EXISTS trg_%s_updated_at ON %I', t, t);
    EXECUTE format('CREATE TRIGGER trg_%s_updated_at BEFORE UPDATE ON %I FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
  END LOOP;
END $$;

COMMIT;
