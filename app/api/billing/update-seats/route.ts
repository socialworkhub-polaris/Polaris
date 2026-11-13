import { NextResponse } from 'next/server';
import { stripe, STRIPE_CONFIG } from '@/lib/stripe';
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

    const body = await req.json();
    const { organizationId, targetSeats } = body;

    const requestedSeats = parseInt(targetSeats, 10);
    if (isNaN(requestedSeats) || requestedSeats < 10) {
      return NextResponse.json(
        { error: 'BAD_REQUEST', message: 'Das Mindestkontingent beträgt 10 Plätze.' },
        { status: 400 }
      );
    }

    const userClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL || '',
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
      { global: { headers: { Authorization: `Bearer ${token}` } } }
    );

    // Verify admin role
    const { data: membership, error: memErr } = await userClient
      .from('organization_members')
      .select('role, organization:organizations(*)')
      .eq('organization_id', organizationId)
      .eq('user_id', userData.user.id)
      .single();

    if (memErr || !membership || membership.role !== 'admin') {
      return NextResponse.json(
        { error: 'FORBIDDEN', message: 'Nur Administrator*innen können Plätze anpassen.' },
        { status: 403 }
      );
    }

    const org: any = membership.organization;

    // Verify current member count doesn't exceed requested seats
    const { count: currentMemberCount, error: countErr } = await userClient
      .from('organization_members')
      .select('*', { count: 'exact', head: true })
      .eq('organization_id', organizationId);

    if (countErr) throw countErr;

    if (currentMemberCount && currentMemberCount > requestedSeats) {
      return NextResponse.json(
        {
          error: 'CANNOT_DOWNGRADE_BELOW_MEMBERS',
          message: `Du hast aktuell ${currentMemberCount} aktive Mitglieder. Entferne zuerst Mitglieder, bevor du die Plätze auf ${requestedSeats} reduzierst.`,
        },
        { status: 400 }
      );
    }

    // If there is an active Stripe subscription, update Stripe line items
    if (org.stripe_subscription_id) {
      const subscription = await stripe.subscriptions.retrieve(org.stripe_subscription_id);
      const extraSeats = requestedSeats - 10;
      
      const existingExtraItem = subscription.items.data.find(
        (item) => item.price.id === STRIPE_CONFIG.extraSeatPriceId
      );

      if (extraSeats > 0) {
        if (existingExtraItem) {
          await stripe.subscriptions.update(org.stripe_subscription_id, {
            items: [
              {
                id: existingExtraItem.id,
                quantity: extraSeats,
              },
            ],
            proration_behavior: 'always_invoice',
          });
        } else {
          await stripe.subscriptions.update(org.stripe_subscription_id, {
            items: [
              {
                price: STRIPE_CONFIG.extraSeatPriceId,
                quantity: extraSeats,
              },
            ],
            proration_behavior: 'always_invoice',
          });
        }
      } else {
        // extraSeats === 0, remove extra seat item if it was active
        if (existingExtraItem) {
          await stripe.subscriptionItems.del(existingExtraItem.id, {
            proration_behavior: 'always_invoice',
          });
        }
      }
    }

    // Update seat_limit in Supabase
    await userClient
      .from('organizations')
      .update({ seat_limit: requestedSeats, updated_at: new Date().toISOString() })
      .eq('id', organizationId);

    return NextResponse.json({
      success: true,
      seatLimit: requestedSeats,
      message: `Team-Plätze erfolgreich auf ${requestedSeats} aktualisiert.`,
    });
  } catch (err: any) {
    console.error('Fehler bei Sitzplatz-Upgrade:', err);
    return NextResponse.json({ error: 'SEAT_UPDATE_FAILED', message: err.message }, { status: 500 });
  }
}
