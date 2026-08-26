export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { stripe, isStripeConfigured, getAppUrl } from '@/lib/stripe';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const customerId = body.customerId || body.stripeCustomerId || body.stripe_customer_id || '';
    const userEmail = body.email || body.userEmail || '';
    const userId = body.userId || body.user_id || '';
    const returnUrl = body.returnUrl || body.return_url || '';

    const reqOrigin = req.headers.get('origin') || req.nextUrl.origin || undefined;
    const appUrl = getAppUrl(reqOrigin);
    const destinationUrl = returnUrl || `${appUrl}/dashboard/settings`;

    if (!isStripeConfigured || !stripe) {
      return NextResponse.json({
        url: destinationUrl,
        isDemo: true,
        message: 'Stripe demo mode active.',
      });
    }

    let targetCustomerId = customerId;

    // Look up customer ID in Supabase if not provided
    if (!targetCustomerId && (userId || userEmail)) {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseKey) {
        const supabase = createClient(supabaseUrl, supabaseKey);

        // Check subscriptions table
        if (userId) {
          const { data: sub } = await supabase
            .from('subscriptions')
            .select('stripe_customer_id')
            .eq('user_id', userId)
            .maybeSingle();

          if (sub?.stripe_customer_id) {
            targetCustomerId = sub.stripe_customer_id;
          }
        }

        // Check profiles table
        if (!targetCustomerId) {
          let query = supabase.from('profiles').select('stripe_customer_id');
          if (userId) query = query.eq('id', userId);
          else if (userEmail) query = query.eq('email', userEmail);
          const { data: prof } = await query.maybeSingle();
          if (prof?.stripe_customer_id) {
            targetCustomerId = prof.stripe_customer_id;
          }
        }
      }

      // If still not found and email is present, query Stripe customers by email
      if (!targetCustomerId && userEmail) {
        const customerList = await stripe.customers.list({
          email: userEmail,
          limit: 1,
        });
        if (customerList.data.length > 0) {
          targetCustomerId = customerList.data[0].id;
        }
      }
    }

    if (!targetCustomerId) {
      return NextResponse.json(
        {
          error: 'No active Stripe customer found for this account. Please subscribe first.',
          requiresCheckout: true,
        },
        { status: 404 }
      );
    }

    // Create Stripe billing portal session
    const portalSession = await stripe.billingPortal.sessions.create({
      customer: targetCustomerId,
      return_url: destinationUrl,
    });

    return NextResponse.json({ url: portalSession.url });
  } catch (error: any) {
    console.error('Stripe create-portal-session error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal Customer Portal error' },
      { status: 500 }
    );
  }
}
