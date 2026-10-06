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

interface TrendPoint {
  date: string;
  rating: number;
  newReviews: number;
  label: string;
}

interface RatingTrendCardProps {
  timeRange?: string;
}

const TREND_DATA_30D: TrendPoint[] = [
  { date: 'Sep 7', rating: 4.6, newReviews: 3, label: 'Week 1' },
  { date: 'Sep 14', rating: 4.7, newReviews: 6, label: 'Week 2' },
  { date: 'Sep 21', rating: 4.75, newReviews: 5, label: 'Week 3' },
  { date: 'Sep 28', rating: 4.82, newReviews: 7, label: 'Week 4' },
  { date: 'Oct 6', rating: 4.90, newReviews: 8, label: 'Today' },
];

export default function RatingTrendCard({ timeRange = '30d' }: RatingTrendCardProps) {
  const [hoveredPoint, setHoveredPoint] = useState<TrendPoint | null>(null);

  // SVG dimensions & coordinate calculations
  const width = 600;
  const height = 180;
  const paddingX = 40;
  const paddingY = 25;

  const minRating = 4.5;
  const maxRating = 5.0;

  const points = TREND_DATA_30D.map((p, idx) => {
    const x = paddingX + (idx / (TREND_DATA_30D.length - 1)) * (width - 2 * paddingX);
    const normalizedY = (p.rating - minRating) / (maxRating - minRating);
    const y = height - paddingY - normalizedY * (height - 2 * paddingY);
    return { ...p, x, y };
  });

  const pathD = points.reduce((acc, p, idx) => {
    return idx === 0 ? `M ${p.x} ${p.y}` : `${acc} L ${p.x} ${p.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - paddingY} L ${points[0].x} ${height - paddingY} Z`;

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
          <span className="inline-flex items-center gap-1 text-xs font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
            <ArrowUpRight className="w-3.5 h-3.5" />
            +0.30★ Growth
          </span>
        </div>
      </div>

      {/* SVG Chart Area */}
      <div className="relative pt-2">
        {/* Hover Tooltip Overlay */}
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
            {[4.6, 4.7, 4.8, 4.9, 5.0].map((val) => {
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
            <path d={areaD} fill="url(#ratingGradient)" />

            {/* Trajectory Line */}
            <path
              d={pathD}
              fill="none"
              stroke="#4f46e5"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Data Point Circles */}
            {points.map((p, idx) => (
              <g
                key={idx}
                onMouseEnter={() => setHoveredPoint(p)}
                onMouseLeave={() => setHoveredPoint(null)}
                className="cursor-pointer group"
              >
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="6"
                  className="fill-white stroke-indigo-600 stroke-2 group-hover:scale-125 transition-transform"
                />
                <circle
                  cx={p.x}
                  cy={p.y}
                  r="2.5"
                  className="fill-indigo-600"
                />
                {/* Date labels below */}
                <text
                  x={p.x}
                  y={height - 6}
                  textAnchor="middle"
                  className="text-[10px] fill-slate-500 font-sans font-medium"
                >
                  {p.date}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>

      {/* Trajectory Milestone Summary */}
      <div className="grid grid-cols-3 gap-3 pt-2">
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
          <div className="text-[10px] uppercase font-bold text-slate-400">Baseline (Day 1)</div>
          <div className="text-base font-extrabold text-slate-900 mt-0.5">4.60 ★</div>
          <div className="text-[10px] text-slate-500">104 reviews</div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
          <div className="text-[10px] uppercase font-bold text-slate-400">Current Rating</div>
          <div className="text-base font-extrabold text-indigo-700 mt-0.5">4.90 ★</div>
          <div className="text-[10px] text-emerald-600 font-semibold">+24 reviews added</div>
        </div>

        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl text-center">
          <div className="text-[10px] uppercase font-bold text-slate-400">Target Goal</div>
          <div className="text-base font-extrabold text-slate-900 mt-0.5">5.00 ★</div>
          <div className="text-[10px] text-slate-500">Estimated ~18 days</div>
        </div>
      </div>

    </div>
  );
}
