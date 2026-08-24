'use client';

import React, { useEffect } from 'react';
import Link from 'next/link';
import {
  CheckCircle2,
  Star,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Zap,
  Calendar,
  CreditCard
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function CheckoutSuccessPage() {
  useEffect(() => {
    try {
      confetti({
        particleCount: 90,
        spread: 70,
        origin: { y: 0.5 },
        colors: ['#2563eb', '#10b981', '#fbbf24', '#38bdf8'],
      });
    } catch {
      // ignore
    }
  }, []);

  const trialEndDate = new Date(Date.now() + 14 * 86400000).toLocaleDateString(undefined, {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4 sm:p-6">
      <div className="max-w-xl w-full bg-white rounded-3xl border border-slate-200 shadow-2xl p-6 sm:p-10 text-center space-y-6">
        
        {/* Animated Success Badge */}
        <div className="w-16 h-16 rounded-3xl bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-md shadow-emerald-500/10">
          <CheckCircle2 className="w-9 h-9" />
        </div>

        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 text-xs font-bold uppercase tracking-wider mb-2">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            14-Day Free Trial Activated
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Welcome to RatingPulse!
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed max-w-md mx-auto">
            Your free trial is officially active. You have full access to automated SMS review invites and Gemini AI reply drafting.
          </p>
        </div>

        {/* Plan Summary Card */}
        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-200/80 text-left space-y-3 text-xs">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <div className="font-bold text-slate-900 text-sm">Growth Plan (Trial)</div>
              <div className="text-slate-500 text-[11px]">Unlimited SMS & Gemini AI Reply Engine</div>
            </div>
            <div className="text-right">
              <span className="font-extrabold text-slate-900 text-base">$0.00</span>
              <div className="text-[10px] text-emerald-600 font-bold">Due Today</div>
            </div>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-blue-600" />
              Trial Period:
            </span>
            <span className="font-bold text-slate-800" suppressHydrationWarning>
              14 Days (Until {trialEndDate})
            </span>
          </div>

          <div className="flex items-center justify-between text-slate-600">
            <span className="flex items-center gap-1.5">
              <CreditCard className="w-3.5 h-3.5 text-blue-600" />
              Recurring Rate:
            </span>
            <span className="font-bold text-slate-800">$25.00 / month</span>
          </div>
        </div>

        {/* 3 Steps To Start Collecting 5-Star Reviews */}
        <div className="text-left space-y-2.5 pt-2">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Quick Next Steps:
          </h3>
          <div className="space-y-2 text-xs text-slate-700">
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                1
              </div>
              <span>Connect your official Google Business Profile in 1 click.</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                2
              </div>
              <span>Send your first test SMS review request using the phone number box.</span>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-5 h-5 rounded-full bg-blue-100 text-blue-700 font-bold flex items-center justify-center shrink-0 text-[10px]">
                3
              </div>
              <span>1-Tap approve AI drafted responses to boost your Google Maps SEO.</span>
            </div>
          </div>
        </div>

        {/* Primary Action Button */}
        <Link
          href="/dashboard"
          className="w-full py-4 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-98"
        >
          <span>Launch Your Dashboard</span>
          <ArrowRight className="w-4 h-4" />
        </Link>

      </div>
    </div>
  );
}
