'use client';

import React, { useState } from 'react';
import { Calculator, TrendingUp, DollarSign, Star, ArrowRight, Sparkles } from 'lucide-react';
import Link from 'next/link';

export default function InteractiveDemo() {
  const [monthlyCustomers, setMonthlyCustomers] = useState(120);
  const [avgTicketValue, setAvgTicketValue] = useState(150);

  // Conversion model: ~22% of SMS recipients leave a review with RatingPulse
  const estimatedReviewsPerMonth = Math.round(monthlyCustomers * 0.22);
  const estimatedAnnualReviews = estimatedReviewsPerMonth * 12;

  // Revenue lift model: each 10 new 5-star reviews drives ~1.8 new inbound organic clients
  const estimatedNewClientsPerMonth = Math.max(1, Math.round((estimatedReviewsPerMonth / 10) * 1.8));
  const estimatedAnnualRevenueLift = estimatedNewClientsPerMonth * avgTicketValue * 12;

  return (
    <section id="calculator" className="py-28 bg-[#0B0F17] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Calculator className="w-3.5 h-3.5 text-emerald-400" />
            ROI Estimation Tool
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Calculate Your Estimated Review & Revenue Growth
          </h2>
          <p className="mt-3 text-base text-slate-300">
            See how automated SMS invites transform regular customer volume into a powerful local search moat.
          </p>
        </div>

        {/* Calculator Main Box */}
        <div className="max-w-4xl mx-auto rounded-3xl bg-slate-900 text-white shadow-2xl p-6 sm:p-10 border border-slate-800">
          <div className="grid md:grid-cols-12 gap-8 items-center">
            
            {/* Left: Input Sliders */}
            <div className="md:col-span-6 space-y-8">
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-slate-300">
                    Monthly Customers Served
                  </label>
                  <span className="text-lg font-bold text-emerald-400">
                    {monthlyCustomers} customers
                  </span>
                </div>
                <input
                  type="range"
                  min="20"
                  max="600"
                  step="10"
                  value={monthlyCustomers}
                  onChange={(e) => setMonthlyCustomers(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>20 / mo</span>
                  <span>300 / mo</span>
                  <span>600 / mo</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-sm font-semibold text-slate-300">
                    Average Customer Transaction Value
                  </label>
                  <span className="text-lg font-bold text-emerald-400">
                    ${avgTicketValue}
                  </span>
                </div>
                <input
                  type="range"
                  min="30"
                  max="1200"
                  step="10"
                  value={avgTicketValue}
                  onChange={(e) => setAvgTicketValue(Number(e.target.value))}
                  className="w-full h-2.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-emerald-500"
                />
                <div className="flex justify-between text-[11px] text-slate-500 mt-1">
                  <span>$30</span>
                  <span>$500</span>
                  <span>$1,200+</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs text-slate-300 flex items-start gap-2.5">
                <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                <span>
                  Calculated based on RatingPulse&apos;s benchmark 22% direct conversion rate across active dental, contractor, and auto service accounts.
                </span>
              </div>
            </div>

            {/* Right: Output Calculation Cards */}
            <div className="md:col-span-6 bg-slate-800/90 rounded-2xl p-6 sm:p-7 border border-slate-700 space-y-6">
              
              {/* Est. Reviews */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-700/80">
                <div>
                  <div className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                    New 5-Star Reviews
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-white mt-1 flex items-center gap-2">
                    +{estimatedReviewsPerMonth}
                    <span className="text-sm font-normal text-slate-400">/ month</span>
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center">
                  <Star className="w-6 h-6 fill-amber-400" />
                </div>
              </div>

              {/* Est. Annual Revenue */}
              <div className="flex items-center justify-between pb-5 border-b border-slate-700/80">
                <div>
                  <div className="text-xs uppercase font-bold text-emerald-400 tracking-wider">
                    Est. Annual Revenue Lift
                  </div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-emerald-400 mt-1">
                    +${estimatedAnnualRevenueLift.toLocaleString()}
                  </div>
                </div>
                <div className="w-12 h-12 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                  <TrendingUp className="w-6 h-6" />
                </div>
              </div>

              {/* Total Annual Reviews */}
              <div className="flex justify-between items-center text-xs text-slate-300">
                <span>Annual Review Volume:</span>
                <span className="font-bold text-white">~{estimatedAnnualReviews} verified reviews</span>
              </div>

              {/* CTA Button */}
              <Link
                href="/dashboard"
                className="w-full py-3.5 px-5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all"
              >
                Start Free Trial & Collect Your First 10 Reviews
                <ArrowRight className="w-4 h-4" />
              </Link>

            </div>

          </div>
        </div>

      </div>
    </section>
  );
}
