import Stripe from 'stripe';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';

export const isStripeConfigured = Boolean(
  stripeSecretKey &&
  stripeSecretKey !== 'your-stripe-secret-key' &&
  (stripeSecretKey.startsWith('sk_test_') || stripeSecretKey.startsWith('sk_live_') || stripeSecretKey.startsWith('sk_'))
);

export const stripe = isStripeConfigured
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2025-02-24.acacia' as any,
      typescript: true,
    })
  : null;

// Environment helpers
export const getStripePublishableKey = () =>
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  process.env.STRIPE_PUBLISHABLE_KEY ||
  '';

export const getStripePriceIdPro = () =>
  process.env.STRIPE_PRICE_ID_PRO ||
  process.env.STRIPE_GROWTH_PRICE_ID ||
  '';

export const getAppUrl = (reqOrigin?: string) => {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    reqOrigin ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://ratingpulse.co')
  ).replace(/\/$/, '');
};

export const STRIPE_PLANS = {
  GROWTH_MONTHLY: {
    id: 'plan_growth_monthly',
    name: 'RatingPulse Pro (Growth Plan)',
    description: 'Unlimited Automated SMS Review Invites & Gemini AI SEO Replies',
    amount: 2500, // $25.00 in cents
    currency: 'usd',
    interval: 'month' as const,
    trialDays: 14,
  },
};
