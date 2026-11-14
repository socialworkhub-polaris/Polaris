import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

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

    const { sessionId, organizationId } = await req.json();
    if (!sessionId) {
      return NextResponse.json({ error: 'SESSION_REQUIRED' }, { status: 400 });
    }

    // Retrieve checkout session from Stripe
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (!session || (session.payment_status !== 'paid' && session.status !== 'complete')) {
      return NextResponse.json({ error: 'NOT_PAID', message: 'Zahlung noch nicht abgeschlossen.' }, { status: 400 });
    }

    const targetOrgId = organizationId || session.metadata?.organizationId;
    if (!targetOrgId) {
      return NextResponse.json({ error: 'NO_ORG', message: 'Keine Organisation zugeordnet.' }, { status: 400 });
    }

    const customerId = (session.customer as string) || null;
    const subscriptionId = (session.subscription as string) || null;

    // 1. Try updating with user client (user is admin)
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { error: userUpdateErr } = await userClient
      .from('organizations')
      .update({
        plan: 'pro',
        subscription_status: 'active',
        stripe_customer_id: customerId,
        stripe_subscription_id: subscriptionId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', targetOrgId);

    // 2. Also run RPC or admin update as fallback
    if (userUpdateErr) {
      console.warn('User client update fallback to admin client:', userUpdateErr.message);
      await supabaseAdmin
        .from('organizations')
        .update({
          plan: 'pro',
          subscription_status: 'active',
          stripe_customer_id: customerId,
          stripe_subscription_id: subscriptionId,
          updated_at: new Date().toISOString(),
        })
        .eq('id', targetOrgId);
    }

    return NextResponse.json({
      success: true,
      message: 'Team-Lizenz erfolgreich aktiviert!',
      organizationId: targetOrgId,
    });
  } catch (err: any) {
    console.error('Fehler bei Verify Checkout:', err);
    return NextResponse.json({ error: 'VERIFY_FAILED', message: err.message }, { status: 500 });
  }
}
