-- GTA 6 Hub - Phase 12 Ammu-Nation Wishlist Tally & Map View Counts Migration

-- PART D: WISHLIST BUILDER TALLY
CREATE TABLE IF NOT EXISTS public.wishlist_votes (
    item_slug TEXT PRIMARY KEY,
    votes INTEGER DEFAULT 0 NOT NULL
);

-- Enable RLS
ALTER TABLE public.wishlist_votes ENABLE ROW LEVEL SECURITY;

-- Drop policy if exists
DROP POLICY IF EXISTS "Allow public read wishlist_votes" ON public.wishlist_votes;

-- Select policy for public reading of counts
CREATE POLICY "Allow public read wishlist_votes" ON public.wishlist_votes
  FOR SELECT USING (true);

-- Safe RPC to increment a vote count
CREATE OR REPLACE FUNCTION public.increment_wishlist_vote(target_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO public.wishlist_votes (item_slug, votes)
  VALUES (target_slug, 1)
  ON CONFLICT (item_slug)
  DO UPDATE SET votes = public.wishlist_votes.votes + 1;
END;
$$;


-- PART E: MAP TRENDING HEAT OVERLAY
-- Add view_count column to map_locations table
ALTER TABLE public.map_locations ADD COLUMN IF NOT EXISTS view_count INTEGER DEFAULT 0 NOT NULL;

-- Safe RPC to increment location view counts safely server-side or via definer
CREATE OR REPLACE FUNCTION public.increment_location_view(location_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.map_locations
  SET view_count = view_count + 1
  WHERE id = location_id;
END;
$$;
