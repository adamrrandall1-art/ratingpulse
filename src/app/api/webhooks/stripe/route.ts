import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey);
}

export async function POST(req: NextRequest) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe) {
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      // In local development or testing without signature
      event = JSON.parse(rawBody) as Stripe.Event;
      console.warn('[Stripe Webhook] Warning: Processing webhook without signature verification (STRIPE_WEBHOOK_SECRET is unset).');
    }
  } catch (err: any) {
    console.error(`[Stripe Webhook Error]: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const supabase = getSupabaseClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = session.customer as string | undefined;
        const subscriptionId = session.subscription as string | undefined;
        const userId = session.client_reference_id || session.metadata?.user_id;
        const customerEmail = session.customer_details?.email || session.customer_email || session.metadata?.user_email;

        console.log('[Stripe Webhook] checkout.session.completed:', {
          customerId,
          subscriptionId,
          userId,
          customerEmail,
        });

        if (supabase && (userId || customerEmail)) {
          const updatePayload: Record<string, any> = {
            plan_status: 'active',
            updated_at: new Date().toISOString(),
          };
          if (customerId) updatePayload.stripe_customer_id = customerId;
          if (subscriptionId) updatePayload.stripe_subscription_id = subscriptionId;

          let query = supabase.from('profiles').update(updatePayload);
          if (userId) {
            query = query.eq('id', userId);
          } else if (customerEmail) {
            query = query.eq('email', customerEmail);
          }

          const { error } = await query;
          if (error) {
            console.error('[Stripe Webhook] Database update error on checkout completion:', error);
          }
        }
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const subscriptionId = subscription.id;
        const status = subscription.status; // 'active', 'past_due', 'trialing', 'canceled', 'unpaid', etc.

        console.log('[Stripe Webhook] customer.subscription.updated:', {
          customerId,
          subscriptionId,
          status,
        });

        if (supabase && customerId) {
          const { error } = await supabase
            .from('profiles')
            .update({
              plan_status: status === 'active' || status === 'trialing' ? status : status === 'past_due' ? 'past_due' : 'canceled',
              stripe_subscription_id: subscriptionId,
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId);

          if (error) {
            console.error('[Stripe Webhook] Database update error on subscription update:', error);
          }
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        console.log('[Stripe Webhook] customer.subscription.deleted:', {
          customerId,
          subscriptionId: subscription.id,
        });

        if (supabase && customerId) {
          const { error } = await supabase
            .from('profiles')
            .update({
              plan_status: 'canceled',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId);

          if (error) {
            console.error('[Stripe Webhook] Database update error on subscription deletion:', error);
          }
        }
        break;
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        console.log('[Stripe Webhook] invoice.payment_succeeded for customer:', customerId);

        if (supabase && customerId) {
          await supabase
            .from('profiles')
            .update({
              plan_status: 'active',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;
        console.warn('[Stripe Webhook] invoice.payment_failed for customer:', customerId);

        if (supabase && customerId) {
          await supabase
            .from('profiles')
            .update({
              plan_status: 'past_due',
              updated_at: new Date().toISOString(),
            })
            .eq('stripe_customer_id', customerId);
        }
        break;
      }

      default:
        // Unhandled event types
        break;
    }

    return NextResponse.json({ received: true });
  } catch (error: any) {
    console.error('[Stripe Webhook Processing Error]:', error);
    return NextResponse.json(
      { error: error.message || 'Webhook handler error' },
      { status: 500 }
    );
  }
}
