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

export const getStripePriceIdPro = () => {
  const priceId = process.env.STRIPE_PRICE_ID_PRO;
  if (!priceId) {
    throw new Error(
      'Missing required environment variable: STRIPE_PRICE_ID_PRO. Please configure STRIPE_PRICE_ID_PRO in your Vercel project settings.'
    );
  }
  return priceId;
};

export const getAppUrl = (reqOrigin?: string) => {
  return (
    process.env.NEXT_PUBLIC_APP_URL ||
    reqOrigin ||
    (typeof window !== 'undefined' ? window.location.origin : 'https://ratingpulse.co')
  ).replace(/\/$/, '');
};

export const STRIPE_PLANS = {
  GROWTH_MONTHLY: {
    id: process.env.STRIPE_PRICE_ID_PRO || '',
    name: 'RatingPulse Pro (Growth Plan)',
    description: 'Unlimited Automated SMS Review Invites & Gemini AI SEO Replies',
    amount: 4900, // $49.00 in cents
    currency: 'usd',
    interval: 'month' as const,
    trialDays: 14,
  },
};
