export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  stripe,
  isStripeConfigured,
  STRIPE_PLANS,
  getStripePriceIdPro,
  getAppUrl,
} from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ADMIN_KEY ||
    process.env.SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.SUPABASE_ANON_KEY ||
    '';
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const rawUserId = body.userId || body.user_id || '';
    const userEmail = body.email || body.userEmail || body.customerEmail || '';
    const businessId = body.businessId || body.business_id || '';
    const customPriceId = body.priceId || body.price_id || '';
    let customerId = body.customerId || body.stripeCustomerId || body.stripe_customer_id || '';

    let resolvedProfileId = body.profileId || '';
    let clerkUserId = body.clerkUserId || '';

    if (!resolvedProfileId || !UUID_REGEX.test(resolvedProfileId)) {
      if (rawUserId && UUID_REGEX.test(rawUserId)) {
        resolvedProfileId = rawUserId;
      } else {
        const supabaseAdmin = getSupabaseAdmin();
        if (supabaseAdmin && (rawUserId || clerkUserId || userEmail)) {
          try {
            const queryId = rawUserId || clerkUserId;
            let q = supabaseAdmin.from('profiles').select('id, clerk_user_id, stripe_customer_id');
            if (queryId) {
              q = q.or(`id.eq.${queryId},clerk_user_id.eq.${queryId}`);
            } else if (userEmail) {
              q = q.eq('email', userEmail);
            }
            const { data: prof } = await q.maybeSingle();
            if (prof?.id) {
              resolvedProfileId = prof.id;
              if (prof.clerk_user_id) clerkUserId = prof.clerk_user_id;
              if (!customerId && prof.stripe_customer_id) customerId = prof.stripe_customer_id;
            }
          } catch (resErr) {
            console.warn('[create-checkout-session] Profile lookup note:', resErr);
          }
        }
      }
    }

    const effectiveUserId = resolvedProfileId || rawUserId;

    const reqOrigin = req.headers.get('origin') || req.nextUrl.origin || undefined;
    const appUrl = getAppUrl(reqOrigin);

    if (isStripeConfigured && stripe) {
      const priceId = getStripePriceIdPro();

      const lineItems = priceId
        ? [{ price: priceId, quantity: 1 }]
        : [
            {
              price_data: {
                currency: STRIPE_PLANS.GROWTH_MONTHLY.currency,
                product_data: {
                  name: STRIPE_PLANS.GROWTH_MONTHLY.name,
                  description: STRIPE_PLANS.GROWTH_MONTHLY.description,
                  images: ['https://ratingpulse.co/icon.png'],
                },
                unit_amount: STRIPE_PLANS.GROWTH_MONTHLY.amount,
                recurring: {
                  interval: STRIPE_PLANS.GROWTH_MONTHLY.interval,
                },
              },
              quantity: 1,
            },
          ];

      const session = await stripe.checkout.sessions.create({
        mode: 'subscription',
        payment_method_types: ['card'],
        ...(customerId
          ? { customer: customerId }
          : userEmail
          ? { customer_email: userEmail }
          : {}),
        client_reference_id: effectiveUserId || undefined,
        line_items: lineItems,
        subscription_data: {
          trial_period_days: STRIPE_PLANS.GROWTH_MONTHLY.trialDays,
          metadata: {
            userId: effectiveUserId,
            user_id: effectiveUserId,
            clerkUserId: clerkUserId || '',
            businessId: businessId || '',
            business_id: businessId || '',
            userEmail: userEmail || '',
          },
        },
        success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}&upgraded=true`,
        cancel_url: `${appUrl}/dashboard`,
        metadata: {
          userId: effectiveUserId,
          user_id: effectiveUserId,
          clerkUserId: clerkUserId || '',
          businessId: businessId || '',
          business_id: businessId || '',
          email: userEmail || '',
        },
        allow_promotion_codes: true,
      });

      return NextResponse.json({ url: session.url, sessionId: session.id });
    }

    // Demo / Fallback mode
    return NextResponse.json({
      url: `${appUrl}/dashboard?session_id=demo_session&upgraded=true`,
      isDemo: true,
      message: 'Stripe demo checkout session created.',
    });
  } catch (error: any) {
    console.error('Stripe create-checkout-session error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Stripe Checkout error' },
      { status: 500 }
    );
  }
}
