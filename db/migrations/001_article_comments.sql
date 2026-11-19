CREATE TABLE IF NOT EXISTS article_comments (
  id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  article_slug text NOT NULL,
  author_id text NOT NULL,
  author_name text NOT NULL,
  body text NOT NULL CHECK (char_length(body) BETWEEN 1 AND 1000),
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS article_comments_slug_created_at_idx
  ON article_comments (article_slug, created_at);
