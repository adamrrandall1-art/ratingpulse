'use client';

import React from 'react';
import {
  Star,
  Sparkles,
  MessageSquareCheck,
  ShieldCheck,
  Zap,
  TrendingUp
} from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';
import ReviewsFeed from '@/components/dashboard/ReviewsFeed';
import Link from 'next/link';

export default function ReviewsPage() {
  const { profile, reviews, pendingReviewsCount, publishedReviewsCount } = useRatingPulseStore();

  return (
    <div className="space-y-6">
      
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <MessageSquareCheck className="w-6 h-6 text-blue-600" />
            Google Review Approvals & Gemini AI Center
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Incoming reviews are analyzed by Gemini AI to draft responses with your local SEO keywords.
          </p>
        </div>

        {/* Quick KPI stats */}
        <div className="flex items-center gap-2">
          <div className="px-3.5 py-2 rounded-xl bg-blue-50 border border-blue-200/80 text-blue-800 text-xs font-bold flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping" />
            {pendingReviewsCount} Awaiting 1-Tap
          </div>
          <div className="px-3.5 py-2 rounded-xl bg-emerald-50 border border-emerald-200/80 text-emerald-800 text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            {publishedReviewsCount} Live on Google
          </div>
        </div>
      </div>

      {/* Main Reviews Feed Component */}
      <ReviewsFeed initialFilter="all" showSimulateButton={true} />

      {/* SEO & Gemini Tips Card */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-blue-300 text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4 text-amber-300" />
            How Gemini AI Replies Boost Local 3-Pack Rankings
          </div>
          <p className="text-xs text-slate-300 max-w-2xl leading-relaxed">
            Google&apos;s local search algorithm indexes business review replies. Gemini AI strategically weaves in keywords like <span className="text-blue-200 font-bold">#emergency care</span> and <span className="text-blue-200 font-bold">#friendly service</span> to increase your Google Maps visibility.
          </p>
        </div>

        <Link
          href="/dashboard/settings"
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold whitespace-nowrap shadow-md transition-colors"
        >
          Configure SEO Keywords →
        </Link>
      </div>

    </div>
  );
}
