-- NEW MIGRATION: machine_schema.sql
-- Instructions: Run this in your Supabase SQL Editor. 
-- This completely overhauls the database to hold all 6 IR sensors, distance, and seed level in a single efficient row!

-- 1. Create the unified machine state table
CREATE TABLE IF NOT EXISTS public.machine_state (
    id INTEGER PRIMARY KEY CHECK (id = 1),
    c1 INTEGER DEFAULT 0,
    c2 INTEGER DEFAULT 0,
    c3 INTEGER DEFAULT 0,
    c4 INTEGER DEFAULT 0,
    c5 INTEGER DEFAULT 0,
    c6 INTEGER DEFAULT 0,
    level_percent INTEGER DEFAULT 0,
    distance_m DECIMAL DEFAULT 0.0,
    
    offset_c1 INTEGER DEFAULT 0,
    offset_c2 INTEGER DEFAULT 0,
    offset_c3 INTEGER DEFAULT 0,
    offset_c4 INTEGER DEFAULT 0,
    offset_c5 INTEGER DEFAULT 0,
    offset_c6 INTEGER DEFAULT 0,
    offset_distance_m DECIMAL DEFAULT 0.0,
    
    last_updated TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Turn on Row Level Security (RLS)
ALTER TABLE public.machine_state ENABLE ROW LEVEL SECURITY;

-- 3. Allow public read access (for the Dashboard to read data)
CREATE POLICY "Allow public read access"
ON public.machine_state FOR SELECT TO anon, authenticated USING (true);

-- 4. Allow public update (for the ESP32 to push data over REST)
CREATE POLICY "Allow public insert and update"
ON public.machine_state FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- 5. Force the exact row (id 1) to exist so the ESP32 can PATCH it
INSERT INTO public.machine_state (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

-- 6. Enable Realtime broadcasting so WebSockets stream directly to React!
ALTER PUBLICATION supabase_realtime ADD TABLE machine_state;

-- 7. Upgrade Archives Table for the new Resets
CREATE TABLE IF NOT EXISTS public.machine_archives (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    session_label TEXT,
    total_seeds INTEGER,
    total_distance_m DECIMAL,
    outlet_data JSONB
);

ALTER TABLE public.machine_archives ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public read access for archives" ON public.machine_archives FOR SELECT USING (true);
CREATE POLICY "Public insert access for archives" ON public.machine_archives FOR INSERT WITH CHECK (true);
