BEGIN;

CREATE TABLE IF NOT EXISTS outlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES learning_projects(id) ON DELETE CASCADE,
  title VARCHAR(255) NOT NULL,
  status VARCHAR(50) NOT NULL DEFAULT 'draft',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT outlines_status_valid CHECK (status IN ('draft', 'published'))
);

CREATE TABLE IF NOT EXISTS outline_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  outline_id UUID NOT NULL REFERENCES outlines(id) ON DELETE CASCADE,
  parent_item_id UUID REFERENCES outline_items(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  title VARCHAR(255) NOT NULL,
  content TEXT,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT outline_items_level_positive CHECK (level > 0),
  CONSTRAINT outline_items_order_index_nonnegative CHECK (order_index >= 0)
);

ALTER TABLE learning_projects
  DROP CONSTRAINT IF EXISTS learning_projects_current_outline_id_fkey;

ALTER TABLE learning_projects
  ADD CONSTRAINT learning_projects_current_outline_id_fkey
  FOREIGN KEY (current_outline_id) REFERENCES outlines(id) ON DELETE SET NULL;

ALTER TABLE questions
  DROP CONSTRAINT IF EXISTS questions_outline_item_id_fkey;

ALTER TABLE questions
  ADD CONSTRAINT questions_outline_item_id_fkey
  FOREIGN KEY (outline_item_id) REFERENCES outline_items(id) ON DELETE SET NULL;

ALTER TABLE progress_snapshots
  DROP CONSTRAINT IF EXISTS progress_snapshots_outline_item_id_fkey;

ALTER TABLE progress_snapshots
  ADD CONSTRAINT progress_snapshots_outline_item_id_fkey
  FOREIGN KEY (outline_item_id) REFERENCES outline_items(id) ON DELETE SET NULL;

ALTER TABLE learning_sessions
  DROP CONSTRAINT IF EXISTS learning_sessions_current_outline_item_id_fkey;

ALTER TABLE learning_sessions
  ADD CONSTRAINT learning_sessions_current_outline_item_id_fkey
  FOREIGN KEY (current_outline_item_id) REFERENCES outline_items(id) ON DELETE SET NULL;

ALTER TABLE deferred_questions
  DROP CONSTRAINT IF EXISTS deferred_questions_outline_item_id_fkey;

ALTER TABLE deferred_questions
  ADD CONSTRAINT deferred_questions_outline_item_id_fkey
  FOREIGN KEY (outline_item_id) REFERENCES outline_items(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_outlines_project_id
  ON outlines (project_id);

CREATE INDEX IF NOT EXISTS idx_outline_items_outline_id_order_index
  ON outline_items (outline_id, order_index);

DROP TRIGGER IF EXISTS outlines_set_updated_at ON outlines;
CREATE TRIGGER outlines_set_updated_at
BEFORE UPDATE ON outlines
FOR EACH ROW
EXECUTE FUNCTION set_updated_at();

COMMIT;
