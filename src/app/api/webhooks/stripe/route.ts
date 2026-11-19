export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { headers } from 'next/headers';
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
    console.error('[Stripe Webhook Error]: Stripe client is not configured.');
    return NextResponse.json({ error: 'Stripe is not configured' }, { status: 500 });
  }

  let event: Stripe.Event;

  try {
    const rawBody = await req.text();
    const headerList = await headers();
    const signature = headerList.get('stripe-signature') || req.headers.get('stripe-signature');

    if (!signature) {
      console.error('[Stripe Webhook Error]: Missing stripe-signature header');
      return NextResponse.json({ error: 'Missing stripe-signature header' }, { status: 400 });
    }

    if (!webhookSecret) {
      console.error('[Stripe Webhook Error]: Missing STRIPE_WEBHOOK_SECRET environment variable');
      return NextResponse.json({ error: 'STRIPE_WEBHOOK_SECRET is not configured' }, { status: 500 });
    }

    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err: any) {
    console.error(`[Stripe Webhook Signature Verification Failed]: ${err.message}`);
    return NextResponse.json({ error: `Webhook signature verification failed: ${err.message}` }, { status: 400 });
  }

  const supabase = getSupabaseClient();

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const customerId = (session.customer as string) || '';
        const subscriptionId = (session.subscription as string) || '';
        const incomingUserId = session.client_reference_id || session.metadata?.userId || session.metadata?.user_id;
        const incomingClerkId = session.metadata?.clerkUserId || '';
        const customerEmail = session.customer_details?.email || session.customer_email || session.metadata?.email || session.metadata?.userEmail;

        console.log('[Stripe Webhook] checkout.session.completed received:', {
          customerId,
          subscriptionId,
          incomingUserId,
          incomingClerkId,
          customerEmail,
        });

        if (supabase && (incomingUserId || incomingClerkId || customerEmail || customerId)) {
          let resolvedProfileId: string | null = incomingUserId || null;
          let candidateClerkId: string | null = incomingClerkId || null;

          try {
            const isUuid = incomingUserId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(incomingUserId);
            let profQuery = supabase.from('profiles').select('id, clerk_user_id, email');
            if (isUuid) {
              profQuery = profQuery.eq('id', incomingUserId);
            } else if (incomingUserId || incomingClerkId) {
              const cid = incomingClerkId || incomingUserId;
              profQuery = profQuery.or(`clerk_user_id.eq.${cid},id.eq.${cid}`);
            } else if (customerEmail) {
              profQuery = profQuery.eq('email', customerEmail);
            } else if (customerId) {
              profQuery = profQuery.eq('stripe_customer_id', customerId);
            }
            const { data: prof } = await profQuery.maybeSingle();
            if (prof?.id) {
              resolvedProfileId = prof.id;
              candidateClerkId = prof.clerk_user_id || candidateClerkId;
            }
          } catch (profLookupErr) {
            console.warn('[Stripe Webhook] Profile lookup warning:', profLookupErr);
          }

          let initialStatus = 'active';
          if (subscriptionId && stripe) {
            try {
              const subObj = await stripe.subscriptions.retrieve(subscriptionId);
              if (subObj?.status === 'trialing') {
                initialStatus = 'trialing';
              }
            } catch {}
          }

          // 1. Record / Upsert into subscriptions table with resolved profile.id UUID
          try {
            await supabase.from('subscriptions').upsert([
              {
                user_id: resolvedProfileId,
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                status: initialStatus,
                plan: 'growth',
                current_period_end: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
              },
            ], { onConflict: 'stripe_customer_id' });
          } catch (subErr) {
            console.warn('[Subscriptions table upsert warning]:', subErr);
          }

          // 2. Update profiles table
          const updatePayload: Record<string, any> = {
            plan_status: initialStatus,
            updated_at: new Date().toISOString(),
          };
          if (customerId) updatePayload.stripe_customer_id = customerId;
          if (subscriptionId) updatePayload.stripe_subscription_id = subscriptionId;

          let query = supabase.from('profiles').update(updatePayload);
          if (resolvedProfileId) {
            query = query.eq('id', resolvedProfileId);
          } else if (candidateClerkId) {
            query = query.eq('clerk_user_id', candidateClerkId);
          } else if (customerEmail) {
            query = query.eq('email', customerEmail);
          } else if (customerId) {
            query = query.eq('stripe_customer_id', customerId);
          }

          const { error } = await query;
          if (error) {
            console.error('[Stripe Webhook] Error updating profile on checkout.session.completed:', error);
          } else {
            console.log('[Stripe Webhook] Profile successfully marked as active Pro');
          }
        }
        break;
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;
        const subscriptionId = subscription.id;
        const status = subscription.status;
        const currentPeriodEnd = (subscription as any).current_period_end
          ? new Date((subscription as any).current_period_end * 1000).toISOString()
          : new Date().toISOString();

        console.log(`[Stripe Webhook] ${event.type}:`, {
          customerId,
          subscriptionId,
          status,
        });

        if (supabase && customerId) {
          const mappedPlanStatus =
            status === 'active'
              ? 'active'
              : status === 'trialing'
              ? 'trialing'
              : status === 'past_due'
              ? 'past_due'
              : 'canceled';

          let subUserId: string | null = null;
          try {
            const { data: existingSub } = await supabase
              .from('subscriptions')
              .select('user_id')
              .eq('stripe_customer_id', customerId)
              .maybeSingle();
            subUserId = existingSub?.user_id || subscription.metadata?.userId || subscription.metadata?.user_id || null;
            if (!subUserId) {
              const { data: prof } = await supabase
                .from('profiles')
                .select('id')
                .eq('stripe_customer_id', customerId)
                .maybeSingle();
              if (prof?.id) subUserId = prof.id;
            }
          } catch {}

          await Promise.allSettled([
            supabase
              .from('subscriptions')
              .upsert({
                stripe_customer_id: customerId,
                stripe_subscription_id: subscriptionId,
                user_id: subUserId,
                status: mappedPlanStatus,
                plan: 'growth',
                current_period_end: currentPeriodEnd,
                updated_at: new Date().toISOString(),
              }, { onConflict: 'stripe_customer_id' }),

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

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = (invoice.customer as string) || '';
        const subscriptionId = ((invoice as any).subscription as string) || '';

        console.log('[Stripe Webhook] invoice.payment_succeeded:', { customerId, subscriptionId });
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
        const customerId = (invoice.customer as string) || '';

        console.warn('[Stripe Webhook] invoice.payment_failed:', { customerId });
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
        console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
    }

    return NextResponse.json({ received: true }, { status: 200 });
  } catch (err: any) {
    console.error(`[Stripe Webhook Handler Exception]: ${err.message}`);
    return NextResponse.json({ error: 'Webhook processing failed', details: err.message }, { status: 500 });
  }
}
