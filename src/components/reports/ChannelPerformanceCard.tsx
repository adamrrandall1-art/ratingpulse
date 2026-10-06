'use client';

import React from 'react';
import {
  Smartphone,
  Mail,
  Zap,
  CheckCircle2,
  TrendingUp,
  MousePointerClick,
  Sparkles,
  ArrowRight
} from 'lucide-react';

interface ChannelPerformanceCardProps {
  timeRange?: string;
}

export default function ChannelPerformanceCard({ timeRange = '30d' }: ChannelPerformanceCardProps) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-7 space-y-6">
      
      {/* Card Header */}
      <div className="pb-3 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <Zap className="w-4 h-4 text-indigo-600" />
            <span>Channel Performance: SMS vs. Email</span>
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Comparative delivery, click-through, and conversion rates across outbound channels.
          </p>
        </div>
        <span className="text-xs font-semibold text-slate-500 bg-slate-100 px-2.5 py-1 rounded-full shrink-0">
          Last 30 Days
        </span>
      </div>

      {/* Dual Comparative Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* Channel 1: SMS (Winner) */}
        <div className="p-5 rounded-2xl border-2 border-indigo-500/30 bg-gradient-to-br from-indigo-50/50 via-white to-white relative shadow-xs flex flex-col justify-between space-y-5">
          {/* Top Winner Badge */}
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-indigo-600 text-white flex items-center justify-center shadow-xs">
                <Smartphone className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">SMS Invites</h4>
                <p className="text-[11px] text-slate-500">1-Tap Direct Link</p>
              </div>
            </div>

            <span className="inline-flex items-center gap-1 text-[11px] font-extrabold text-indigo-700 bg-indigo-100/80 border border-indigo-200 px-2.5 py-1 rounded-full shadow-2xs">
              <Sparkles className="w-3 h-3 text-indigo-600" />
              Highest Conversion
            </span>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Sent</div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">98</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">99.0% Delivered</div>
            </div>

            <div className="p-3 bg-white border border-slate-200 rounded-xl shadow-2xs">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Click-Through</div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">48.2%</div>
              <div className="text-[11px] text-indigo-600 font-semibold mt-0.5">47 Taps</div>
            </div>
          </div>

          {/* Outcome Footer Banner */}
          <div className="p-3.5 bg-indigo-600 text-white rounded-xl flex items-center justify-between shadow-xs">
            <div>
              <div className="text-[10px] uppercase font-bold text-indigo-200 tracking-wider">Google Reviews Completed</div>
              <div className="text-lg font-black">34 Reviews</div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2 py-0.5 rounded-md bg-white/20 text-white font-extrabold text-xs">
                34.7% Conversion
              </span>
            </div>
          </div>
        </div>

        {/* Channel 2: Email */}
        <div className="p-5 rounded-2xl border border-slate-200 bg-white relative shadow-xs flex flex-col justify-between space-y-5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-xl bg-slate-100 text-slate-700 flex items-center justify-center">
                <Mail className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-extrabold text-slate-900">Email Invites</h4>
                <p className="text-[11px] text-slate-500">HTML Digest Invitation</p>
              </div>
            </div>

            <span className="inline-flex items-center text-[11px] font-semibold text-slate-600 bg-slate-100 px-2.5 py-1 rounded-full">
              Standard Channel
            </span>
          </div>

          {/* Metric Grid */}
          <div className="grid grid-cols-2 gap-3 pt-1">
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Sent</div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">55</div>
              <div className="text-[11px] text-emerald-600 font-semibold mt-0.5">98.1% Delivered</div>
            </div>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
              <div className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Open Rate</div>
              <div className="text-lg font-extrabold text-slate-900 mt-0.5">62.4%</div>
              <div className="text-[11px] text-slate-600 font-semibold mt-0.5">34 Opened</div>
            </div>
          </div>

          {/* Outcome Footer Banner */}
          <div className="p-3.5 bg-slate-100 text-slate-900 rounded-xl flex items-center justify-between border border-slate-200">
            <div>
              <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Google Reviews Completed</div>
              <div className="text-lg font-extrabold text-slate-900">14 Reviews</div>
            </div>
            <div className="text-right">
              <span className="inline-block px-2 py-0.5 rounded-md bg-white text-slate-800 font-bold text-xs border border-slate-200">
                25.4% Conversion
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* Takeaway Insight */}
      <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex items-start sm:items-center gap-2.5 text-xs text-slate-600">
        <Sparkles className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 sm:mt-0" />
        <span>
          <strong className="text-slate-900 font-semibold">Pro Insight:</strong> SMS invitations yield a <strong className="text-indigo-700 font-bold">+36.6% higher completion velocity</strong> than email due to instant smartphone push notifications.
        </span>
      </div>

    </div>
  );
}
