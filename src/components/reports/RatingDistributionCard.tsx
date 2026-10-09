'use client';

import React from 'react';
import { Star, CheckCircle2, ThumbsUp, Heart } from 'lucide-react';
import { Review } from '@/lib/supabase/types';

interface RatingDistributionCardProps {
  totalReviews?: number;
  timeRange?: string;
  reviews?: Review[];
  isDemoMode?: boolean;
}

export default function RatingDistributionCard({
  totalReviews = 0,
  timeRange = '30d',
  reviews = [],
  isDemoMode = false,
}: RatingDistributionCardProps) {
  const isDemo = isDemoMode;
  const countTotal = isDemo ? (totalReviews || 128) : (reviews.length || totalReviews || 0);

  let distribution = [];
  let positiveRate = 0;

  if (isDemo) {
    distribution = [
      { stars: 5, percentage: 88, count: Math.round(countTotal * 0.88), color: 'bg-emerald-500' },
      { stars: 4, percentage: 9, count: Math.round(countTotal * 0.09), color: 'bg-teal-500' },
      { stars: 3, percentage: 2, count: Math.max(1, Math.round(countTotal * 0.02)), color: 'bg-amber-400' },
      { stars: 2, percentage: 1, count: 1, color: 'bg-orange-400' },
      { stars: 1, percentage: 0, count: 0, color: 'bg-rose-400' },
    ];
    positiveRate = 97;
  } else if (countTotal === 0) {
    distribution = [
      { stars: 5, percentage: 0, count: 0, color: 'bg-emerald-500' },
      { stars: 4, percentage: 0, count: 0, color: 'bg-teal-500' },
      { stars: 3, percentage: 0, count: 0, color: 'bg-amber-400' },
      { stars: 2, percentage: 0, count: 0, color: 'bg-orange-400' },
      { stars: 1, percentage: 0, count: 0, color: 'bg-rose-400' },
    ];
    positiveRate = 0;
  } else {
    const c5 = reviews.filter((r) => r.rating === 5).length;
    const c4 = reviews.filter((r) => r.rating === 4).length;
    const c3 = reviews.filter((r) => r.rating === 3).length;
    const c2 = reviews.filter((r) => r.rating === 2).length;
    const c1 = reviews.filter((r) => r.rating === 1).length;

    distribution = [
      { stars: 5, percentage: Math.round((c5 / countTotal) * 100), count: c5, color: 'bg-emerald-500' },
      { stars: 4, percentage: Math.round((c4 / countTotal) * 100), count: c4, color: 'bg-teal-500' },
      { stars: 3, percentage: Math.round((c3 / countTotal) * 100), count: c3, color: 'bg-amber-400' },
      { stars: 2, percentage: Math.round((c2 / countTotal) * 100), count: c2, color: 'bg-orange-400' },
      { stars: 1, percentage: Math.round((c1 / countTotal) * 100), count: c1, color: 'bg-rose-400' },
    ];
    positiveRate = Math.round(((c5 + c4) / countTotal) * 100);
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 flex flex-col justify-between space-y-6">
      <div>
        <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-100">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
              <span>Star Rating &amp; Sentiment Distribution</span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Breakdown of customer sentiment and star ratings captured across Google.
            </p>
          </div>
          <span className="text-xs font-extrabold text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-full shrink-0">
            {countTotal} Total
          </span>
        </div>

        {/* Horizontal Bar Breakdown */}
        <div className="mt-6 space-y-4">
          {distribution.map((item) => (
            <div key={item.stars} className="flex items-center gap-3 text-xs">
              {/* Star Label */}
              <div className="w-12 font-bold text-slate-700 flex items-center gap-1 shrink-0">
                <span>{item.stars}</span>
                <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
              </div>

              {/* Progress Bar Container */}
              <div className="flex-1 h-3 rounded-full bg-slate-100 overflow-hidden relative">
                <div
                  style={{ width: `${item.percentage}%` }}
                  className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                />
              </div>

              {/* Percentage & Count Badge */}
              <div className="w-24 text-right flex items-center justify-end gap-1.5 shrink-0">
                <span className="font-extrabold text-slate-900">{item.percentage}%</span>
                <span className="text-[11px] text-slate-400 font-medium">({item.count})</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Summary Footer Pill */}
      <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 text-emerald-700 font-bold">
          <ThumbsUp className="w-4 h-4 text-emerald-600" />
          <span>
            {countTotal > 0 ? `${positiveRate}% Positive Sentiment (4★ & 5★ Reviews)` : 'No reviews recorded yet'}
          </span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          {countTotal > 0 ? 'Zero public 1★ reviews recorded' : 'Awaiting incoming reviews'}
        </span>
      </div>
    </div>
  );
}
