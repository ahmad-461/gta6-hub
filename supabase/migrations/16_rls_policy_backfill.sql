-- GTA 6 Hub - Phase 16 Database Security & Activity Logging Migration
-- Closing security gaps with comprehensive Row Level Security (RLS) policies

-- 1. Create activity_log table for CMS auditing
CREATE TABLE IF NOT EXISTS public.activity_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    actor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    action TEXT NOT NULL, -- e.g., 'created', 'updated', 'deleted', 'published'
    entity_type TEXT NOT NULL, -- e.g., 'article', 'guide', 'character', 'cheat_code', 'comment'
    entity_id UUID, -- Optional direct ID reference (if UUID)
    entity_title TEXT, -- Human-readable label or description (e.g., article title) for joinless quick rendering
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Audit and Enable RLS on every table in the public schema
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.guides ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.cheat_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_embeddings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lore_topics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.lore_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trailer_breakdowns ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.trailer_breakdown_moments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_points ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wishlist_votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_log ENABLE ROW LEVEL SECURITY;

-- 3. Standardize helper functions for RLS checks
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin' AND disabled = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.is_active_staff()
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role IN ('admin', 'editor') AND disabled = false
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Rebuild Clean Policies for All Tables

-- --- PROFILES POLICY (Tighter Restrictions) ---
DROP POLICY IF EXISTS "Allow public read-only profiles" ON public.profiles;
DROP POLICY IF EXISTS "Allow users to update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Allow admin/editor write profiles" ON public.profiles;

-- Public can select nothing by default. Users can read their own profile. Admin can read all profiles.
CREATE POLICY "Allow users to read own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Allow admin to read all profiles" ON public.profiles
  FOR SELECT USING (public.is_admin());

CREATE POLICY "Allow users to update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id AND public.is_active_staff());

CREATE POLICY "Allow admin full access to profiles" ON public.profiles
  FOR ALL USING (public.is_admin());

-- --- CATEGORIES POLICY ---
DROP POLICY IF EXISTS "Allow public read categories" ON public.categories;
DROP POLICY IF EXISTS "Allow admin/editor write categories" ON public.categories;

CREATE POLICY "Allow public read categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Allow active staff write categories" ON public.categories
  FOR ALL USING (public.is_active_staff());

-- --- ARTICLES POLICY ---
DROP POLICY IF EXISTS "Allow public read published articles" ON public.articles;
DROP POLICY IF EXISTS "Allow admin/editor read draft/archived articles" ON public.articles;
DROP POLICY IF EXISTS "Allow admin/editor write articles" ON public.articles;

CREATE POLICY "Allow public read published articles" ON public.articles
  FOR SELECT USING (status = 'published');

CREATE POLICY "Allow active staff access to all articles" ON public.articles
  FOR SELECT USING (public.is_active_staff());

CREATE POLICY "Allow active staff write articles" ON public.articles
  FOR ALL USING (public.is_active_staff());

-- --- GUIDES POLICY ---
DROP POLICY IF EXISTS "Allow public read published guides" ON public.guides;
DROP POLICY IF EXISTS "Allow admin/editor read draft/archived guides" ON public.guides;
DROP POLICY IF EXISTS "Allow admin/editor write guides" ON public.guides;

CREATE POLICY "Allow public read published guides" ON public.guides
  FOR SELECT USING (status = 'published');

CREATE POLICY "Allow active staff access to all guides" ON public.guides
  FOR SELECT USING (public.is_active_staff());

CREATE POLICY "Allow active staff write guides" ON public.guides
  FOR ALL USING (public.is_active_staff());

-- --- CHARACTERS POLICY ---
DROP POLICY IF EXISTS "Allow public read published characters" ON public.characters;
DROP POLICY IF EXISTS "Allow admin/editor read draft/archived characters" ON public.characters;
DROP POLICY IF EXISTS "Allow admin/editor write characters" ON public.characters;

CREATE POLICY "Allow public read published characters" ON public.characters
  FOR SELECT USING (status = 'published');

CREATE POLICY "Allow active staff access to all characters" ON public.characters
  FOR SELECT USING (public.is_active_staff());

CREATE POLICY "Allow active staff write characters" ON public.characters
  FOR ALL USING (public.is_active_staff());

