-- Polaris PostgreSQL Migration: Automatic 14-Day Free Trial on Team Creation
-- + Anti-Abuse Protection (1 Trial per User Account)
-- + Welcome Announcement Auto-Generation

-- ---------------------------------------------------------------------
-- 1. Persistent User Trial History (Abuse Prevention: 1 Free Trial per Account)
-- ---------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.user_trial_history (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    first_org_id UUID REFERENCES public.organizations(id) ON DELETE SET NULL,
    user_email TEXT,
    redeemed_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_trial_history_user ON public.user_trial_history(user_id);

ALTER TABLE public.user_trial_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read their own trial history" ON public.user_trial_history;
CREATE POLICY "Users can read their own trial history"
    ON public.user_trial_history
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

-- ---------------------------------------------------------------------
-- 2. Atomic Team Creation with Auto-Trial & Welcome Post
-- ---------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.create_team(
    p_name TEXT,
    p_invite_code TEXT,
    p_user_email TEXT DEFAULT '',
    p_user_name TEXT DEFAULT ''
)
RETURNS JSONB AS $$
DECLARE
    v_user_id UUID;
    v_org_id UUID;
    v_slug TEXT;
    v_has_used_trial BOOLEAN := FALSE;
    v_status TEXT;
    v_plan TEXT;
    v_trial_ends TIMESTAMPTZ;
    v_clean_name TEXT;
    v_clean_code TEXT;
    v_author_name TEXT;
    v_welcome_content TEXT;
BEGIN
    v_user_id := auth.uid();
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    v_clean_name := trim(p_name);
    IF length(v_clean_name) < 2 THEN
        RAISE EXCEPTION 'Team-Name muss mindestens 2 Zeichen lang sein.';
    END IF;

    v_clean_code := upper(trim(p_invite_code));
    v_slug := lower(regexp_replace(v_clean_name, '[^a-zA-Z0-9]+', '-', 'g'));

    -- Check Abuse Protection: Has this user already claimed their 1 free trial?
    SELECT EXISTS (
        SELECT 1 FROM public.user_trial_history
        WHERE user_id = v_user_id
    ) INTO v_has_used_trial;

    IF NOT v_has_used_trial THEN
        -- First team: Grant 14-day free trial
        v_status := 'trialing';
        v_plan := 'pro';
        v_trial_ends := NOW() + INTERVAL '14 days';
    ELSE
        -- Subsequent team: Starts as inactive, requires license
        v_status := 'inactive';
        v_plan := 'free';
        v_trial_ends := NULL;
    END IF;

    -- Insert organization
    INSERT INTO public.organizations (
        name,
        slug,
        invite_code,
        created_by,
        plan,
        subscription_status,
        trial_ends_at,
        seat_limit
    )
    VALUES (
        v_clean_name,
        v_slug,
        v_clean_code,
        v_user_id,
        v_plan,
        v_status,
        v_trial_ends,
        10
    )
    RETURNING id INTO v_org_id;

    -- Add creator as admin
    INSERT INTO public.organization_members (
        organization_id,
        user_id,
        role,
        user_email,
        user_name
    )
    VALUES (
        v_org_id,
        v_user_id,
        'admin',
        coalesce(nullif(trim(p_user_email), ''), 'Fachkraft'),
        coalesce(nullif(trim(p_user_name), ''), 'Team-Admin')
    );

    -- If this was a free trial, record in trial history and create the Welcome Announcement
    IF NOT v_has_used_trial THEN
        INSERT INTO public.user_trial_history (
            user_id,
            first_org_id,
            user_email
        )
        VALUES (
            v_user_id,
            v_org_id,
            p_user_email
        );

        -- Build Welcome Announcement content
        v_author_name := coalesce(nullif(trim(p_user_name), ''), 'Polaris Team');
        v_welcome_content := '👋 Willkommen im neuen Team-Workspace für ' || v_clean_name || '!' || E'\n\n' ||
            'Eure 14-tägige kostenlose Testphase ist ab sofort aktiv (bis zum ' || to_char(v_trial_ends, 'DD.MM.YYYY') || '). ' ||
            'Keine Zahlungsdaten nötig – sie endet automatisch ohne Abo.' || E'\n\n' ||
            '🚀 So startet ihr gemeinsam durch:' || E'\n' ||
            '1. 👥 Kolleg*innen einladen: Teilt euren 6-stelligen Team-Code ' || v_clean_code || ' oder den Einladungslink (oben im Menü).' || E'\n' ||
            '2. 📋 Schichtübergaben & Warnungen: Nutzt dieses Schwarze Brett für Kältehilfe-Meldungen, Aufnahmestopps und Übergaben.' || E'\n' ||
            '3. 💡 Geteiltes Einrichtungs-Wissen: Öffnet eine Berliner Einrichtungskarte und hinterlegt Klingelcodes, Ansprechpartner und Aufnahmetipps direkt für euer Team.' || E'\n\n' ||
            'Fragen oder Träger-Rechnungsangebot nach § 14 UStG? Meldet euch jederzeit unter kontakt@socialworkhub.net.';

        INSERT INTO public.team_announcements (
            organization_id,
            author_id,
            author_name,
            priority,
            title,
            content,
            is_pinned
        )
        VALUES (
            v_org_id,
            v_user_id,
            v_author_name,
            'info',
            '👋 Willkommen am Schwarzen Brett!',
            v_welcome_content,
            true
        );
    END IF;

    -- Return full organization payload directly (avoids SELECT ... INTO false-positive in Supabase linter)
    RETURN jsonb_build_object(
        'id', v_org_id,
        'name', v_clean_name,
        'slug', v_slug,
        'invite_code', v_clean_code,
        'role', 'admin',
        'plan', v_plan,
        'subscription_status', v_status,
        'trial_ends_at', v_trial_ends,
        'seat_limit', 10,
        'is_trial_granted', (NOT v_has_used_trial)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.create_team(TEXT, TEXT, TEXT, TEXT) TO authenticated;
