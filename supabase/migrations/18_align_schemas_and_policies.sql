-- GTA 6 Hub - Phase 18 Schema Alignment & Database Security Migration
-- Aligns the characters table schema and ensures robust RLS policies for cheat_codes and characters.

-- 1. Align characters Table Schema (Add created_at and updated_at if missing, safe & non-destructive)
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;
ALTER TABLE public.characters ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL;

-- 2. Backfill missing Profiles for existing Auth Users
-- Ensures public.is_active_staff() works correctly for any active authenticated CMS editors/admins.
INSERT INTO public.profiles (id, name, email, role, disabled, created_at)
SELECT
  id,
  COALESCE(raw_user_meta_data->>'name', email, 'Staff User'),
  email,
  'editor',
  false,
  timezone('utc'::text, now())
FROM auth.users
ON CONFLICT (id) DO NOTHING;

-- 3. Robust RLS Policies for public.cheat_codes
-- Explicitly enable RLS and set standardized policies with exact security qualifiers.
ALTER TABLE public.cheat_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read cheat codes" ON public.cheat_codes;
DROP POLICY IF EXISTS "Allow admin/editor write cheat codes" ON public.cheat_codes;
DROP POLICY IF EXISTS "Allow active staff write cheat codes" ON public.cheat_codes;
DROP POLICY IF EXISTS "Allow active staff insert cheat codes" ON public.cheat_codes;
DROP POLICY IF EXISTS "Allow active staff update cheat codes" ON public.cheat_codes;
DROP POLICY IF EXISTS "Allow active staff delete cheat codes" ON public.cheat_codes;

-- SELECT policy: anyone (including anonymous users) can view cheat codes.
CREATE POLICY "Allow public read cheat codes" ON public.cheat_codes
  FOR SELECT USING (true);

-- INSERT policy: only active staff members.
CREATE POLICY "Allow active staff insert cheat codes" ON public.cheat_codes
  FOR INSERT TO authenticated WITH CHECK (public.is_active_staff());

-- UPDATE policy: only active staff members.
CREATE POLICY "Allow active staff update cheat codes" ON public.cheat_codes
  FOR UPDATE TO authenticated USING (public.is_active_staff()) WITH CHECK (public.is_active_staff());

-- DELETE policy: only active staff members.
CREATE POLICY "Allow active staff delete cheat codes" ON public.cheat_codes
  FOR DELETE TO authenticated USING (public.is_active_staff());


-- 4. Robust RLS Policies for public.characters
-- Explicitly enable RLS and set standardized policies with exact security qualifiers.
ALTER TABLE public.characters ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public read published characters" ON public.characters;
DROP POLICY IF EXISTS "Allow admin/editor read draft/archived characters" ON public.characters;
DROP POLICY IF EXISTS "Allow admin/editor write characters" ON public.characters;
DROP POLICY IF EXISTS "Allow active staff access to all characters" ON public.characters;
DROP POLICY IF EXISTS "Allow active staff write characters" ON public.characters;

-- SELECT policy (public): anyone can view published characters.
CREATE POLICY "Allow public read published characters" ON public.characters
  FOR SELECT USING (status = 'published');

-- SELECT policy (staff): active staff can view draft/archived characters.
CREATE POLICY "Allow active staff access to all characters" ON public.characters
  FOR SELECT TO authenticated USING (public.is_active_staff());

-- INSERT policy: only active staff members.
CREATE POLICY "Allow active staff insert characters" ON public.characters
  FOR INSERT TO authenticated WITH CHECK (public.is_active_staff());

-- UPDATE policy: only active staff members.
CREATE POLICY "Allow active staff update characters" ON public.characters
  FOR UPDATE TO authenticated USING (public.is_active_staff()) WITH CHECK (public.is_active_staff());

-- DELETE policy: only active staff members.
CREATE POLICY "Allow active staff delete characters" ON public.characters
  FOR DELETE TO authenticated USING (public.is_active_staff());
