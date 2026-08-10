-- GTA 6 Hub - Database Schema Migrations
-- Phase 1 Foundation

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES Table (linked to Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'editor')) DEFAULT 'editor',
    disabled BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. CATEGORIES Table (self-referencing parent_id for hierarchies)
CREATE TABLE IF NOT EXISTS public.categories (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    description TEXT,
    parent_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. ARTICLES Table
CREATE TABLE IF NOT EXISTS public.articles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    excerpt TEXT,
    category UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    featured_image TEXT,
    seo_title TEXT,
    seo_description TEXT,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. GUIDES Table
CREATE TABLE IF NOT EXISTS public.guides (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT NOT NULL,
    category UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    guide_category TEXT NOT NULL CHECK (guide_category IN ('Getting Started', 'Story', 'Online', 'Cheats', 'Secrets')) DEFAULT 'Getting Started',
    difficulty TEXT NOT NULL CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced')) DEFAULT 'Beginner',
    status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
    author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    featured_image TEXT,
    word_count INTEGER DEFAULT 0 NOT NULL,
    toc JSONB NOT NULL DEFAULT '[]'::jsonb,
    published_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. CHARACTERS Table
CREATE TABLE IF NOT EXISTS public.characters (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    biography TEXT NOT NULL,
    stats_json JSONB DEFAULT '{}'::jsonb NOT NULL,
    featured_image TEXT,
    status TEXT NOT NULL CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. CHEAT_CODES Table
CREATE TABLE IF NOT EXISTS public.cheat_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    platform TEXT NOT NULL, -- 'PS5', 'Xbox Series X/S', 'PC', etc.
    code TEXT NOT NULL,
    category TEXT NOT NULL, -- 'Weapons', 'Spawn Vehicles', 'Player Upgrades', etc.
    effect TEXT NOT NULL,
    verified BOOLEAN DEFAULT false NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    CONSTRAINT unique_platform_code UNIQUE (platform, code)
);

-- 7. MEDIA Table
CREATE TABLE IF NOT EXISTS public.media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    filename TEXT NOT NULL,
    url TEXT NOT NULL,
    webp_url TEXT,
    alt_text TEXT,
    size_kb INTEGER,
    uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 8. TAGS Table
CREATE TABLE IF NOT EXISTS public.tags (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 9. ARTICLE_TAGS Join Table
CREATE TABLE IF NOT EXISTS public.article_tags (
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
    tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
    PRIMARY KEY (article_id, tag_id)
);

-- 10. COMMENTS Table
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    content TEXT NOT NULL,
    status TEXT NOT NULL CHECK (status IN ('pending', 'approved', 'spam', 'deleted')) DEFAULT 'pending',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 11. POLLS Table
CREATE TABLE IF NOT EXISTS public.polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    question TEXT NOT NULL,
    options_json JSONB NOT NULL DEFAULT '[]'::jsonb, -- e.g. ["Option 1", "Option 2"]
    votes_json JSONB NOT NULL DEFAULT '{}'::jsonb,   -- e.g. {"Option 1": 15, "Option 2": 42}
    active BOOLEAN DEFAULT true NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 12. SITE_SETTINGS Table
CREATE TABLE IF NOT EXISTS public.site_settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);


-- TRIGGER FUNCTION for Auto-creating profiles row on Auth user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, name, email, role)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.email),
    NEW.email,
    'editor'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create the trigger after ensuring handle_new_user function is active
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ROW LEVEL SECURITY (RLS) POLICIES
-- Enabling RLS across all relevant tables
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


-- 1. Helper Security Functions to easily determine user role
CREATE OR REPLACE FUNCTION public.get_user_role()
RETURNS text AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER;


-- 2. Profiles Policies
CREATE POLICY "Allow public read-only profiles" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Allow users to update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Allow admin/editor write profiles" ON public.profiles
  FOR ALL USING (public.get_user_role() IN ('admin', 'editor'));


-- 3. Categories Policies
CREATE POLICY "Allow public read categories" ON public.categories
  FOR SELECT USING (true);

CREATE POLICY "Allow admin/editor write categories" ON public.categories
  FOR ALL USING (public.get_user_role() IN ('admin', 'editor'));


-- 4. Articles Policies
CREATE POLICY "Allow public read published articles" ON public.articles
  FOR SELECT USING (status = 'published');

CREATE POLICY "Allow admin/editor read draft/archived articles" ON public.articles
  FOR SELECT USING (public.get_user_role() IN ('admin', 'editor'));

CREATE POLICY "Allow admin/editor write articles" ON public.articles
  FOR ALL USING (public.get_user_role() IN ('admin', 'editor'));


-- 5. Guides Policies
CREATE POLICY "Allow public read published guides" ON public.guides
  FOR SELECT USING (status = 'published');

CREATE POLICY "Allow admin/editor read draft/archived guides" ON public.guides
  FOR SELECT USING (public.get_user_role() IN ('admin', 'editor'));

