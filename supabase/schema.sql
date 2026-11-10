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

-- =====================================================================
-- Table: public.facility_edits (Crowdsourced corrections)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.facility_edits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id TEXT NOT NULL,
    facility_name TEXT NOT NULL,
    suggested_changes TEXT NOT NULL,
    contact_email TEXT DEFAULT '',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.facility_edits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public insert on facility_edits" ON public.facility_edits;
CREATE POLICY "Allow public insert on facility_edits"
    ON public.facility_edits
    FOR INSERT
    TO anon
    WITH CHECK (true);

DROP POLICY IF EXISTS "Allow service role all on facility_edits" ON public.facility_edits;
CREATE POLICY "Allow service role all on facility_edits"
    ON public.facility_edits
    FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- =====================================================================
-- Table: public.user_bookmarks (Caseworker saved facilities)
-- =====================================================================
CREATE TABLE IF NOT EXISTS public.user_bookmarks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    facility_id TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, facility_id)
);

ALTER TABLE public.user_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own bookmarks" ON public.user_bookmarks;
CREATE POLICY "Users can manage own bookmarks"
    ON public.user_bookmarks
    FOR ALL
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- =====================================================================
-- Phase 2: Multi-Tenant Team Spaces & Shared Intel
-- =====================================================================

-- Table: public.organizations (Teams & Träger)
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    slug TEXT NOT NULL,
    invite_code VARCHAR(12) UNIQUE NOT NULL,
    plan TEXT NOT NULL DEFAULT 'pilot' CHECK (plan IN ('pilot', 'pro', 'enterprise')),
    created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_organizations_invite_code ON public.organizations(invite_code);

-- Table: public.organization_members (Membership & Roles)
CREATE TABLE IF NOT EXISTS public.organization_members (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'member' CHECK (role IN ('admin', 'member')),
    user_email TEXT,
    user_name TEXT,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.organization_members(organization_id);

-- Table: public.facility_team_notes (Shared Team Intelligence)
CREATE TABLE IF NOT EXISTS public.facility_team_notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    facility_id TEXT NOT NULL,
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('contact_person', 'intake_tip', 'warning', 'general')),
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_notes_facility ON public.facility_team_notes(facility_id);
CREATE INDEX IF NOT EXISTS idx_team_notes_org ON public.facility_team_notes(organization_id);

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_team_notes ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF UUID AS $$
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

DROP POLICY IF EXISTS "Members can view their own organizations" ON public.organizations;
CREATE POLICY "Members can view their own organizations"
    ON public.organizations
    FOR SELECT
    USING (id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS "Authenticated users can create organization" ON public.organizations;
CREATE POLICY "Authenticated users can create organization"
    ON public.organizations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

DROP POLICY IF EXISTS "Admins can update their organization" ON public.organizations;
CREATE POLICY "Admins can update their organization"
    ON public.organizations
    FOR UPDATE
    USING (
        id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Members can view roster of their organizations" ON public.organization_members;
CREATE POLICY "Members can view roster of their organizations"
    ON public.organization_members
    FOR SELECT
    USING (organization_id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS "Users can insert their own membership" ON public.organization_members;
CREATE POLICY "Users can insert their own membership"
    ON public.organization_members
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins or self can delete membership" ON public.organization_members;
CREATE POLICY "Admins or self can delete membership"
    ON public.organization_members
    FOR DELETE
    USING (
        user_id = auth.uid() OR
        organization_id IN (
            SELECT organization_id 
            FROM public.organization_members 
            WHERE user_id = auth.uid() AND role = 'admin'
        )
    );

DROP POLICY IF EXISTS "Team members can view organization notes" ON public.facility_team_notes;
CREATE POLICY "Team members can view organization notes"
    ON public.facility_team_notes
    FOR SELECT
    USING (organization_id IN (SELECT public.get_user_org_ids()));

DROP POLICY IF EXISTS "Team members can insert notes" ON public.facility_team_notes;
CREATE POLICY "Team members can insert notes"
    ON public.facility_team_notes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        organization_id IN (SELECT public.get_user_org_ids()) AND
        author_id = auth.uid()
    );

DROP POLICY IF EXISTS "Author or admin can update notes" ON public.facility_team_notes;
CREATE POLICY "Author or admin can update notes"
    ON public.facility_team_notes
    FOR UPDATE
    USING (
        organization_id IN (SELECT public.get_user_org_ids()) AND (
            author_id = auth.uid() OR
            organization_id IN (
                SELECT organization_id 
                FROM public.organization_members 
                WHERE user_id = auth.uid() AND role = 'admin'
            )
        )
    );

DROP POLICY IF EXISTS "Author or admin can delete notes" ON public.facility_team_notes;
CREATE POLICY "Author or admin can delete notes"
    ON public.facility_team_notes
    FOR DELETE
    USING (
        organization_id IN (SELECT public.get_user_org_ids()) AND (
            author_id = auth.uid() OR
            organization_id IN (
                SELECT organization_id 
                FROM public.organization_members 
                WHERE user_id = auth.uid() AND role = 'admin'
            )
        )
    );

CREATE OR REPLACE FUNCTION public.create_team(
    p_name TEXT,
    p_invite_code TEXT,
    p_user_email TEXT DEFAULT '',
    p_user_name TEXT DEFAULT ''
)
RETURNS JSONB AS $$
DECLARE
    v_org_id UUID;
    v_slug TEXT;
    v_result JSONB;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    v_slug := lower(regexp_replace(trim(p_name), '[^a-zA-Z0-9]+', '-', 'g'));
    
    INSERT INTO public.organizations (name, slug, invite_code, created_by)
    VALUES (p_name, v_slug, upper(trim(p_invite_code)), auth.uid())
    RETURNING id INTO v_org_id;

    INSERT INTO public.organization_members (organization_id, user_id, role, user_email, user_name)
    VALUES (v_org_id, auth.uid(), 'admin', p_user_email, p_user_name);

    SELECT jsonb_build_object(
        'id', o.id,
        'name', o.name,
        'slug', o.slug,
        'invite_code', o.invite_code,
        'role', 'admin'
    ) INTO v_result
    FROM public.organizations o
    WHERE o.id = v_org_id;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.join_team_by_code(
    p_code TEXT,
    p_user_email TEXT DEFAULT '',
    p_user_name TEXT DEFAULT ''
)
RETURNS JSONB AS $$
DECLARE
    v_org RECORD;
    v_result JSONB;
BEGIN
    IF auth.uid() IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    SELECT id, name, slug, invite_code INTO v_org
    FROM public.organizations
    WHERE upper(invite_code) = upper(trim(p_code))
    LIMIT 1;

    IF v_org.id IS NULL THEN
        RAISE EXCEPTION 'Ungültiger Team-Code. Bitte prüfen Sie die Eingabe.';
    END IF;

    INSERT INTO public.organization_members (organization_id, user_id, role, user_email, user_name)
    VALUES (v_org.id, auth.uid(), 'member', p_user_email, p_user_name)
    ON CONFLICT (organization_id, user_id) DO NOTHING;

    SELECT jsonb_build_object(
        'id', v_org.id,
        'name', v_org.name,
        'slug', v_org.slug,
        'invite_code', v_org.invite_code,
        'role', 'member'
    ) INTO v_result;

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
