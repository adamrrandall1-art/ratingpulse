'use client';

import React, { useState } from 'react';
import { Check, Star, Shield, Zap, Sparkles } from 'lucide-react';
import CheckoutButton from '@/components/stripe/CheckoutButton';

export default function Pricing() {
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annual'>('monthly');

  const features = [
    'Unlimited automated & manual SMS review invites',
    'Gemini AI Reply Drafting with custom brand voice',
    '1-Tap approval & direct publishing to Google Profile',
    'Local SEO keyword insertion & ranking booster',
    'Real-time negative review alerts & resolution guard',
    'Automated post-service follow-up triggers',
    'Google Places API direct bidirectional sync',
    'Unlimited staff logins & multi-location readiness',
    '24/7 Priority support & onboarding assistance',
  ];

  return (
    <section id="pricing" className="py-28 bg-[#0B0F17] relative">
      {/* Glow */}
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[400px] bg-teal-500/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Zap className="w-3.5 h-3.5" />
            Simple, Transparent Pricing
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            One Flat Price.{' '}
            <span className="text-shimmer">Zero Surprises.</span>
          </h2>
          <p className="mt-3 text-base text-slate-400">
            No per-SMS hidden charges. No tiers locking away AI features. Full access, flat monthly rate.
          </p>

          {/* Billing Switch */}
          <div className="mt-8 inline-flex items-center gap-1 p-1.5 bg-slate-900/80 border border-slate-800 rounded-2xl">
            {(['monthly', 'annual'] as const).map((cycle) => (
              <button
                key={cycle}
                onClick={() => setBillingCycle(cycle)}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  billingCycle === cycle
                    ? cycle === 'annual'
                      ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-lg shadow-emerald-500/20'
                      : 'bg-slate-800 text-white'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {cycle === 'monthly' ? 'Monthly' : (
                  <>Annual <span className="bg-emerald-400 text-slate-950 text-[10px] px-1.5 py-0.5 rounded-full font-extrabold">SAVE 20%</span></>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Pricing Card */}
        <div className="max-w-lg mx-auto relative">
          {/* Outer glow */}
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-br from-emerald-500/20 to-teal-500/20 blur-xl opacity-60 pointer-events-none" />

          <div className="relative bg-slate-900/70 backdrop-blur-lg text-white rounded-3xl p-8 sm:p-10 border border-slate-800/80 shadow-2xl overflow-hidden">

            {/* Top ribbon */}
            <div className="absolute top-0 right-0 bg-gradient-to-l from-emerald-500 to-teal-500 text-slate-950 text-[11px] font-extrabold px-5 py-1.5 rounded-bl-2xl uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" /> 14-Day Free Trial
            </div>

            {/* Plan name */}
            <div className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow-lg shadow-emerald-500/30">
                <Star className="w-4.5 h-4.5 fill-white text-white" />
              </div>
              <h3 className="text-xl font-bold text-white">Growth Plan</h3>
            </div>
            <p className="text-sm text-slate-400 mb-6">
              Everything your business needs to collect 5-star Google reviews and rank #1 locally.
            </p>

            {/* Price */}
            <div className="flex items-baseline gap-2 pb-6 border-b border-slate-800/60">
              <span className="text-5xl font-extrabold tracking-tight text-white">
                {billingCycle === 'monthly' ? '$25' : '$20'}
              </span>
              <span className="text-sm text-slate-500">
                / month {billingCycle === 'annual' && '(billed $240/yr)'}
              </span>
            </div>

            {/* Features */}
            <div className="py-7 space-y-3">
              <p className="text-xs uppercase font-bold text-slate-500 tracking-wider mb-3">Everything Included:</p>
              {features.map((feature, idx) => (
                <div key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                  <div className="w-5 h-5 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-emerald-400" />
                  </div>
                  {feature}
                </div>
              ))}
            </div>

            {/* CTA */}
            <CheckoutButton
              label="Start 14-Day Free Trial"
              className="w-full py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            />

            {/* Subtitle / Trust Badge */}
            <div className="mt-3 text-center text-xs font-semibold text-emerald-400/90">
              Full access for 14 days • Cancel anytime • No long-term contract
            </div>

            {/* Guarantee */}
            <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
              <Shield className="w-4 h-4 text-emerald-500" />
              30-Day 100% Money-Back Guarantee • Cancel Anytime
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
