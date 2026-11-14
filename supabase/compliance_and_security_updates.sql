-- =====================================================================
-- Polaris PostgreSQL Migration: Security Hardening & Admin Role Delegation
-- =====================================================================

-- 1. Hardened Triage Quota Check: Stricter Subscription / Trial Check
-- (Removes the raw 'plan = pro' bypass so canceled subscriptions do not remain unlimited)
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

    -- Strictly check if user belongs to an organization with an active paid license or active trial
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

    -- Pro (Active) / Active Trial users have UNLIMITED triages
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


-- 2. Admin Role Delegation / Successor RPC
-- Allows a verified organization admin to promote another colleague to admin or transfer duties
CREATE OR REPLACE FUNCTION public.update_member_role(
    p_org_id UUID,
    p_target_user_id UUID,
    p_new_role TEXT
)
RETURNS JSONB AS $$
DECLARE
    v_caller_id UUID;
    v_is_caller_admin BOOLEAN := FALSE;
BEGIN
    v_caller_id := auth.uid();
    IF v_caller_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    IF p_new_role NOT IN ('admin', 'member') THEN
        RETURN jsonb_build_object('success', false, 'error', 'INVALID_ROLE', 'message', 'Ungültige Rolle.');
    END IF;

    -- Verify that the caller is an active admin of the target organization
    SELECT EXISTS (
        SELECT 1 
        FROM public.organization_members
        WHERE organization_id = p_org_id AND user_id = v_caller_id AND role = 'admin'
    ) INTO v_is_caller_admin;

    IF NOT v_is_caller_admin THEN
        RETURN jsonb_build_object('success', false, 'error', 'FORBIDDEN', 'message', 'Nur Team-Administrator*innen können Rollen verwalten.');
    END IF;

    -- Update target member role
    UPDATE public.organization_members
    SET role = p_new_role
    WHERE organization_id = p_org_id AND user_id = p_target_user_id;

    RETURN jsonb_build_object(
        'success', true,
        'message', 'Rolle erfolgreich aktualisiert.',
        'target_user_id', p_target_user_id,
        'new_role', p_new_role
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
