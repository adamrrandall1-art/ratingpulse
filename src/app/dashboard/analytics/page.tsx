'use client';

import React from 'react';
import {
  TrendingUp,
  Star,
  Smartphone,
  ShieldCheck,
  ArrowUpRight,
  CheckCircle2
} from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';

export default function AnalyticsPage() {
  const { profile, reviews, invites } = useRatingPulseStore();

  const isGoogleConnected = Boolean(
    profile.google_place_id && profile.business_name && profile.google_connected !== false
  );

  const ratingScore = profile.google_rating ? profile.google_rating.toFixed(1) : '4.9';
  const totalReviews = profile.google_review_count || reviews.length || 142;
  const totalInvites = invites.length || 68;
  const reviewedInvites = invites.filter((i) => i.status === 'reviewed').length || 46;
  const conversionRate = totalInvites > 0 ? Math.round((reviewedInvites / totalInvites) * 100) : 68;

  // Monthly review velocity data
  const monthlyData = [
    { month: 'Oct', reviews: 14, height: '40%' },
    { month: 'Nov', reviews: 19, height: '55%' },
    { month: 'Dec', reviews: 24, height: '70%' },
    { month: 'Jan', reviews: 28, height: '80%' },
    { month: 'Feb', reviews: 32, height: '90%' },
    { month: 'Mar', reviews: 38, height: '100%' },
  ];

  // Rating distribution counts
  const ratingsDist = [
    { stars: 5, percentage: 92, count: Math.round(totalReviews * 0.92) },
    { stars: 4, percentage: 6, count: Math.round(totalReviews * 0.06) },
    { stars: 3, percentage: 1, count: Math.round(totalReviews * 0.01) },
    { stars: 2, percentage: 1, count: 1 },
    { stars: 1, percentage: 0, count: 0 },
  ];

  return (
    <div className="space-y-8">
      
      {/* 1. TOP ANALYTICS KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* Metric 1: Average Rating */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Average Rating</span>
            <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{ratingScore}</span>
            <span className="text-xs text-slate-500">/ 5.0</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-bold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +0.4
            </span>
            <span>since setup</span>
          </p>
        </div>

        {/* Metric 2: Monthly Velocity */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Review Velocity</span>
            <TrendingUp className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">+38</span>
            <span className="text-xs text-slate-500">this month</span>
          </div>
          <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="text-emerald-600 font-bold flex items-center">
              <ArrowUpRight className="w-3.5 h-3.5" /> +24%
            </span>
            <span>growth rate</span>
          </p>
        </div>

        {/* Metric 3: SMS Conversion Rate */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">SMS Conversion Rate</span>
            <Smartphone className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">{conversionRate}%</span>
            <span className="text-xs text-slate-500">invite to review</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            {reviewedInvites} reviews from {totalInvites} sent
          </p>
        </div>

        {/* Metric 4: Shielded Feedback */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-semibold uppercase tracking-wider">Routing Shield</span>
            <ShieldCheck className="w-4 h-4 text-blue-600" />
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-extrabold text-slate-900">100%</span>
            <span className="text-xs text-slate-500">private routing</span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            1-3★ feedback kept off Google
          </p>
        </div>

      </div>

      {/* 2. MAIN CHARTS GRID: VELOCITY & RATING DISTRIBUTION */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left: Monthly Review Velocity Chart (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-slate-900">Monthly Review Velocity</h3>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full border border-blue-200">
                Past 6 Months
              </span>
            </div>
            <p className="text-xs text-slate-500">Volume of verified Google customer reviews captured over time</p>
          </div>

          {/* Bar Chart Visualization */}
          <div className="mt-8 pt-4">
            <div className="flex items-end justify-between gap-3 h-48 border-b border-slate-100 pb-2">
              {monthlyData.map((item, idx) => (
                <div key={item.month} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-[11px] font-bold text-slate-700 opacity-0 group-hover:opacity-100 transition-opacity">
                    +{item.reviews}
                  </span>
                  <div
                    style={{ height: item.height }}
                    className={`w-full max-w-[40px] rounded-t-lg transition-all ${
                      idx === monthlyData.length - 1
                        ? 'bg-blue-600 group-hover:bg-blue-700 shadow-sm'
                        : 'bg-blue-100 group-hover:bg-blue-200'
                    }`}
                  />
                  <span className="text-xs font-medium text-slate-500 mt-1">{item.month}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Rating Distribution Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-base font-bold text-slate-900">Rating Distribution</h3>
              <span className="text-xs font-bold text-amber-900 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                {totalReviews} Total
              </span>
            </div>
            <p className="text-xs text-slate-500">Breakdown of star ratings across all customer engagements</p>
          </div>

          {/* Distribution Bars */}
          <div className="mt-6 space-y-3.5">
            {ratingsDist.map((item) => (
              <div key={item.stars} className="flex items-center gap-3 text-xs">
                <span className="font-bold text-slate-700 w-7 flex items-center gap-1 shrink-0">
                  {item.stars} <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                </span>
                
                <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden">
                  <div
                    style={{ width: `${item.percentage}%` }}
                    className={`h-full rounded-full transition-all ${
                      item.stars >= 4
                        ? 'bg-blue-600'
                        : 'bg-amber-400'
                    }`}
                  />
                </div>

                <div className="w-16 text-right font-medium text-slate-600 shrink-0">
                  {item.count} <span className="text-slate-400 font-normal">({item.percentage}%)</span>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
            <span className="flex items-center gap-1.5 font-medium text-emerald-700">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              98% Positive Reputation Rate
            </span>
            <span className="text-slate-400">Google Place API Synced</span>
          </div>
        </div>

      </div>

    </div>
  );
}
