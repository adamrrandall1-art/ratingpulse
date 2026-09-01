export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

function getSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
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
      event = JSON.parse(rawBody) as Stripe.Event;
      console.warn('[Stripe Webhook] Processing event without signature verification.');
    }
  } catch (err: any) {
    console.error(`[Stripe Webhook Signature Error]: ${err.message}`);
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 });
  }

  const supabase = getSupabaseClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = (session.customer as string) || '';
        const subscriptionId = (session.subscription as string) || '';
        const userId = session.client_reference_id || session.metadata?.userId || session.metadata?.user_id;
        const customerEmail = session.customer_details?.email || session.customer_email || session.metadata?.email || session.metadata?.userEmail;

        console.log('[Stripe Webhook] checkout.session.completed:', {
          customerId,
          subscriptionId,
          userId,
          customerEmail,
        });

        if (supabase && (userId || customerEmail || customerId)) {
          // 1. Record / Upsert into subscriptions table
          try {
            await supabase.from('subscriptions').upsert([
              {
                user_id: userId || null,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                status: 'active',
                plan: 'growth',
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ]);
          } catch (subErr) {
            console.warn('[Subscriptions table upsert warning]:', subErr);
          }

          // 2. Update profiles table
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
          } else if (customerId) {
            query = query.eq('stripe_customer_id', customerId);
          }

          const { error } = await query;
          if (error) {
            console.error('[Stripe Webhook] Error updating profile on checkout.session.completed:', error);
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const subscriptionId = subscription.id;
        const status = subscription.status; // 'active', 'trialing', 'past_due', 'canceled', etc.
        const currentPeriodEnd = (subscription as any).current_period_end
          ? new Date((subscription as any).current_period_end * 1000).toISOString()
          : new Date().toISOString();

        console.log(`[Stripe Webhook] ${event.type}:`, {
          customerId,
          subscriptionId,
          status,
        });

        if (supabase && customerId) {
          // Both 'active' and 'trialing' grant full Pro access
          const mappedPlanStatus =
            status === 'active'
              ? 'active'
              : status === 'trialing'
              ? 'trialing'
              : status === 'past_due'
              ? 'past_due'
              : 'canceled';

          await Promise.allSettled([
            supabase
              .from('subscriptions')
              .update({
                status: mappedPlanStatus,
                current_period_end: currentPeriodEnd,
                updated_at: new Date().toISOString(),
              })
              .eq('stripe_customer_id', customerId),

            supabase
              .from('profiles')
              .update({
                plan_status: mappedPlanStatus,
                stripe_subscription_id: subscriptionId,
                updated_at: new Date().toISOString(),
              })
              .eq('stripe_customer_id', customerId),
          ]);
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
          await Promise.allSettled([
            supabase
              .from('subscriptions')
              .update({
                status: 'canceled',
                updated_at: new Date().toISOString(),
              })
              .eq('stripe_customer_id', customerId),

            supabase
              .from('profiles')
              .update({
                plan_status: 'canceled',
                updated_at: new Date().toISOString(),
              })
              .eq('stripe_customer_id', customerId),
          ]);
        }
        break;
      }

      default:
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (err: any) {
    console.error(`[Stripe Webhook Handler Exception]: ${err.message}`);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}