-- --- CHEAT CODES POLICY ---
DROP POLICY IF EXISTS "Allow public read cheat codes" ON public.cheat_codes;
DROP POLICY IF EXISTS "Allow admin/editor write cheat codes" ON public.cheat_codes;

CREATE POLICY "Allow public read cheat codes" ON public.cheat_codes
  FOR SELECT USING (true);

CREATE POLICY "Allow active staff write cheat codes" ON public.cheat_codes
  FOR ALL USING (public.is_active_staff());

-- --- MEDIA POLICY ---
DROP POLICY IF EXISTS "Allow public read media references" ON public.media;
DROP POLICY IF EXISTS "Allow admin/editor write media references" ON public.media;

CREATE POLICY "Allow public read media references" ON public.media
  FOR SELECT USING (true);

CREATE POLICY "Allow active staff write media references" ON public.media
  FOR ALL USING (public.is_active_staff());

-- --- TAGS & ARTICLE_TAGS POLICY ---
DROP POLICY IF EXISTS "Allow public read tags" ON public.tags;
DROP POLICY IF EXISTS "Allow admin/editor write tags" ON public.tags;
DROP POLICY IF EXISTS "Allow public read article tags relation" ON public.article_tags;
DROP POLICY IF EXISTS "Allow admin/editor write article tags relation" ON public.article_tags;

CREATE POLICY "Allow public read tags" ON public.tags
  FOR SELECT USING (true);

CREATE POLICY "Allow active staff write tags" ON public.tags
  FOR ALL USING (public.is_active_staff());

CREATE POLICY "Allow public read article tags relation" ON public.article_tags
  FOR SELECT USING (true);

CREATE POLICY "Allow active staff write article tags relation" ON public.article_tags
  FOR ALL USING (public.is_active_staff());

-- --- COMMENTS POLICY (Secure status logic) ---
DROP POLICY IF EXISTS "Allow public read approved comments" ON public.comments;
DROP POLICY IF EXISTS "Allow admin/editor read all comments" ON public.comments;
DROP POLICY IF EXISTS "Allow public insert comments" ON public.comments;
DROP POLICY IF EXISTS "Allow admin/editor manage comments" ON public.comments;
DROP POLICY IF EXISTS "Allow admin/editor delete comments" ON public.comments;

CREATE POLICY "Allow public read approved comments" ON public.comments
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Allow active staff read all comments" ON public.comments
  FOR SELECT USING (public.is_active_staff());

CREATE POLICY "Allow public insert comments" ON public.comments
  FOR INSERT WITH CHECK (status = 'pending');

CREATE POLICY "Allow active staff update comments" ON public.comments
  FOR UPDATE USING (public.is_active_staff());

CREATE POLICY "Allow active staff delete comments" ON public.comments
  FOR DELETE USING (public.is_active_staff());

-- --- POLLS POLICY ---
DROP POLICY IF EXISTS "Allow public read active polls" ON public.polls;
DROP POLICY IF EXISTS "Allow public vote insert/update on polls" ON public.polls;
DROP POLICY IF EXISTS "Allow admin/editor write polls" ON public.polls;

CREATE POLICY "Allow public read active polls" ON public.polls
  FOR SELECT USING (true);

CREATE POLICY "Allow public vote update on polls" ON public.polls
  FOR UPDATE USING (active = true);

CREATE POLICY "Allow active staff write polls" ON public.polls
  FOR ALL USING (public.is_active_staff());

-- --- SITE SETTINGS POLICY (Admin only) ---
DROP POLICY IF EXISTS "Allow public read site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow admin manage site settings" ON public.site_settings;

CREATE POLICY "Allow public read site settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Allow admin manage site settings" ON public.site_settings
  FOR ALL USING (public.is_admin());

-- --- ARTICLE EMBEDDINGS POLICY ---
DROP POLICY IF EXISTS "Allow public read-only article_embeddings" ON public.article_embeddings;
DROP POLICY IF EXISTS "Allow admin/editor write article_embeddings" ON public.article_embeddings;

CREATE POLICY "Allow public read-only article_embeddings" ON public.article_embeddings
  FOR SELECT USING (true);

CREATE POLICY "Allow active staff write article_embeddings" ON public.article_embeddings
  FOR ALL USING (public.is_active_staff());

-- --- LORE TOPICS POLICY ---
DROP POLICY IF EXISTS "Allow public read-only lore_topics" ON public.lore_topics;
DROP POLICY IF EXISTS "Allow admin/editor write lore_topics" ON public.lore_topics;

