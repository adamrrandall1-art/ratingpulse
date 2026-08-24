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
    const {
      userEmail,
      userId,
      businessName,
      customerId,
      stripeCustomerId,
    } = body;

    const reqOrigin = req.headers.get('origin') || req.nextUrl.origin || undefined;
    const appUrl = getAppUrl(reqOrigin);

    // If Stripe is configured with a valid secret key, create a live/test session
    if (isStripeConfigured && stripe) {
      const priceId = getStripePriceIdPro();
      const existingCustomer = customerId || stripeCustomerId;

      const lineItems = priceId
        ? [{ price: priceId, quantity: 1 }]
        : [
            {
              price_data: {
                currency: STRIPE_PLANS.GROWTH_MONTHLY.currency,
                product_data: {
                  name: STRIPE_PLANS.GROWTH_MONTHLY.name,
                  description: STRIPE_PLANS.GROWTH_MONTHLY.description,
                  images: ['https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=400&h=400&fit=crop'],
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
        ...(existingCustomer
          ? { customer: existingCustomer }
          : userEmail
          ? { customer_email: userEmail }
          : {}),
        client_reference_id: userId || undefined,
        line_items: lineItems,
        subscription_data: {
          trial_period_days: STRIPE_PLANS.GROWTH_MONTHLY.trialDays, // 14-Day Free Trial
          metadata: {
            plan_name: STRIPE_PLANS.GROWTH_MONTHLY.name,
            business_name: businessName || 'RatingPulse Client',
            user_id: userId || '',
            user_email: userEmail || '',
          },
        },
        success_url: `${appUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${appUrl}/dashboard/settings?checkout=canceled`,
        metadata: {
          user_id: userId || '',
          user_email: userEmail || '',
          business_name: businessName || 'RatingPulse Client',
        },
        allow_promotion_codes: true,
      });

      return NextResponse.json({ url: session.url, sessionId: session.id });
    }

    // Demo / Fallback Mode when Stripe API key is not yet set
    return NextResponse.json({
      url: `${appUrl}/checkout/success?demo=true&trial_days=14`,
      isDemo: true,
      message: 'Demo mode active. Add STRIPE_SECRET_KEY to .env.local for live Stripe checkout.',
    });
  } catch (error: any) {
    console.error('Stripe checkout error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Stripe Checkout error' },
      { status: 500 }
    );
  }
}
