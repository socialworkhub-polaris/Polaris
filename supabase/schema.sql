-- =====================================================================
-- Polaris PostgreSQL Schema for Supabase
-- Table: public.facilities
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS public.facilities (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    sub_title TEXT DEFAULT '',
    institution_type TEXT NOT NULL CHECK (institution_type IN ('amt', 'traeger')),
    access_type TEXT NOT NULL CHECK (access_type IN ('niedrigschwellig', 'antragspflichtig', 'termin')),
    primary_focus TEXT NOT NULL,
    age_groups TEXT[] DEFAULT '{}',
    district TEXT NOT NULL,
    address JSONB NOT NULL DEFAULT '{}'::jsonb,
    coordinates DOUBLE PRECISION[] DEFAULT '{}',
    transit JSONB DEFAULT '{}'::jsonb,
    contact JSONB DEFAULT '{}'::jsonb,
    opening_hours JSONB DEFAULT '{}'::jsonb,
    intake_rules JSONB DEFAULT '{}'::jsonb,
    target_groups TEXT[] DEFAULT '{}',
    features JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Performance Indexes for socio-legal triage and map filtering
CREATE INDEX IF NOT EXISTS idx_facilities_district ON public.facilities(district);
CREATE INDEX IF NOT EXISTS idx_facilities_institution_type ON public.facilities(institution_type);
CREATE INDEX IF NOT EXISTS idx_facilities_primary_focus ON public.facilities(primary_focus);
CREATE INDEX IF NOT EXISTS idx_facilities_access_type ON public.facilities(access_type);

-- Row Level Security (RLS)
ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

-- 1. Anyone (public anonymous web clients) can read all facilities
DROP POLICY IF EXISTS "Allow public read access on facilities" ON public.facilities;
CREATE POLICY "Allow public read access on facilities"
    ON public.facilities
    FOR SELECT
    USING (true);

-- 2. Service role has full permissions for automated syncing
DROP POLICY IF EXISTS "Allow service role full access on facilities" ON public.facilities;
CREATE POLICY "Allow service role full access on facilities"
    ON public.facilities
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- 3. Allow anon insert for initial database seeding
DROP POLICY IF EXISTS "Allow anon insert during setup" ON public.facilities;
CREATE POLICY "Allow anon insert during setup"
    ON public.facilities
    FOR INSERT
    TO anon
    WITH CHECK (true);
