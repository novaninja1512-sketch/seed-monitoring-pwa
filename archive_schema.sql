-- migration: archive_schema.sql
-- Instructions: Run this in your Supabase SQL Editor to add the Offset capabilities!

-- 1. Add offset_count to seed_counts (Allows infinite physical counting without PWA desync)
ALTER TABLE public.seed_counts ADD COLUMN IF NOT EXISTS offset_count INTEGER DEFAULT 0;

-- 2. Create archived_sessions table (Stores previous session records)
CREATE TABLE IF NOT EXISTS public.archived_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    session_label TEXT,
    total_seeds INTEGER,
    outlet_data JSONB
);

-- 3. Enable RLS on archived_sessions
ALTER TABLE public.archived_sessions ENABLE ROW LEVEL SECURITY;

-- Allow public read access (for the PWA dashboard)
CREATE POLICY "Public read access for archived_sessions"
ON public.archived_sessions FOR SELECT USING (true);

-- Allow public insert access (so the PWA can save sessions)
CREATE POLICY "Public insert access for archived_sessions"
ON public.archived_sessions FOR INSERT WITH CHECK (true);

-- 4. Set all existing seed_counts offset_counts to 0 just to be safe
UPDATE public.seed_counts SET offset_count = 0;
