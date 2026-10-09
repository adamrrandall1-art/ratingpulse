'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Star,
  TrendingUp,
  Send,
  Zap,
  Download,
  Calendar,
  CheckCircle2,
  ArrowUpRight,
  Sparkles,
  BarChart3,
  Bot,
  Clock,
  Printer
} from 'lucide-react';
import { toast } from 'sonner';
import { useRatingPulseStore } from '@/lib/store';
import RatingDistributionCard from '@/components/reports/RatingDistributionCard';
import ChannelPerformanceCard from '@/components/reports/ChannelPerformanceCard';
import RatingTrendCard from '@/components/reports/RatingTrendCard';

type TimeRangeOption = '30d' | '60d' | '90d' | 'all';

export default function ReportsPage() {
  const { activeBusiness, reviews, invites, isDemoMode } = useRatingPulseStore();
  const [timeRange, setTimeRange] = useState<TimeRangeOption>('30d');
  const [isExporting, setIsExporting] = useState(false);

  const businessName = isDemoMode
    ? (activeBusiness.name || 'RatingPulse')
    : (activeBusiness.name || 'Your Business');

  const totalReviews = isDemoMode
    ? (activeBusiness.reviewCount || 128)
    : (reviews.length || activeBusiness.reviewCount || 0);

  if (!isDemoMode && !activeBusiness.isConnected) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="p-10 sm:p-14 bg-white rounded-2xl border border-slate-200 text-center flex flex-col items-center shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
            <BarChart3 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Business Connected</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
            Connect your Google Business Profile in Setup to view review velocity, invite conversion rates, and performance analytics.
          </p>
          <div className="mt-5">
            <Link
              href="/dashboard/setup"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
            >
              Connect Google Business Profile →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const hasRatings = isDemoMode
    ? true
    : (activeBusiness.rating > 0 || reviews.length > 0);

  const ratingScore = isDemoMode
    ? (activeBusiness.rating > 0 ? activeBusiness.rating.toFixed(1) : '4.9')
    : (hasRatings
        ? (activeBusiness.rating > 0
            ? activeBusiness.rating.toFixed(1)
            : (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1))
        : '—');

  const totalInvitesSent = isDemoMode ? 153 : invites.length;
  const completedReviewsFromInvites = isDemoMode
    ? 48
    : invites.filter(i => i.status === 'reviewed' || i.status === 'completed').length;
  const conversionRate = totalInvitesSent > 0
    ? `${((completedReviewsFromInvites / totalInvitesSent) * 100).toFixed(1)}%`
    : '0.0%';

  const reviewedWithAiReply = isDemoMode
    ? 124
    : reviews.filter(r => r.status === 'published' || r.review_reply || r.published_reply).length;
  const aiResponseRate = totalReviews > 0
    ? `${((reviewedWithAiReply / totalReviews) * 100).toFixed(1)}%`
    : '0.0%';

  const reviewVelocity = isDemoMode
    ? '+24'
    : (reviews.length > 0 ? `+${reviews.length}` : '0');

  const handleExportReport = () => {
    setIsExporting(true);
    try {
      const csvReport = `RatingPulse Performance Report - ${businessName}\nGenerated: ${new Date().toLocaleDateString()}\nTimeframe: ${timeRange.toUpperCase()}\n\nKey Performance Indicators\nAverage Google Rating,${ratingScore} / 5.0\nMonthly Review Velocity,${reviewVelocity} new reviews\nInvite Conversion Rate,${conversionRate} (${completedReviewsFromInvites} completed / ${totalInvitesSent} sent)\nAI Response Rate,${aiResponseRate}\n\nChannel Breakdown\nChannel,Sent,Delivered %,Clicks / Opens,Completed Reviews,Conversion %\nSMS Invites,${totalInvitesSent},100.0%,50.0% click rate,${completedReviewsFromInvites},${conversionRate}\n\nExported from RatingPulse`;

      const blob = new Blob([csvReport], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `ratingpulse_report_${timeRange}_${new Date().toISOString().slice(0, 10)}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast.success('Performance Report Exported!', {
        description: 'Formatted CSV summary downloaded successfully.',
      });
    } catch {
      toast.error('Failed to export report.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      
      {/* 1. Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              Performance &amp; Review Analytics
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-0.5 rounded-full">
              {isDemoMode ? 'Demo Analytics' : 'Live Sync Active'}
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Monitor customer sentiment, Google rating trends, and invite conversion performance for <strong className="text-slate-900">{businessName}</strong>.
          </p>
        </div>

        {/* Time-Range Selector & Export Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Time Range Pills */}
          <div className="inline-flex rounded-xl border border-slate-200 p-1 bg-slate-50 text-xs font-semibold text-slate-600">
            {[
              ['30d', 'Last 30 Days'],
              ['60d', '60 Days'],
              ['90d', '90 Days'],
              ['all', 'All Time'],
            ].map(([val, label]) => (
              <button
                key={val}
                type="button"
                onClick={() => setTimeRange(val as TimeRangeOption)}
                className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                  timeRange === val
                    ? 'bg-white text-slate-900 shadow-xs font-bold'
                    : 'hover:text-slate-900'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Export Report Button */}
          <button
            type="button"
            onClick={handleExportReport}
            disabled={isExporting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Report</span>
          </button>
        </div>
      </div>

      {/* 2. Top KPI Cards Grid (4 Columns) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* KPI 1: Average Google Rating */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Average Google Rating
            </span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{ratingScore}</span>
              {hasRatings && <span className="text-sm font-semibold text-slate-400">/ 5.0</span>}
              {isDemoMode && (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full ml-auto">
                  <ArrowUpRight className="w-3 h-3" /> +0.3 vs last mo
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {totalReviews > 0 ? `Based on ${totalReviews} total reviews` : 'No ratings recorded yet'}
            </p>
          </div>
        </div>

        {/* KPI 2: Review Velocity (Monthly) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Review Velocity
            </span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{reviewVelocity}</span>
              <span className="text-xs text-slate-400 font-medium">reviews</span>
              {isDemoMode && (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full ml-auto">
                  <ArrowUpRight className="w-3 h-3" /> +18%
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">New reviews received in the last 30 days</p>
          </div>
        </div>

        {/* KPI 3: Invite Conversion Rate */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              Invite Conversion Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Send className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{conversionRate}</span>
              {isDemoMode && (
                <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full ml-auto">
                  <ArrowUpRight className="w-3 h-3" /> +4.2% lift
                </span>
              )}
            </div>
            <p className="text-xs text-slate-500">
              {completedReviewsFromInvites} reviews generated from {totalInvitesSent} sent invites
            </p>
          </div>
        </div>

        {/* KPI 4: AI 1-Tap Response Rate */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs flex flex-col justify-between space-y-3">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
              AI 1-Tap Response Rate
            </span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">{aiResponseRate}</span>
              <span className="inline-flex items-center gap-0.5 text-[11px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full ml-auto">
                <CheckCircle2 className="w-3 h-3" /> Active
              </span>
            </div>
            <p className="text-xs text-slate-500">Average response turnaround: &lt; 2 hours</p>
          </div>
        </div>

      </div>

      {/* 3. Section 3: 30-Day Trajectory Trend Chart */}
      <RatingTrendCard
        timeRange={timeRange}
        reviews={reviews}
        isDemoMode={isDemoMode}
      />

      {/* 4. Section 1 & Section 2 Grid: Sentiment Breakdown & Channel Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column: Star Rating Breakdown (5 cols) */}
        <div className="lg:col-span-5">
          <RatingDistributionCard
            totalReviews={totalReviews}
            timeRange={timeRange}
            reviews={reviews}
            isDemoMode={isDemoMode}
          />
        </div>

        {/* Right Column: SMS vs Email Performance (7 cols) */}
        <div className="lg:col-span-7">
          <ChannelPerformanceCard
            timeRange={timeRange}
            invites={invites}
            isDemoMode={isDemoMode}
          />
        </div>
      </div>

    </div>
  );
}
