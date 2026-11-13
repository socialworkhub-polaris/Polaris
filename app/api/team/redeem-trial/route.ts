import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
    }

    const { organizationId, code } = await req.json();

    if (!organizationId || !code) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Team und Testcode sind erforderlich.' },
        { status: 400 }
      );
    }

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: result, error: rpcErr } = await userClient.rpc('redeem_trial_code', {
      p_code: code,
      p_org_id: organizationId,
    });

    if (rpcErr) {
      return NextResponse.json({ error: 'REDEEM_ERROR', message: rpcErr.message }, { status: 400 });
    }

    if (!result?.success) {
      return NextResponse.json(
        { error: result?.error || 'INVALID_CODE', message: result?.message || 'Code ungültig' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: '14-Tage Testphase erfolgreich aktiviert!',
      trialEndsAt: result.trial_ends_at,
    });
  } catch (err: any) {
    console.error('Fehler beim Einlösen des Testcodes:', err);
    return NextResponse.json({ error: 'SERVER_ERROR', message: err.message }, { status: 500 });
  }
}
