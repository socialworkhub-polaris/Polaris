import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
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

    const { organizationId } = await req.json();

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    const { data: membership, error: memErr } = await userClient
      .from('organization_members')
      .select('role, organization:organizations(*)')
      .eq('organization_id', organizationId)
      .eq('user_id', userData.user.id)
      .single();

    if (memErr || !membership || membership.role !== 'admin') {
      return NextResponse.json({ error: 'FORBIDDEN' }, { status: 403 });
    }

    const org: any = membership.organization;
    if (!org.stripe_customer_id) {
      return NextResponse.json(
        { error: 'NO_CUSTOMER', message: 'Für dieses Team ist noch kein Abrechnungskonto verknüpft.' },
        { status: 400 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: org.stripe_customer_id,
      return_url: `${appUrl}/`,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (err: any) {
    console.error('Fehler beim Öffnen des Stripe Customer Portals:', err);
    return NextResponse.json({ error: 'PORTAL_FAILED', message: err.message }, { status: 500 });
  }
}
