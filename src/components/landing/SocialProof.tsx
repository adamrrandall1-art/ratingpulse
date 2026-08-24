'use client';

import React from 'react';
import { TrendingUp, Star, ShieldCheck, Zap, Award } from 'lucide-react';

export default function SocialProof() {
  const stats = [
    {
      value: '+340%',
      label: 'Average Surge in Reviews',
      subtext: 'Within first 30 days of setup',
      icon: TrendingUp,
      color: 'text-blue-400',
      bg: 'bg-blue-500/15',
    },
    {
      value: '4.9 ★',
      label: 'Average Client Rating',
      subtext: 'Across 450+ verified businesses',
      icon: Star,
      color: 'text-amber-400',
      bg: 'bg-amber-500/15',
    },
    {
      value: '68.2%',
      label: 'SMS Click-to-Review Rate',
      subtext: 'Frictionless 1-tap Google link',
      icon: Zap,
      color: 'text-indigo-400',
      bg: 'bg-indigo-500/15',
    },
    {
      value: '100%',
      label: 'Google Compliant',
      subtext: 'Zero gating, 100% safe for SEO',
      icon: ShieldCheck,
      color: 'text-emerald-400',
      bg: 'bg-emerald-500/15',
    },
  ];

  const industries = [
    'Dental & Medical Clinics',
    'HVAC & Home Services',
    'Auto Detailing & Repair',
    'Law Firms & CPAs',
    'Salons & Spas',
    'Roofing & Contractors'
  ];

  return (
    <section className="py-16 bg-[#0B0F17] border-y border-slate-800/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Metric Cards Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div
                key={i}
                className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800/60 hover:border-emerald-500/30 transition-all group"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-10 h-10 rounded-xl ${stat.bg} ${stat.color} flex items-center justify-center`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <Award className="w-4 h-4 text-slate-500 group-hover:text-emerald-400 transition-colors" />
                </div>
                <div className="text-3xl lg:text-4xl font-extrabold text-white tracking-tight">
                  {stat.value}
                </div>
                <div className="text-sm font-semibold text-slate-200 mt-1">
                  {stat.label}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  {stat.subtext}
                </div>
              </div>
            );
          })}
        </div>

        {/* Industry Pill Carousel / Bar */}
        <div className="mt-12 flex flex-col md:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-800/50">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
            Tailored For High-Impact Local Verticals:
          </span>
          <div className="flex flex-wrap items-center justify-center gap-2">
            {industries.map((ind, idx) => (
              <span
                key={idx}
                className="px-3 py-1.5 rounded-full bg-slate-800/80 text-slate-300 text-xs font-medium border border-slate-700/60"
              >
                {ind}
              </span>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
