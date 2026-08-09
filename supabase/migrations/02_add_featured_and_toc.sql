-- Phase 3 - Migration: Add featured, TOC and full-text search indexes

-- 1. Add featured column to public.articles
ALTER TABLE public.articles ADD COLUMN IF NOT EXISTS featured BOOLEAN DEFAULT false NOT NULL;

-- 2. Add toc column to public.guides
ALTER TABLE public.guides ADD COLUMN IF NOT EXISTS toc JSONB DEFAULT '[]'::jsonb NOT NULL;

-- 3. Create full-text search indexes for articles, guides, and characters
-- We will use generated columns for FTS or simple GIN indexes using standard to_tsvector.
-- Let's create helper search indexes on text columns directly using to_tsvector on english configuration.

-- GIN index on articles
CREATE INDEX IF NOT EXISTS articles_fts_idx ON public.articles USING gin(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, '') || ' ' || coalesce(excerpt, ''))
);

-- GIN index on guides
CREATE INDEX IF NOT EXISTS guides_fts_idx ON public.guides USING gin(
  to_tsvector('english', coalesce(title, '') || ' ' || coalesce(content, ''))
);

-- GIN index on characters
CREATE INDEX IF NOT EXISTS characters_fts_idx ON public.characters USING gin(
  to_tsvector('english', coalesce(name, '') || ' ' || coalesce(biography, ''))
);
