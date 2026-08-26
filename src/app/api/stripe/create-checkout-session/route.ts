export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import {
  stripe,
  isStripeConfigured,
  STRIPE_PLANS,
  getStripePriceIdPro,
  getAppUrl,
} from '@/lib/stripe';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const userId = body.userId || body.user_id || '';
    const userEmail = body.email || body.userEmail || body.customerEmail || '';
    const businessId = body.businessId || body.business_id || '';
    const customPriceId = body.priceId || body.price_id || '';
    const customerId = body.customerId || body.stripeCustomerId || body.stripe_customer_id || '';

    const reqOrigin = req.headers.get('origin') || req.nextUrl.origin || undefined;
    const appUrl = getAppUrl(reqOrigin);

    if (isStripeConfigured && stripe) {
      const priceId = customPriceId || getStripePriceIdPro();

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
        client_reference_id: userId || undefined,
        line_items: lineItems,
        subscription_data: {
          trial_period_days: STRIPE_PLANS.GROWTH_MONTHLY.trialDays,
          metadata: {
            userId: userId || '',
            user_id: userId || '',
            businessId: businessId || '',
            business_id: businessId || '',
            userEmail: userEmail || '',
          },
        },
        success_url: `${appUrl}/dashboard?session_id={CHECKOUT_SESSION_ID}&upgraded=true`,
        cancel_url: `${appUrl}/dashboard`,
        metadata: {
          userId: userId || '',
          user_id: userId || '',
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
