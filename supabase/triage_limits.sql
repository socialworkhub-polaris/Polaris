-- =====================================================================
-- Polaris PostgreSQL Schema: Triage Usage Tracking & Rate Limiting
-- =====================================================================

-- Table: public.user_triage_usage
CREATE TABLE IF NOT EXISTS public.user_triage_usage (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    month_year VARCHAR(7) NOT NULL, -- Format: 'YYYY-MM', z.B. '2026-11'
    count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, month_year)
);

CREATE INDEX IF NOT EXISTS idx_triage_usage_user_month ON public.user_triage_usage(user_id, month_year);

ALTER TABLE public.user_triage_usage ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own triage usage
DROP POLICY IF EXISTS "Users can view own triage usage" ON public.user_triage_usage;
CREATE POLICY "Users can view own triage usage"
    ON public.user_triage_usage
    FOR SELECT
    USING (auth.uid() = user_id);

-- Policy: Users or backend can insert/update their usage
DROP POLICY IF EXISTS "Users can insert own triage usage" ON public.user_triage_usage;
CREATE POLICY "Users can insert own triage usage"
    ON public.user_triage_usage
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own triage usage" ON public.user_triage_usage;
CREATE POLICY "Users can update own triage usage"
    ON public.user_triage_usage
    FOR UPDATE
    USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- Helper Function: Check & Increment Triage Usage atomically
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_and_increment_triage(
    p_month_year VARCHAR(7),
    p_max_allowed INTEGER DEFAULT 3
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_has_license BOOLEAN := FALSE;
    v_current_count INTEGER := 0;
    v_result JSONB;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check if user belongs to an organization with a 'pro' or 'enterprise' plan
    SELECT EXISTS (
        SELECT 1 
        FROM public.organization_members om
        JOIN public.organizations o ON om.organization_id = o.id
        WHERE om.user_id = v_user_id AND o.plan IN ('pro', 'enterprise')
    ) INTO v_has_license;

    -- If user has an active pro/enterprise license: unlimited usage!
    IF v_has_license THEN
        RETURN jsonb_build_object(
            'allowed', true,
            'unlimited', true,
            'used', 0,
            'max', 9999
        );
    END IF;

    -- Get current usage for this month
    SELECT count INTO v_current_count
    FROM public.user_triage_usage
    WHERE user_id = v_user_id AND month_year = p_month_year;

    IF v_current_count IS NULL THEN
        v_current_count := 0;
    END IF;

    -- If limit already reached, reject
    IF v_current_count >= p_max_allowed THEN
        RETURN jsonb_build_object(
            'allowed', false,
            'unlimited', false,
            'used', v_current_count,
            'max', p_max_allowed
        );
    END IF;

    -- Increment or insert
    INSERT INTO public.user_triage_usage (user_id, month_year, count, updated_at)
    VALUES (v_user_id, p_month_year, v_current_count + 1, NOW())
    ON CONFLICT (user_id, month_year) 
    DO UPDATE SET count = public.user_triage_usage.count + 1, updated_at = NOW();

    RETURN jsonb_build_object(
        'allowed', true,
        'unlimited', false,
        'used', v_current_count + 1,
        'max', p_max_allowed
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------
-- Helper Function: Get current triage usage status without incrementing
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_triage_status(
    p_month_year VARCHAR(7),
    p_max_allowed INTEGER DEFAULT 3
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_has_license BOOLEAN := FALSE;
    v_current_count INTEGER := 0;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RETURN jsonb_build_object(
            'authenticated', false,
            'allowed', false,
            'unlimited', false,
            'used', 0,
            'max', p_max_allowed
        );
    END IF;

    SELECT EXISTS (
        SELECT 1 
        FROM public.organization_members om
        JOIN public.organizations o ON om.organization_id = o.id
        WHERE om.user_id = v_user_id AND o.plan IN ('pro', 'enterprise')
    ) INTO v_has_license;

    IF v_has_license THEN
        RETURN jsonb_build_object(
            'authenticated', true,
            'allowed', true,
            'unlimited', true,
            'used', 0,
            'max', 9999
        );
    END IF;

    SELECT count INTO v_current_count
    FROM public.user_triage_usage
    WHERE user_id = v_user_id AND month_year = p_month_year;

    IF v_current_count IS NULL THEN
        v_current_count := 0;
    END IF;

    RETURN jsonb_build_object(
        'authenticated', true,
        'allowed', v_current_count < p_max_allowed,
        'unlimited', false,
        'used', v_current_count,
        'max', p_max_allowed
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
