-- GTA 6 Hub - Phase 20 FAQ System Migration
-- Creates site_faqs table with RLS policies and seeds genuine initial FAQs.

CREATE TABLE IF NOT EXISTS public.site_faqs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    question TEXT NOT NULL,
    answer TEXT NOT NULL,
    display_order INTEGER DEFAULT 0 NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.site_faqs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow public read site faqs" ON public.site_faqs;
DROP POLICY IF EXISTS "Allow active staff write site faqs" ON public.site_faqs;

-- SELECT policy: Anyone can read FAQs
CREATE POLICY "Allow public read site faqs" ON public.site_faqs
    FOR SELECT USING (true);

-- WRITE policy: Active staff (admins and editors) can INSERT, UPDATE, DELETE
CREATE POLICY "Allow active staff write site faqs" ON public.site_faqs
    FOR ALL USING (public.is_active_staff());

-- Seed initial FAQ records
INSERT INTO public.site_faqs (question, answer, display_order)
VALUES
    (
        'Is this an official Rockstar Games website?',
        'No. GTA 6 Hub is a 100% independent, unofficial fan resource and research database dedicated to tracking, analyzing, and archiving information about Grand Theft Auto VI. We are not affiliated with, endorsed by, or connected to Rockstar Games or Take-Two Interactive.',
        1
    ),
    (
        'When is GTA 6 releasing?',
        'Grand Theft Auto VI is officially scheduled for release on November 19, 2026. Rockstar Games confirmed this launch date for PlayStation 5 and Xbox Series X/S platforms. A PC version has not yet been announced for launch day.',
        2
    ),
    (
        'What platforms will GTA 6 be available on?',
        'GTA 6 will launch initially on PlayStation 5 and Xbox Series X/S. Rockstar Games has follow-up platform releases planned for PC in the future, following their historical release strategy.',
        3
    ),
    (
        'How does GTA 6 Hub verify information as confirmed vs. rumored?',
        'Our intelligence team categorizes all reports into three strict confidence tiers:

• CONFIRMED: Officially verified by Rockstar Games or Take-Two Interactive press releases, official trailers, or developer disclosures.
• UNVERIFIED / RUMOR: Sourced from reputable industry insiders, leaks, or datamines requiring further corroboration.
• DEBUNKED: Disproven reports or fake leaks debunked by structural analysis or official statements.',
        4
    ),
    (
        'Can I ask the AI Investigator about anything GTA 6 related?',
        'Yes! Our AI Investigator uses Retrieval-Augmented Generation (RAG) mapped directly across our entire article archive, character dossiers, location coordinates, and lore graph. You can ask about character backstories, vehicle models, Vice City locations, or historical development milestones.',
        5
    ),
    (
        'How do I report an error or suggest a correction?',
        'You can submit error reports, corrections, or tip-offs directly through our Contact page (/contact) or reach out via our community channels. Every report is reviewed by our editorial team prior to updating live dossiers.',
        6
    )
ON CONFLICT DO NOTHING;
