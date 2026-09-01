'use client';

import React, { useState } from 'react';
import {
  CreditCard,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  ExternalLink,
  Zap,
  AlertCircle,
  Clock,
  ArrowRight
} from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';

export default function BillingSection() {
  const { profile } = useRatingPulseStore();
  const { user } = useAuth();

  const [loadingCheckout, setLoadingCheckout] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const planStatus = profile.plan_status || 'trialing';
  const isActive = planStatus === 'active';
  const isTrialing = planStatus === 'trialing';
  const isPastDue = planStatus === 'past_due';
  const isCanceled = planStatus === 'canceled';

  const handleUpgrade = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (loadingCheckout || loadingPortal) return;
    setLoadingCheckout(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || profile.id,
          email: user?.email || profile.email,
          userEmail: user?.email || profile.email,
          businessName: profile.business_name,
          businessId: profile.google_place_id || profile.id,
          priceId: 'price_1UAZP71k4PvXtJu0TYLD5qVZ',
          customerId: profile.stripe_customer_id,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to initialize checkout session');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No checkout URL returned');
      }
    } catch (err: any) {
      console.error('Checkout error:', err);
      setErrorMessage(err.message || 'Failed to start Stripe checkout');
      setLoadingCheckout(false);
    }
  };

  const handleManageBilling = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (loadingPortal || loadingCheckout) return;
    setLoadingPortal(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/stripe/create-portal-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || profile.id,
          userEmail: user?.email || profile.email,
          customerId: profile.stripe_customer_id,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) {
        if (data.requiresCheckout) {
          // If no customer exists yet, forward to checkout
          await handleUpgrade();
          return;
        }
        throw new Error(data.error || 'Failed to access billing portal');
      }

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error('No portal URL returned');
      }
    } catch (err: any) {
      console.error('Customer portal error:', err);
      setErrorMessage(err.message || 'Unable to open billing portal');
      setLoadingPortal(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <CreditCard className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Subscription & Billing</h3>
            <p className="text-xs text-slate-500">Manage your RatingPulse Pro membership and invoices</p>
          </div>
        </div>

        {/* Status Pill */}
        <div>
          {isActive && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 text-xs font-bold">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Pro Plan (Active)
            </span>
          )}
          {isTrialing && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold">
              <Clock className="w-3.5 h-3.5" />
              14-Day Free Trial
            </span>
          )}
          {isPastDue && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-700 border border-amber-200 text-xs font-bold">
              <AlertCircle className="w-3.5 h-3.5" />
              Payment Past Due
            </span>
          )}
          {isCanceled && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 text-slate-700 border border-slate-300 text-xs font-bold">
              Canceled
            </span>
          )}
        </div>
      </div>

      {/* Plan Card */}
      <div className="p-5 rounded-xl bg-slate-900 text-white border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-emerald-400" />
              <h4 className="text-lg font-bold text-white">RatingPulse Pro (Growth Plan)</h4>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Unlimited SMS review invites, Gemini AI SEO reply generator & Google Places sync.
            </p>
          </div>
          <div className="text-left sm:text-right">
            <span className="text-3xl font-extrabold text-white">$25</span>
            <span className="text-xs text-slate-400"> / month</span>
          </div>
        </div>

        {/* Feature bullets */}
        <div className="grid sm:grid-cols-2 gap-2.5 pt-3 border-t border-slate-800 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Unlimited SMS Review Invites</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Gemini AI Reply Generator</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>1-Tap Google Business Publishing</span>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
            <span>Customer Feedback Sentiment Guard</span>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
        <div className="flex items-center gap-1.5 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Encrypted 256-bit Stripe checkout. Cancel anytime.</span>
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {!isActive && (
            <button
              type="button"
              onClick={handleUpgrade}
              disabled={loadingCheckout || loadingPortal}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/25 transition-all transform active:scale-95 cursor-pointer disabled:opacity-60"
            >
              {loadingCheckout ? (
                <>
                  <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Connecting...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5" />
                  <span>Upgrade to Pro</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={handleManageBilling}
            disabled={loadingPortal || loadingCheckout}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs border border-slate-200 transition-colors cursor-pointer disabled:opacity-60"
          >
            {loadingPortal ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-slate-400 border-t-slate-800 rounded-full animate-spin" />
                <span>Opening Portal...</span>
              </>
            ) : (
              <>
                <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                <span>Manage Billing</span>
              </>
            )}
          </button>
        </div>
      </div>

      {errorMessage && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
