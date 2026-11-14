-- =====================================================================
-- Polaris PostgreSQL Migration: Billing, Dynamic Seats, 14-Day Trial & Personal Notes
-- =====================================================================

-- 1. Table: public.user_facility_notes (Personal Private Notes for Free Logged-in Users)
CREATE TABLE IF NOT EXISTS public.user_facility_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    facility_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, facility_id)
);

CREATE INDEX IF NOT EXISTS idx_user_facility_notes_user ON public.user_facility_notes(user_id);
CREATE INDEX IF NOT EXISTS idx_user_facility_notes_fac ON public.user_facility_notes(facility_id);

ALTER TABLE public.user_facility_notes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own facility notes" ON public.user_facility_notes;
CREATE POLICY "Users can view own facility notes"
    ON public.user_facility_notes
    FOR SELECT
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own facility notes" ON public.user_facility_notes;
CREATE POLICY "Users can insert own facility notes"
    ON public.user_facility_notes
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own facility notes" ON public.user_facility_notes;
CREATE POLICY "Users can update own facility notes"
    ON public.user_facility_notes
    FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own facility notes" ON public.user_facility_notes;
CREATE POLICY "Users can delete own facility notes"
    ON public.user_facility_notes
    FOR DELETE
    USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 2. Organizations Billing & Subscription Fields
-- ---------------------------------------------------------------------
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT,
ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive',
ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS current_period_end TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS seat_limit INTEGER NOT NULL DEFAULT 10;

-- Index for Stripe lookups
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_cust ON public.organizations(stripe_customer_id);
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_sub ON public.organizations(stripe_subscription_id);

-- ---------------------------------------------------------------------
-- 3. Trial Codes Table (One-Time Touchpoint Codes)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.trial_codes (
    code VARCHAR(32) PRIMARY KEY,
    target_org_name TEXT,
    days INTEGER NOT NULL DEFAULT 14,
    is_redeemed BOOLEAN NOT NULL DEFAULT FALSE,
    redeemed_by_org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    redeemed_by_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    redeemed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.trial_codes ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view only via redeem function (no direct select for normal users)
DROP POLICY IF EXISTS "Admins can view trial codes" ON public.trial_codes;
CREATE POLICY "Admins can view trial codes"
    ON public.trial_codes
    FOR ALL
    TO service_role
    USING (true);

-- ---------------------------------------------------------------------
-- 4. Helper Function: Redeem 14-Day Trial Code
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.redeem_trial_code(
    p_code TEXT,
    p_org_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_code_row RECORD;
    v_is_admin BOOLEAN;
    v_clean_code TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    v_clean_code := UPPER(TRIM(p_code));

    -- Check if user is an admin of the target organization
    SELECT EXISTS (
        SELECT 1 FROM public.organization_members
        WHERE organization_id = p_org_id AND user_id = v_user_id AND role = 'admin'
    ) INTO v_is_admin;

    IF NOT v_is_admin THEN
        RAISE EXCEPTION 'Only team admins can redeem trial codes';
    END IF;

    -- Fetch and lock the code
    SELECT * INTO v_code_row
    FROM public.trial_codes
    WHERE code = v_clean_code
    FOR UPDATE;

    IF v_code_row IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'CODE_NOT_FOUND', 'message', 'Ungültiger Code. Bitte überprüfe deine Eingabe.');
    END IF;

    IF v_code_row.is_redeemed THEN
        RETURN jsonb_build_object('success', false, 'error', 'ALREADY_REDEEMED', 'message', 'Dieser Code wurde bereits eingelöst.');
    END IF;

    -- Update organization status
    UPDATE public.organizations
    SET 
        plan = 'pro',
        subscription_status = 'trialing',
        trial_ends_at = NOW() + (v_code_row.days || ' days')::INTERVAL,
        updated_at = NOW()
    WHERE id = p_org_id;

    -- Mark code as used
    UPDATE public.trial_codes
    SET 
        is_redeemed = true,
        redeemed_by_org_id = p_org_id,
        redeemed_by_user_id = v_user_id,
        redeemed_at = NOW()
    WHERE code = v_clean_code;

    RETURN jsonb_build_object(
        'success', true,
        'days', v_code_row.days,
        'trial_ends_at', NOW() + (v_code_row.days || ' days')::INTERVAL
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ---------------------------------------------------------------------
-- 5. Enhanced Triage Quota Check (Active Subscription OR Active Trial)
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.check_and_increment_triage(
    p_month_year VARCHAR(7),
    p_max_allowed INTEGER DEFAULT 3
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_has_active_license BOOLEAN := FALSE;
    v_current_count INTEGER := 0;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Check if user belongs to an organization with an active paid license or active trial
    SELECT EXISTS (
        SELECT 1 
        FROM public.organization_members om
        JOIN public.organizations o ON om.organization_id = o.id
        WHERE om.user_id = v_user_id 
          AND (
              o.subscription_status = 'active'
              OR (o.subscription_status = 'trialing' AND (o.trial_ends_at IS NULL OR o.trial_ends_at > NOW()))
          )
    ) INTO v_has_active_license;

    -- Pro / Active Trial users have UNLIMITED triages
    IF v_has_active_license THEN
        RETURN jsonb_build_object(
            'allowed', true,
            'unlimited', true,
            'used', 0,
            'max', 9999
        );
    END IF;

    -- Free individual user quota check for this month
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

    -- Increment usage
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
-- 6. Enforce Seat Limit on Invite Code Joins
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.join_organization_by_invite_code(
    p_invite_code TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_user_email TEXT;
    v_user_name TEXT;
    v_org RECORD;
    v_existing_member RECORD;
    v_member_count INTEGER;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- Get caller email / name from auth.users
    SELECT email, raw_user_meta_data->>'full_name' 
    INTO v_user_email, v_user_name
    FROM auth.users
    WHERE id = v_user_id;

    -- Find organization by invite code
    SELECT * INTO v_org
    FROM public.organizations
    WHERE UPPER(invite_code) = UPPER(TRIM(p_invite_code));

    IF v_org IS NULL THEN
        RETURN jsonb_build_object('success', false, 'error', 'ORG_NOT_FOUND', 'message', 'Kein Team mit diesem Einladungscode gefunden.');
    END IF;

    -- Check if user is already a member
    SELECT * INTO v_existing_member
    FROM public.organization_members
    WHERE organization_id = v_org.id AND user_id = v_user_id;

    IF v_existing_member IS NOT NULL THEN
        RETURN jsonb_build_object('success', true, 'message', 'Du bist bereits Mitglied dieses Teams.', 'organization_id', v_org.id);
    END IF;

    -- Check seat limit!
    SELECT count(*) INTO v_member_count
    FROM public.organization_members
    WHERE organization_id = v_org.id;

    IF v_member_count >= COALESCE(v_org.seat_limit, 10) THEN
        RETURN jsonb_build_object(
            'success', false, 
            'error', 'SEAT_LIMIT_REACHED', 
            'message', 'Dieses Team hat das Limit von ' || COALESCE(v_org.seat_limit, 10) || ' Plätzen erreicht. Die Teamleitung kann weitere Plätze hinzubuchen.'
        );
    END IF;

    -- Insert membership
    INSERT INTO public.organization_members (organization_id, user_id, role, user_email, user_name)
    VALUES (
        v_org.id,
        v_user_id,
        'member',
        v_user_email,
        COALESCE(v_user_name, split_part(v_user_email, '@', 1))
    );

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Erfolgreich dem Team ' || v_org.name || ' beigetreten.',
        'organization_id', v_org.id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
