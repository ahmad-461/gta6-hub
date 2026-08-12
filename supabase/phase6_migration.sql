-- GTA 6 Hub - Phase 6 AI Intelligence Layer + Content Insights Migrations

-- 1. Enable the pgvector extension (ensure it exists)
CREATE EXTENSION IF NOT EXISTS vector;

-- 2. Embeddings Table
CREATE TABLE IF NOT EXISTS public.article_embeddings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    content_id UUID NOT NULL,
    content_type TEXT NOT NULL CHECK (content_type IN ('article', 'guide')),
    chunk_text TEXT NOT NULL,
    embedding vector(768) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Lore Topics Table
CREATE TABLE IF NOT EXISTS public.lore_topics (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT UNIQUE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('location', 'topic')),
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Lore Connections Table (co-occurrence cache)
CREATE TABLE IF NOT EXISTS public.lore_connections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    source_id UUID NOT NULL,
    source_type TEXT NOT NULL CHECK (source_type IN ('character', 'topic')),
    target_id UUID NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('character', 'topic')),
    article_ids JSONB DEFAULT '[]'::jsonb NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_connection UNIQUE (source_id, target_id)
);

-- Enable RLS
ALTER TABLE public.article_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lore_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lore_connections ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to be safe
DROP POLICY IF EXISTS "Allow public read-only article_embeddings" ON public.article_embeddings;
DROP POLICY IF EXISTS "Allow admin/editor write article_embeddings" ON public.article_embeddings;
DROP POLICY IF EXISTS "Allow public read-only lore_topics" ON public.lore_topics;
DROP POLICY IF EXISTS "Allow admin/editor write lore_topics" ON public.lore_topics;
DROP POLICY IF EXISTS "Allow public read-only lore_connections" ON public.lore_connections;
DROP POLICY IF EXISTS "Allow admin/editor write lore_connections" ON public.lore_connections;

-- Policies for article_embeddings
CREATE POLICY "Allow public read-only article_embeddings" ON public.article_embeddings
  FOR SELECT USING (true);

CREATE POLICY "Allow admin/editor write article_embeddings" ON public.article_embeddings
  FOR ALL USING (public.get_user_role() IN ('admin', 'editor'));

-- Policies for lore_topics
CREATE POLICY "Allow public read-only lore_topics" ON public.lore_topics
  FOR SELECT USING (true);

CREATE POLICY "Allow admin/editor write lore_topics" ON public.lore_topics
  FOR ALL USING (public.get_user_role() IN ('admin', 'editor'));

-- Policies for lore_connections
CREATE POLICY "Allow public read-only lore_connections" ON public.lore_connections
  FOR SELECT USING (true);

CREATE POLICY "Allow admin/editor write lore_connections" ON public.lore_connections
  FOR ALL USING (public.get_user_role() IN ('admin', 'editor'));

-- 5. Postgres Cosine Similarity Search function
CREATE OR REPLACE FUNCTION public.match_article_embeddings(
  query_embedding vector(768),
  match_threshold float,
  match_count int
)
RETURNS TABLE (
  id uuid,
  content_id uuid,
  content_type text,
  chunk_text text,
  similarity float
)
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT
    ae.id,
    ae.content_id,
    ae.content_type,
    ae.chunk_text,
    1 - (ae.embedding <=> query_embedding) AS similarity
  FROM public.article_embeddings ae
  WHERE 1 - (ae.embedding <=> query_embedding) > match_threshold
  ORDER BY ae.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
