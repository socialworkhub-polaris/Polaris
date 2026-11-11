-- =====================================================================
-- Polaris PostgreSQL Schema: Team Calendar & Shared Shifts
-- =====================================================================

CREATE TABLE IF NOT EXISTS public.team_calendar_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    author_name TEXT NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    category TEXT NOT NULL DEFAULT 'event' CHECK (category IN ('shift', 'handover', 'outreach', 'event', 'deadline')),
    facility_id TEXT,
    facility_name TEXT,
    is_cross_team BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_team_calendar_org ON public.team_calendar_events(organization_id);
CREATE INDEX IF NOT EXISTS idx_team_calendar_start ON public.team_calendar_events(start_time);

ALTER TABLE public.team_calendar_events ENABLE ROW LEVEL SECURITY;

-- 1. Team members can view events of their organization (or cross-team events)
DROP POLICY IF EXISTS "Team members can view calendar events" ON public.team_calendar_events;
CREATE POLICY "Team members can view calendar events"
    ON public.team_calendar_events
    FOR SELECT
    USING (
        organization_id IN (SELECT public.get_user_org_ids()) OR
        is_cross_team = TRUE
    );

-- 2. Team members can insert calendar events
DROP POLICY IF EXISTS "Team members can insert calendar events" ON public.team_calendar_events;
CREATE POLICY "Team members can insert calendar events"
    ON public.team_calendar_events
    FOR INSERT
    TO authenticated
    WITH CHECK (
        organization_id IN (SELECT public.get_user_org_ids()) AND
        author_id = auth.uid()
    );

-- 3. Author or admin can update calendar events
DROP POLICY IF EXISTS "Author or admin can update calendar events" ON public.team_calendar_events;
CREATE POLICY "Author or admin can update calendar events"
    ON public.team_calendar_events
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

-- 4. Author or admin can delete calendar events
DROP POLICY IF EXISTS "Author or admin can delete calendar events" ON public.team_calendar_events;
CREATE POLICY "Author or admin can delete calendar events"
    ON public.team_calendar_events
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
