import { NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization') || '';
    const token = authHeader.replace(/^Bearer\s+/i, '').trim();

    if (!token) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Bitte melde dich an.' }, { status: 401 });
    }

    const { data: userData, error: userError } = await supabase.auth.getUser(token);
    if (userError || !userData?.user) {
      return NextResponse.json({ error: 'UNAUTHORIZED', message: 'Ungültige Sitzung.' }, { status: 401 });
    }

    const body = await req.json();
    const { organizationId, teamName } = body;

    if (!organizationId && !teamName) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Team-Name oder Organization ID erforderlich.' },
        { status: 400 }
      );
    }

    // Authenticated user Supabase client to respect RLS
    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    let org: any = null;

    if (organizationId) {
      // Verify user is an admin of this organization
      const { data: membership, error: memErr } = await userClient
        .from('organization_members')
        .select('role, organization:organizations(*)')
        .eq('organization_id', organizationId)
        .eq('user_id', userData.user.id)
        .single();

      if (memErr || !membership || membership.role !== 'admin') {
        return NextResponse.json(
          { error: 'FORBIDDEN', message: 'Nur Team-Administrator*innen können die Lizenz verwalten.' },
          { status: 403 }
        );
      }
      org = membership.organization;
    } else if (teamName && typeof teamName === 'string') {
      const cleanName = teamName.trim();
      if (cleanName.length < 2) {
        return NextResponse.json(
          { error: 'BAD_REQUEST', message: 'Bitte gib einen gültigen Team-Namen ein.' },
          { status: 400 }
        );
      }

      const slug = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const inviteCode = generateInviteCode();

      // Create new organization
      const { data: newOrg, error: orgErr } = await userClient
        .from('organizations')
        .insert({
          name: cleanName,
          slug,
          invite_code: inviteCode,
          created_by: userData.user.id,
          plan: 'pilot',
          seat_limit: 10,
          subscription_status: 'inactive',
        })
        .select()
        .single();

      if (orgErr || !newOrg) {
        throw new Error(orgErr?.message || 'Konnte Team-Workspace nicht anlegen.');
      }

      // Add user as admin
      const userEmail = userData.user.email || '';
      const userName = userData.user.user_metadata?.full_name || userEmail.split('@')[0] || 'Team-Admin';

      await userClient.from('organization_members').insert({
        organization_id: newOrg.id,
        user_id: userData.user.id,
        role: 'admin',
        user_email: userEmail,
        user_name: userName,
      });

      org = newOrg;
    }

    if (!org) {
      return NextResponse.json({ error: 'ORG_NOT_FOUND', message: 'Team nicht gefunden.' }, { status: 404 });
    }

    let customerId = org.stripe_customer_id;

    // Create or retrieve Stripe Customer
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: userData.user.email,
        name: org.name,
        metadata: {
          organizationId: org.id,
          createdById: userData.user.id,
        },
      });
      customerId = customer.id;

      // Save stripe_customer_id in Supabase
      await userClient
        .from('organizations')
        .update({ stripe_customer_id: customerId })
        .eq('id', org.id);
    }

    const origin = req.headers.get('origin') || process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000');
    const appUrl = origin.replace(/\/$/, '');

    // Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      mode: 'subscription',
      customer: customerId,
      line_items: [
        {
          price: STRIPE_CONFIG.teamPriceId,
          quantity: 1,
        },
      ],
      tax_id_collection: {
        enabled: true,
      },
      customer_update: {
        name: 'auto',
        address: 'auto',
      },
      billing_address_collection: 'required',
      subscription_data: {
        metadata: {
          organizationId: org.id,
          userId: userData.user.id,
        },
      },
      metadata: {
        organizationId: org.id,
        userId: userData.user.id,
      },
      success_url: `${appUrl}/?billing=success&session_id={CHECKOUT_SESSION_ID}&org_id=${org.id}`,
      cancel_url: `${appUrl}/?billing=canceled`,
    });

    return NextResponse.json({ url: session.url, organizationId: org.id });
  } catch (err: any) {
    console.error('Fehler bei Stripe Checkout:', err);
    return NextResponse.json({ error: 'CHECKOUT_FAILED', message: err.message }, { status: 500 });
  }
}
