CREATE TABLE IF NOT EXISTS kanban_columns (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  position INTEGER NOT NULL DEFAULT 0,
  color TEXT NOT NULL DEFAULT '#6366f1',
  wip_limit INTEGER CHECK (wip_limit IS NULL OR wip_limit > 0),
  is_done BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE kanban_columns
  ADD COLUMN IF NOT EXISTS wip_limit INTEGER,
  ADD COLUMN IF NOT EXISTS is_done BOOLEAN NOT NULL DEFAULT false;

CREATE TABLE IF NOT EXISTS kanban_tasks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  column_id UUID NOT NULL REFERENCES kanban_columns(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  priority TEXT NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  category TEXT NOT NULL DEFAULT 'blog',
  label TEXT NOT NULL DEFAULT '',
  due_date DATE,
  estimated_minutes INTEGER CHECK (estimated_minutes IS NULL OR estimated_minutes >= 0),
  checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  linked_article_slug TEXT NOT NULL DEFAULT '',
  archived BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE kanban_tasks
  ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'blog',
  ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER,
  ADD COLUMN IF NOT EXISTS checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS linked_article_slug TEXT NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS kanban_tasks_column_pos_idx
  ON kanban_tasks (column_id, position);

CREATE INDEX IF NOT EXISTS kanban_tasks_archived_due_idx
  ON kanban_tasks (archived, due_date);
