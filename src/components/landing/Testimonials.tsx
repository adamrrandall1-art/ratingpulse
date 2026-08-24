'use client';

import React from 'react';
import { Star, Quote, CheckCircle2 } from 'lucide-react';
import { testimonials } from '@/lib/data';

export default function Testimonials() {
  return (
    <section className="py-28 bg-[#0B0F17] border-y border-slate-800/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            Real Customer Stories
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Loved by Local Service Business Owners
          </h2>
          <p className="mt-3 text-base text-slate-300">
            See how real local professionals jumped to the top of Google Maps search results in their cities.
          </p>
        </div>

        {/* Testimonials 3 Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-900/70 backdrop-blur-sm rounded-2xl p-7 border border-slate-800/60 flex flex-col justify-between hover:border-emerald-500/25 transition-all"
            >
              <div>
                {/* Star rating & Metric Tag */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <span className="bg-slate-800/80 text-emerald-400 border border-slate-700 text-[11px] font-bold px-2.5 py-1 rounded-full">
                    {item.metrics}
                  </span>
                </div>

                {/* Quote */}
                <p className="text-slate-200 text-sm leading-relaxed italic mb-6">
                  &quot;{item.quote}&quot;
                </p>
              </div>

              {/* Author Info */}
              <div className="flex items-center gap-3 pt-4 border-t border-slate-800/60">
                <img
                  src={item.avatar}
                  alt={item.author}
                  className="w-11 h-11 rounded-full object-cover ring-2 ring-emerald-500/20"
                />
                <div>
                  <div className="text-sm font-bold text-white flex items-center gap-1">
                    {item.author}
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                  <div className="text-xs text-slate-500">{item.role}</div>
                  <div className="text-[11px] text-slate-400">{item.location}</div>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
