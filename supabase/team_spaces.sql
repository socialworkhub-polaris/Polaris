-- =====================================================================
-- Polaris PostgreSQL Schema: Phase 2 - Multi-Tenant Team Spaces & Shared Intel
-- =====================================================================

-- 1. Table: public.organizations (Teams & Träger)
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

-- Index on invite_code for instant lookups
CREATE INDEX IF NOT EXISTS idx_organizations_invite_code ON public.organizations(invite_code);

-- 2. Table: public.organization_members (Membership & Roles)
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

-- 3. Table: public.facility_team_notes (Shared Team Intelligence)
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

-- =====================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================================

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.facility_team_notes ENABLE ROW LEVEL SECURITY;

-- Helper Function: Returns set of organization IDs the current authenticated user belongs to
CREATE OR REPLACE FUNCTION public.get_user_org_ids()
RETURNS SETOF UUID AS $$
    SELECT organization_id 
    FROM public.organization_members 
    WHERE user_id = auth.uid();
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- ---------------------------------------------------------------------
-- Policies for: public.organizations
-- ---------------------------------------------------------------------
-- Members can view their own organizations
DROP POLICY IF EXISTS "Members can view their own organizations" ON public.organizations;
CREATE POLICY "Members can view their own organizations"
    ON public.organizations
    FOR SELECT
    USING (id IN (SELECT public.get_user_org_ids()));

-- Authenticated users can create an organization
DROP POLICY IF EXISTS "Authenticated users can create organization" ON public.organizations;
CREATE POLICY "Authenticated users can create organization"
    ON public.organizations
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() IS NOT NULL);

-- Admins can update their organization
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

-- ---------------------------------------------------------------------
-- Policies for: public.organization_members
-- ---------------------------------------------------------------------
-- Members can view roster of their own organizations
DROP POLICY IF EXISTS "Members can view roster of their organizations" ON public.organization_members;
CREATE POLICY "Members can view roster of their organizations"
    ON public.organization_members
    FOR SELECT
    USING (organization_id IN (SELECT public.get_user_org_ids()));

-- Authenticated users can add themselves as member (used when creating or joining via invite code)
DROP POLICY IF EXISTS "Users can insert their own membership" ON public.organization_members;
CREATE POLICY "Users can insert their own membership"
    ON public.organization_members
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

-- Admins can remove members, or members can remove themselves (leave team)
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

-- ---------------------------------------------------------------------
-- Policies for: public.facility_team_notes
-- ---------------------------------------------------------------------
-- Only members of the owning organization can view its internal notes
DROP POLICY IF EXISTS "Team members can view organization notes" ON public.facility_team_notes;
CREATE POLICY "Team members can view organization notes"
    ON public.facility_team_notes
    FOR SELECT
    USING (organization_id IN (SELECT public.get_user_org_ids()));

-- Members can insert notes for their organization
DROP POLICY IF EXISTS "Team members can insert notes" ON public.facility_team_notes;
CREATE POLICY "Team members can insert notes"
    ON public.facility_team_notes
    FOR INSERT
    TO authenticated
    WITH CHECK (
        organization_id IN (SELECT public.get_user_org_ids()) AND
        author_id = auth.uid()
    );

-- Note authors or team admins can update notes (pinning, editing)
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

-- Note authors or team admins can delete notes
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

-- ---------------------------------------------------------------------
-- Stored Procedures: Atomic Team Creation & Invite Code Joining
-- ---------------------------------------------------------------------

-- Create Organization & Auto-Add Creator as Admin
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

-- Join Organization via Invite Code (Bypasses SELECT restriction before membership)
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

    -- Upsert membership as member
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