CREATE POLICY "Allow admin/editor write guides" ON public.guides
  FOR ALL USING (public.get_user_role() IN ('admin', 'editor'));


-- 6. Characters Policies
CREATE POLICY "Allow public read published characters" ON public.characters
  FOR SELECT USING (status = 'published');

CREATE POLICY "Allow admin/editor read draft/archived characters" ON public.characters
  FOR SELECT USING (public.get_user_role() IN ('admin', 'editor'));

CREATE POLICY "Allow admin/editor write characters" ON public.characters
  FOR ALL USING (public.get_user_role() IN ('admin', 'editor'));


-- 7. Cheat Codes Policies
CREATE POLICY "Allow public read cheat codes" ON public.cheat_codes
  FOR SELECT USING (true);

CREATE POLICY "Allow admin/editor write cheat codes" ON public.cheat_codes
  FOR ALL USING (public.get_user_role() IN ('admin', 'editor'));


-- 8. Media Policies
CREATE POLICY "Allow public read media references" ON public.media
  FOR SELECT USING (true);

CREATE POLICY "Allow admin/editor write media references" ON public.media
  FOR ALL USING (public.get_user_role() IN ('admin', 'editor'));


-- 9. Tags & Article Tags Policies
CREATE POLICY "Allow public read tags" ON public.tags
  FOR SELECT USING (true);

CREATE POLICY "Allow admin/editor write tags" ON public.tags
  FOR ALL USING (public.get_user_role() IN ('admin', 'editor'));

CREATE POLICY "Allow public read article tags relation" ON public.article_tags
  FOR SELECT USING (true);

CREATE POLICY "Allow admin/editor write article tags relation" ON public.article_tags
  FOR ALL USING (public.get_user_role() IN ('admin', 'editor'));


-- 10. Comments Policies
CREATE POLICY "Allow public read approved comments" ON public.comments
  FOR SELECT USING (status = 'approved');

CREATE POLICY "Allow admin/editor read all comments" ON public.comments
  FOR SELECT USING (public.get_user_role() IN ('admin', 'editor'));

CREATE POLICY "Allow public insert comments" ON public.comments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow admin/editor manage comments" ON public.comments
  FOR UPDATE USING (public.get_user_role() IN ('admin', 'editor'));

CREATE POLICY "Allow admin/editor delete comments" ON public.comments
  FOR DELETE USING (public.get_user_role() IN ('admin', 'editor'));


-- 11. Polls Policies
CREATE POLICY "Allow public read active polls" ON public.polls
  FOR SELECT USING (true);

CREATE POLICY "Allow public vote insert/update on polls" ON public.polls
  FOR UPDATE USING (active = true);

CREATE POLICY "Allow admin/editor write polls" ON public.polls
  FOR ALL USING (public.get_user_role() IN ('admin', 'editor'));


-- 12. Site Settings Policies
CREATE POLICY "Allow public read site settings" ON public.site_settings
  FOR SELECT USING (true);

CREATE POLICY "Allow admin manage site settings" ON public.site_settings
  FOR ALL USING (public.get_user_role() = 'admin');


-- STORAGE BUCKETS INSTRUCTIONS (Run in Supabase Storage UI or via administrative API/sql):
-- Note: Supabase's SQL API doesn't support bucket manipulation directly inside user transactions easily,
-- but the recommended query structure for inserting storage buckets and RLS is:
--
-- INSERT INTO storage.buckets (id, name, public) VALUES ('media', 'media', true) ON CONFLICT DO NOTHING;
--
-- Storage RLS policy instructions:
-- CREATE POLICY "Allow Public Image View" ON storage.objects FOR SELECT USING (bucket_id = 'media');
-- CREATE POLICY "Allow Auth User/Admin Image Upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'media');


-- ==========================================
-- PHASE 2 MIGRATIONS (APPLY ON EXISTING DB)
-- ==========================================

-- 1. Add disabled column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS disabled BOOLEAN DEFAULT false NOT NULL;

-- 2. Add guide_category and toc columns to guides
ALTER TABLE public.guides ADD COLUMN IF NOT EXISTS guide_category TEXT NOT NULL CHECK (guide_category IN ('Getting Started', 'Story', 'Online', 'Cheats', 'Secrets')) DEFAULT 'Getting Started';
ALTER TABLE public.guides ADD COLUMN IF NOT EXISTS toc JSONB NOT NULL DEFAULT '[]'::jsonb;

-- 3. Modify guides difficulty check constraint (drop old and add new)
ALTER TABLE public.guides DROP CONSTRAINT IF EXISTS guides_difficulty_check;
ALTER TABLE public.guides ADD CONSTRAINT guides_difficulty_check CHECK (difficulty IN ('Beginner', 'Intermediate', 'Advanced'));
ALTER TABLE public.guides ALTER COLUMN difficulty SET DEFAULT 'Beginner';

-- 4. Add unique constraint to cheat_codes
ALTER TABLE public.cheat_codes ADD CONSTRAINT unique_platform_code UNIQUE (platform, code);
