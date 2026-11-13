import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { supabase } from '@/lib/supabase';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature');
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: any;

  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } else {
      // In local dev without Stripe CLI listener secret, parse directly with warning
      event = JSON.parse(body);
      console.warn('Stripe Webhook processed without signature verification (STRIPE_WEBHOOK_SECRET not set)');
    }
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message);
    return NextResponse.json({ error: 'INVALID_SIGNATURE' }, { status: 400 });
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object;
        const organizationId = session.metadata?.organizationId;
        const customerId = session.customer;
        const subscriptionId = session.subscription;

        if (organizationId) {
          await supabase
            .from('organizations')
            .update({
              plan: 'pro',
              subscription_status: 'active',
              stripe_customer_id: customerId,
              stripe_subscription_id: subscriptionId,
              updated_at: new Date().toISOString(),
            })
            .eq('id', organizationId);
          console.log(`[Stripe Webhook] Org ${organizationId} activated to Pro`);
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object;
        const customerId = subscription.customer;
        const status = subscription.status; // 'active', 'past_due', 'canceled', etc.

        await supabase
          .from('organizations')
          .update({
            subscription_status: status,
            current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object;
        const customerId = subscription.customer;

        await supabase
          .from('organizations')
          .update({
            subscription_status: 'canceled',
            updated_at: new Date().toISOString(),
          })
          .eq('stripe_customer_id', customerId);
        console.log(`[Stripe Webhook] Subscription canceled for customer ${customerId}`);
        break;
      }

      default:
        // Ignore unhandled event types
        break;
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error('Error processing Stripe webhook:', err);
    return NextResponse.json({ error: 'WEBHOOK_HANDLER_ERROR', message: err.message }, { status: 500 });
  }
}
