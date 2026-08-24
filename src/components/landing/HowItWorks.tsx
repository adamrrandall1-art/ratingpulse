'use client';

import React from 'react';
import { Link2, Send, CheckCircle2, ArrowRight, ShieldCheck } from 'lucide-react';
import Link from 'next/link';

export default function HowItWorks() {
  const steps = [
    {
      number: '01',
      icon: Link2,
      title: 'Connect Google Profile in 60s',
      description:
        'Authorize your Google Business Profile with 1 click. RatingPulse instantly syncs your existing ratings, review history, and location place ID.',
      tag: 'Zero Technical Setup',
      color: 'bg-blue-600'
    },
    {
      number: '02',
      icon: Send,
      title: 'Send Automated SMS Invites',
      description:
        'When a client finishes a job, appointment, or checkout, fire a high-converting SMS invite in 3 seconds directly from your dashboard or CRM.',
      tag: '1-Tap Frictionless Flow',
      color: 'bg-indigo-600'
    },
    {
      number: '03',
      icon: CheckCircle2,
      title: '1-Tap Approve AI Replies',
      description:
        'As reviews roll in, our AI drafts keyword-rich replies. Tap "Approve" on your phone, and your response goes live on Google instantly.',
      tag: 'Rank #1 on Google Maps',
      color: 'bg-emerald-600'
    }
  ];

  return (
    <section id="how-it-works" className="py-28 bg-[#0B0F17] relative border-t border-slate-800/40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            Simple 3-Step Setup
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            How RatingPulse Automates Your 5-Star Engine
          </h2>
          <p className="mt-3 text-base text-slate-300">
            Set up once, run on complete autopilot. No complicated software, no technical learning curve.
          </p>
        </div>

        {/* 3-Step Cards Grid */}
        <div className="grid md:grid-cols-3 gap-8 relative">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className="bg-slate-900/70 backdrop-blur-sm rounded-2xl p-8 border border-slate-800/60 relative flex flex-col justify-between hover:border-emerald-500/30 hover:shadow-emerald-500/5 transition-all"
              >
                <div>
                  {/* Step Number & Icon */}
                  <div className="flex items-center justify-between mb-6">
                    <div className={`w-12 h-12 rounded-xl ${step.color} text-white flex items-center justify-center shadow-md font-bold text-lg`}>
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-3xl font-black text-slate-300">
                      {step.number}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-xl font-bold text-white mb-3">
                    {step.title}
                  </h3>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                {/* Bottom Tag */}
                <div className="mt-8 pt-4 border-t border-slate-800/60 flex items-center justify-between">
                  <span className="bg-slate-800/80 text-emerald-400 border border-slate-700 text-xs font-semibold px-3 py-1.5 rounded-full inline-flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" />
                    {step.tag}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Center CTA */}
        <div className="mt-14 text-center">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all active:scale-[0.98]"
          >
            Connect Your Google Business Profile Now
            <ArrowRight className="w-4 h-4" />
          </Link>
          <p className="text-xs text-slate-500 mt-2">
            Takes less than 2 minutes • 14-day free trial
          </p>
        </div>

      </div>
    </section>
  );
}
