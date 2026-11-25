import { neon } from '@neondatabase/serverless';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = join(__dirname, '..', '.env.local');

const env = readFileSync(envPath, 'utf8');
const match = env.match(/^DATABASE_URL_UNPOOLED="?([^"\n]+)"?/m);
if (!match) throw new Error('DATABASE_URL_UNPOOLED not found in .env.local');
const url = match[1];

console.log('Connecting to Neon DB...');
const sql = neon(url);

async function run() {
  // Create columns table
  await sql`CREATE TABLE IF NOT EXISTS kanban_columns (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    position INTEGER NOT NULL DEFAULT 0,
    color TEXT NOT NULL DEFAULT '#6366f1',
    wip_limit INTEGER CHECK (wip_limit IS NULL OR wip_limit > 0),
    is_done BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
  )`;

  await sql`ALTER TABLE kanban_columns
    ADD COLUMN IF NOT EXISTS wip_limit INTEGER,
    ADD COLUMN IF NOT EXISTS is_done BOOLEAN NOT NULL DEFAULT false`;
  console.log('✓ kanban_columns table ready');

  // Create tasks table
  await sql`CREATE TABLE IF NOT EXISTS kanban_tasks (
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
  )`;

  await sql`ALTER TABLE kanban_tasks
    ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'blog',
    ADD COLUMN IF NOT EXISTS estimated_minutes INTEGER,
    ADD COLUMN IF NOT EXISTS checklist JSONB NOT NULL DEFAULT '[]'::jsonb,
    ADD COLUMN IF NOT EXISTS linked_article_slug TEXT NOT NULL DEFAULT '',
    ADD COLUMN IF NOT EXISTS archived BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS completed_at TIMESTAMPTZ`;

  await sql`CREATE INDEX IF NOT EXISTS kanban_tasks_column_pos_idx ON kanban_tasks (column_id, position)`;
  await sql`CREATE INDEX IF NOT EXISTS kanban_tasks_archived_due_idx ON kanban_tasks (archived, due_date)`;
  console.log('✓ kanban_tasks table ready');

  // Seed default columns if none exist
  const existing = await sql`SELECT COUNT(*) as count FROM kanban_columns`;
  if (existing[0].count === '0') {
    await sql`INSERT INTO kanban_columns (title, position, color, wip_limit, is_done) VALUES
      ('Ideas & Backlog', 0, '#8b5cf6', NULL, false),
      ('To Do', 1, '#3b82f6', 5, false),
      ('In Progress', 2, '#f59e0b', 3, false),
      ('Review', 3, '#06b6d4', 3, false),
      ('Done', 4, '#10b981', NULL, true)`;
    console.log('✓ Default columns seeded');
  } else {
    // Ensure any existing "Done" column is marked is_done = true
    await sql`UPDATE kanban_columns SET is_done = true WHERE LOWER(title) LIKE '%done%' AND is_done = false`;
    // Set sensible WIP limit on In Progress if unset
    await sql`UPDATE kanban_columns SET wip_limit = 3 WHERE LOWER(title) = 'in progress' AND wip_limit IS NULL`;
    console.log('✓ Columns migrated');
  }

  const cols = await sql`SELECT id, title, color, position, wip_limit, is_done FROM kanban_columns ORDER BY position`;
  console.log('\nFinal columns:');
  cols.forEach(c => console.log(`  [${c.position}] ${c.title} (${c.color}) wip=${c.wip_limit ?? '∞'} done=${c.is_done}`));
  console.log('\nSUCCESS - Kanban DB is ready!');
}

run().catch(e => { console.error('SETUP ERROR:', e.message); process.exit(1); });
