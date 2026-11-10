-- =====================================================================
-- Polaris PostgreSQL Schema: Team Announcements & Handover Board
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.team_announcements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    priority TEXT NOT NULL DEFAULT 'info' CHECK (priority IN ('urgent', 'important', 'info')),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_announcements_org ON public.team_announcements(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_announcements_created ON public.team_announcements(created_at DESC);

ALTER TABLE public.team_announcements ENABLE ROW LEVEL SECURITY;

-- 1. Members of the organization can view all its announcements
DROP POLICY IF EXISTS "Team members can view announcements" ON public.team_announcements;
CREATE POLICY "Team members can view announcements"
    ON public.team_announcements
    FOR SELECT
    USING (organization_id IN (SELECT public.get_user_org_ids()));

-- 2. Team members can insert announcements
DROP POLICY IF EXISTS "Team members can insert announcements" ON public.team_announcements;
CREATE POLICY "Team members can insert announcements"
    ON public.team_announcements
    FOR INSERT
    TO authenticated
    WITH CHECK (
        organization_id IN (SELECT public.get_user_org_ids()) AND
        author_id = auth.uid()
    );

-- 3. Authors or admins can update announcements (pinning, editing)
DROP POLICY IF EXISTS "Author or admin can update announcements" ON public.team_announcements;
CREATE POLICY "Author or admin can update announcements"
    ON public.team_announcements
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

-- 4. Authors or admins can delete announcements
DROP POLICY IF EXISTS "Author or admin can delete announcements" ON public.team_announcements;
CREATE POLICY "Author or admin can delete announcements"
    ON public.team_announcements
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
