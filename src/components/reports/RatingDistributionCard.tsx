'use client';

import React from 'react';
import { Star, CheckCircle2, ThumbsUp, Heart } from 'lucide-react';

interface RatingDistributionCardProps {
  totalReviews?: number;
  timeRange?: string;
}

export default function RatingDistributionCard({
  totalReviews = 128,
  timeRange = '30d',
}: RatingDistributionCardProps) {
  // Distribution data based on 128 reviews (88% 5★, 9% 4★, 2% 3★, 1% 2★, 0% 1★)
  const distribution = [
    {
      stars: 5,
      percentage: 88,
      count: Math.round(totalReviews * 0.88),
      color: 'bg-emerald-500',
      textColor: 'text-emerald-700',
      badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    {
      stars: 4,
      percentage: 9,
      count: Math.round(totalReviews * 0.09),
      color: 'bg-teal-500',
      textColor: 'text-teal-700',
      badgeBg: 'bg-teal-50 text-teal-700 border-teal-200',
    },
    {
      stars: 3,
      percentage: 2,
      count: Math.max(1, Math.round(totalReviews * 0.02)),
      color: 'bg-amber-400',
      textColor: 'text-amber-700',
      badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      stars: 2,
      percentage: 1,
      count: 1,
      color: 'bg-orange-400',
      textColor: 'text-orange-700',
      badgeBg: 'bg-orange-50 text-orange-700 border-orange-200',
    },
    {
      stars: 1,
      percentage: 0,
      count: 0,
      color: 'bg-rose-400',
      textColor: 'text-rose-700',
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  ];

  const positiveRate = 97; // 5★ + 4★ = 97%

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
            {totalReviews} Total
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
          <span>{positiveRate}% Positive Sentiment (4★ &amp; 5★ Reviews)</span>
        </div>
        <span className="text-[11px] text-slate-400 font-medium">
          Zero public 1★ reviews recorded
        </span>
      </div>
    </div>
  );
}
