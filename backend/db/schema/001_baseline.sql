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
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  age INTEGER,
  grade_level VARCHAR(100) NOT NULL DEFAULT 'elementary',
  subjects JSONB NOT NULL DEFAULT '[]'::jsonb,
  learning_style VARCHAR(100) NOT NULL DEFAULT 'visual',
  goals JSONB NOT NULL DEFAULT '[]'::jsonb,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  last_active TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS outlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  course_title VARCHAR(255) NOT NULL,
  subject VARCHAR(255),
  source_type VARCHAR(100) NOT NULL DEFAULT 'manual',
  source_path TEXT,
  topics JSONB NOT NULL DEFAULT '[]'::jsonb,
  ai_summary TEXT NOT NULL DEFAULT '',
  status VARCHAR(100) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  outline_id UUID REFERENCES outlines(id) ON DELETE SET NULL,
  topic VARCHAR(255) NOT NULL,
  type VARCHAR(100) NOT NULL,
  difficulty VARCHAR(50) NOT NULL DEFAULT 'medium',
  prompt TEXT NOT NULL,
  options JSONB NOT NULL DEFAULT '[]'::jsonb,
  correct_answer JSONB,
  explanation TEXT NOT NULL DEFAULT '',
  source VARCHAR(100) NOT NULL DEFAULT 'manual',
  tags JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS answers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  submitted_answer JSONB NOT NULL,
  is_correct BOOLEAN,
  score NUMERIC(5,2),
  feedback TEXT,
  attempt_number INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT answers_attempt_number_positive CHECK (attempt_number > 0)
);

CREATE INDEX IF NOT EXISTS idx_outlines_user_created_at
  ON outlines (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_questions_user_created_at
  ON questions (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_questions_outline_topic
  ON questions (outline_id, topic, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_answers_user_created_at
  ON answers (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_answers_question_attempt_number
  ON answers (question_id, attempt_number);

DROP TRIGGER IF EXISTS users_set_updated_at ON users;
CREATE TRIGGER users_set_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS outlines_set_updated_at ON outlines;
CREATE TRIGGER outlines_set_updated_at
BEFORE UPDATE ON outlines
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS questions_set_updated_at ON questions;
CREATE TRIGGER questions_set_updated_at
BEFORE UPDATE ON questions
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

DROP TRIGGER IF EXISTS answers_set_updated_at ON answers;
CREATE TRIGGER answers_set_updated_at
BEFORE UPDATE ON answers
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;
