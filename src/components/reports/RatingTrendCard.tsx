'use client';

import React, { useState } from 'react';
import {
  TrendingUp,
  Star,
  Calendar,
  Sparkles,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { Review } from '@/lib/supabase/types';

interface TrendPoint {
  date: string;
  rating: number;
  newReviews: number;
  label: string;
}

interface RatingTrendCardProps {
  timeRange?: string;
  reviews?: Review[];
  isDemoMode?: boolean;
}

const DEMO_TREND_DATA_30D: TrendPoint[] = [
  { date: 'Sep 7', rating: 4.6, newReviews: 3, label: 'Week 1' },
  { date: 'Sep 14', rating: 4.7, newReviews: 6, label: 'Week 2' },
  { date: 'Sep 21', rating: 4.75, newReviews: 5, label: 'Week 3' },
  { date: 'Sep 28', rating: 4.82, newReviews: 7, label: 'Week 4' },
  { date: 'Oct 6', rating: 4.90, newReviews: 8, label: 'Today' },
];

export default function RatingTrendCard({
  timeRange = '30d',
  reviews = [],
  isDemoMode = false,
}: RatingTrendCardProps) {
  const [hoveredPoint, setHoveredPoint] = useState<TrendPoint | null>(null);

  const isDemo = isDemoMode;
  const hasLiveReviews = reviews.length > 0;

  // SVG dimensions & coordinate calculations
  const width = 600;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;

  const minRating = 4.0;
  const maxRating = 5.0;

  const trendData = isDemo
    ? DEMO_TREND_DATA_30D
    : hasLiveReviews
    ? [
        { date: 'Day 1', rating: reviews[0]?.rating || 5.0, newReviews: 1, label: 'Initial' },
        { date: 'Current', rating: (reviews.reduce((a, b) => a + b.rating, 0) / reviews.length) || 5.0, newReviews: reviews.length, label: 'Live' },
      ]
    : [];

  const points = trendData.length > 1
    ? trendData.map((p, idx) => {
        const x = paddingX + (idx / (trendData.length - 1)) * (width - 2 * paddingX);
        const normalizedY = (p.rating - minRating) / (maxRating - minRating);
        const y = height - paddingY - normalizedY * (height - 2 * paddingY);
        return { ...p, x, y };
      })
    : [];

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = points.length > 0
    ? `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`
    : '';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
      
      {/* Header */}
      <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-4 h-4 text-indigo-600" />
            <span>30-Day Google Rating Trajectory</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Continuous rating progression driven by automated post-visit invitations.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isDemo ? (
            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              <ArrowUpRight className="w-3.5 h-3.5" />
              +0.30★ Growth
            </span>
          ) : hasLiveReviews ? (
            <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
              <ArrowUpRight className="w-3.5 h-3.5" />
              Live Rating Active
            </span>
          ) : (
            <span className="inline-flex items-center text-xs font-semibold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
              Awaiting Reviews
            </span>
          )}
        </div>
      </div>

      {/* SVG Chart Area or Empty State */}
      {!isDemo && !hasLiveReviews ? (
        <div className="p-10 rounded-xl bg-slate-50 border border-dashed border-slate-200 text-center text-xs text-slate-500 space-y-1">
          <p className="font-semibold text-slate-700">No rating trajectory yet</p>
          <p className="text-[11px] text-slate-400">
            30-day trend lines will plot automatically once customer reviews begin arriving on Google.
          </p>
        </div>
      ) : (
        <div className="relative pt-2">
          {hoveredPoint && (
            <div
              className="absolute top-2 right-4 bg-slate-900 text-white px-3 py-1.5 rounded-xl shadow-lg text-xs font-sans pointer-events-none transition-all animate-in fade-in zoom-in-95 duration-150 flex items-center gap-2 border border-slate-800"
            >
              <div className="font-bold text-amber-400 flex items-center gap-0.5">
                <span>{hoveredPoint.rating.toFixed(2)}</span>
                <Star className="w-3 h-3 fill-amber-400" />
              </div>
              <span className="text-slate-400">•</span>
              <span className="text-slate-300">{hoveredPoint.date}</span>
              <span className="text-slate-400">•</span>
              <span className="text-emerald-400 font-semibold">+{hoveredPoint.newReviews} reviews</span>
            </div>
          )}

          <div className="w-full overflow-hidden">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="w-full h-44 sm:h-52 overflow-visible"
            >
              <defs>
                <linearGradient id="ratingGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Horizontal Grid lines */}
              {[4.0, 4.25, 4.5, 4.75, 5.0].map((val) => {
                const normalizedY = (val - minRating) / (maxRating - minRating);
                const y = height - paddingY - normalizedY * (height - 2 * paddingY);
                return (
                  <g key={val}>
                    <line
                      x1={paddingX}
                      y1={y}
                      x2={width - paddingX}
                      y2={y}
                      stroke="#f1f5f9"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                    />
                    <text
                      x={paddingX - 10}
                      y={y + 3}
                      textAnchor="end"
                      className="text-[10px] fill-slate-400 font-mono"
                    >
                      {val.toFixed(1)}★
                    </text>
                  </g>
                );
              })}

              {/* Filled Area */}
              {areaD && <path d={areaD} fill="url(#ratingGradient)" />}

              {/* Trajectory Line */}
              {pathD && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="#4f46e5"
                  strokeWidth="3.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              )}

              {/* Interactive Data Point Markers */}
              {points.map((p, idx) => (
                <g key={idx} className="cursor-pointer">
                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={6}
                    className="fill-indigo-600 stroke-white stroke-2 transition-all hover:r-8 shadow-md"
                    onMouseEnter={() => setHoveredPoint(p)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  />
                  <text
                    x={p.x}
                    y={height - 5}
                    textAnchor="middle"
                    className="text-[11px] font-semibold fill-slate-500 select-none"
                  >
                    {p.date}
                  </text>
                </g>
              ))}
            </svg>
          </div>
        </div>
      )}

    </div>
  );
}
