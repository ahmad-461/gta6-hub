-- GTA 6 Hub - Phase 17 RLS Policy Fix for Cheat Codes
-- This migration fixes the RLS issue where authorized active staff (admins/editors)
-- were unable to INSERT, UPDATE, or DELETE cheat codes due to a missing or misconfigured policy.
--
-- We standardize the write access using the existing 'public.is_active_staff()' helper function,
-- and provide separate explicit policies for INSERT, UPDATE, and DELETE for maximum robustness.

-- Ensure RLS is enabled on public.cheat_codes
ALTER TABLE public.cheat_codes ENABLE ROW LEVEL SECURITY;

-- 1. Drop old conflicting policies if they exist
DROP POLICY IF EXISTS "Allow admin/editor write cheat codes" ON public.cheat_codes;
DROP POLICY IF EXISTS "Allow active staff write cheat codes" ON public.cheat_codes;
DROP POLICY IF EXISTS "Allow active staff insert cheat codes" ON public.cheat_codes;
DROP POLICY IF EXISTS "Allow active staff update cheat codes" ON public.cheat_codes;
DROP POLICY IF EXISTS "Allow active staff delete cheat codes" ON public.cheat_codes;
DROP POLICY IF EXISTS "Allow public read cheat codes" ON public.cheat_codes;

-- 2. Create standard SELECT policy for anyone (public read-only)
CREATE POLICY "Allow public read cheat codes" ON public.cheat_codes
  FOR SELECT USING (true);

-- 3. Create explicit INSERT policy for active staff
CREATE POLICY "Allow active staff insert cheat codes" ON public.cheat_codes
  FOR INSERT WITH CHECK (public.is_active_staff());

-- 4. Create explicit UPDATE policy for active staff
CREATE POLICY "Allow active staff update cheat codes" ON public.cheat_codes
  FOR UPDATE USING (public.is_active_staff()) WITH CHECK (public.is_active_staff());

-- 5. Create explicit DELETE policy for active staff
CREATE POLICY "Allow active staff delete cheat codes" ON public.cheat_codes
  FOR DELETE USING (public.is_active_staff());