CREATE POLICY "Allow public read-only lore_topics" ON public.lore_topics
  FOR SELECT USING (true);

CREATE POLICY "Allow active staff write lore_topics" ON public.lore_topics
  FOR ALL USING (public.is_active_staff());

-- --- LORE CONNECTIONS POLICY ---
DROP POLICY IF EXISTS "Allow public read-only lore_connections" ON public.lore_connections;
DROP POLICY IF EXISTS "Allow admin/editor write lore_connections" ON public.lore_connections;

CREATE POLICY "Allow public read-only lore_connections" ON public.lore_connections
  FOR SELECT USING (true);

CREATE POLICY "Allow active staff write lore_connections" ON public.lore_connections
  FOR ALL USING (public.is_active_staff());

-- --- MAP LOCATIONS POLICY ---
DROP POLICY IF EXISTS "Allow public read-only map locations" ON public.map_locations;
DROP POLICY IF EXISTS "Allow admin/editor write map locations" ON public.map_locations;

CREATE POLICY "Allow public read-only map locations" ON public.map_locations
  FOR SELECT USING (true);

CREATE POLICY "Allow active staff write map locations" ON public.map_locations
  FOR ALL USING (public.is_active_staff());

-- --- TRAILER BREAKDOWNS POLICY ---
DROP POLICY IF EXISTS "Allow public read published trailer breakdowns" ON public.trailer_breakdowns;
DROP POLICY IF EXISTS "Allow admin/editor read draft/archived trailer breakdowns" ON public.trailer_breakdowns;
DROP POLICY IF EXISTS "Allow admin/editor write trailer breakdowns" ON public.trailer_breakdowns;

CREATE POLICY "Allow public read published trailer breakdowns" ON public.trailer_breakdowns
  FOR SELECT USING (status = 'published');

CREATE POLICY "Allow active staff read all trailer breakdowns" ON public.trailer_breakdowns
  FOR SELECT USING (public.is_active_staff());

CREATE POLICY "Allow active staff write trailer breakdowns" ON public.trailer_breakdowns
  FOR ALL USING (public.is_active_staff());

-- --- TRAILER BREAKDOWN MOMENTS POLICY ---
DROP POLICY IF EXISTS "Allow public read trailer breakdown moments" ON public.trailer_breakdown_moments;
DROP POLICY IF EXISTS "Allow admin/editor write trailer breakdown moments" ON public.trailer_breakdown_moments;

CREATE POLICY "Allow public read trailer breakdown moments" ON public.trailer_breakdown_moments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.trailer_breakdowns tb
      WHERE tb.id = breakdown_id AND (tb.status = 'published' OR public.is_active_staff())
    )
  );

CREATE POLICY "Allow active staff write trailer breakdown moments" ON public.trailer_breakdown_moments
  FOR ALL USING (public.is_active_staff());

-- --- COMMUNITY POINTS POLICY ---
DROP POLICY IF EXISTS "Allow public read community points" ON public.community_points;
DROP POLICY IF EXISTS "Allow public insert community points" ON public.community_points;
DROP POLICY IF EXISTS "Allow public update own community points" ON public.community_points;

CREATE POLICY "Allow public read community points" ON public.community_points
  FOR SELECT USING (true);

CREATE POLICY "Allow public insert community points" ON public.community_points
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow public update own community points" ON public.community_points
  FOR UPDATE USING (true);

-- --- WISHLIST VOTES POLICY ---
DROP POLICY IF EXISTS "Allow public read wishlist_votes" ON public.wishlist_votes;

CREATE POLICY "Allow public read wishlist_votes" ON public.wishlist_votes
  FOR SELECT USING (true);

-- --- ACTIVITY LOG POLICY (Admin/Staff only) ---
DROP POLICY IF EXISTS "Allow active staff read activity_log" ON public.activity_log;
DROP POLICY IF EXISTS "Allow active staff insert activity_log" ON public.activity_log;

CREATE POLICY "Allow active staff read activity_log" ON public.activity_log
  FOR SELECT USING (public.is_active_staff());

CREATE POLICY "Allow active staff insert activity_log" ON public.activity_log
  FOR INSERT WITH CHECK (public.is_active_staff());

-- Helper trigger/function to auto-populate activity_log from Server side if needed,
-- or we can insert directly from API route / Supabase Client actions.
