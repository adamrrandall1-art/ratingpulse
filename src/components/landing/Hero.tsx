'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Star, CheckCircle2, ArrowRight, Sparkles, MessageSquare,
  ShieldCheck, Zap, Bot, Send
} from 'lucide-react';
import confetti from 'canvas-confetti';

export default function Hero() {
  const [approved, setApproved]     = useState(false);
  const [isDrafting, setIsDrafting] = useState(false);
  const [activeTab, setActiveTab]   = useState<'review' | 'sms'>('review');

  const triggerConfetti = () => {
    setApproved(true);
    try {
      confetti({ particleCount: 90, spread: 65, origin: { y: 0.6 },
        colors: ['#10b981', '#06b6d4', '#f59e0b', '#fff'] });
    } catch { /* no canvas */ }
  };

  const handleRegenerate = () => {
    setIsDrafting(true);
    setApproved(false);
    setTimeout(() => setIsDrafting(false), 700);
  };

  return (
    <section className="relative pt-32 pb-24 lg:pt-44 lg:pb-36 overflow-hidden bg-[#0B0F17]">

      {/* â”€â”€ Radial Glow Backgrounds â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-emerald-500/8 rounded-full blur-[120px] pointer-events-none animate-glow-pulse" />
      <div className="absolute top-1/3 right-0 w-[500px] h-[500px] bg-teal-500/8 rounded-full blur-[100px] pointer-events-none animate-glow-pulse [animation-delay:1.5s]" />
      <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[80px] pointer-events-none" />

      {/* â”€â”€ Grid overlay texture â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
      <div
        className="absolute inset-0 pointer-events-none opacity-[0.03]"
        style={{
          backgroundImage: 'linear-gradient(#10b981 1px, transparent 1px), linear-gradient(90deg, #10b981 1px, transparent 1px)',
          backgroundSize: '60px 60px',
        }}
      />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-8 items-center">

          {/* â”€â”€ Left Column â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">

            {/* Status Pill */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-xs font-bold mb-8 animate-fade-up">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
              <Zap className="w-3.5 h-3.5" />
              âš¡ Automated SMS Review Acceleration â€” Live
            </div>

            {/* Main Headline */}
            <h1 className="text-4xl sm:text-5xl lg:text-[3.6rem] font-extrabold tracking-tight text-white leading-[1.08] animate-fade-up [animation-delay:0.1s]">
              Turn Every Job Into a{' '}
              <span className="text-shimmer">5-Star Google</span>
              <br />Review. Automatically.
            </h1>

            {/* Subheading */}
            <p className="mt-6 text-lg text-slate-400 max-w-xl leading-relaxed animate-fade-up [animation-delay:0.2s]">
              Send SMS review invites the moment service ends. Let AI draft SEO-optimized replies. Publish to Google in one tap. Watch your Maps ranking climb.
            </p>

            {/* CTA Group */}
            <div className="mt-10 flex flex-col sm:flex-row items-stretch sm:items-center gap-4 animate-fade-up [animation-delay:0.3s]">
              <Link
                href="/dashboard"
                className="inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-base font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all active:scale-[0.98]"
              >
                <Zap className="w-5 h-5" />
                Start Free Trial
                <ArrowRight className="w-5 h-5" />
              </Link>

              <a
                href="#calculator"
                className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-slate-900/70 backdrop-blur-sm border border-slate-700/80 text-slate-300 text-base font-semibold hover:bg-slate-800/70 hover:border-slate-600 hover:text-white transition-all"
              >
                Live Demo
              </a>
            </div>

            {/* Trust badges */}
            <div className="mt-7 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-slate-500 font-medium animate-fade-up [animation-delay:0.4s]">
              {[
                'No credit card required',
                '2-minute Google sync',
                '100% Google TOS compliant',
              ].map((t) => (
                <span key={t} className="flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> {t}
                </span>
              ))}
            </div>

            {/* ROI Stats Bar */}
            <div className="mt-12 pt-8 border-t border-slate-800/60 flex items-center gap-8 w-full animate-fade-up [animation-delay:0.5s]">
              {[
                { value: '68%', label: 'SMS open rate' },
                { value: '4.9â˜…', label: 'avg rating gained' },
                { value: '450+', label: 'businesses active' },
              ].map(({ value, label }) => (
                <div key={label} className="flex flex-col">
                  <span className="text-xl font-extrabold text-white">{value}</span>
                  <span className="text-xs text-slate-500">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* â”€â”€ Right Column: Glassmorphic Preview Card â”€â”€â”€â”€â”€â”€â”€â”€ */}
          <div className="lg:col-span-5 relative animate-fade-up [animation-delay:0.2s]">
            <div className="relative mx-auto w-full max-w-lg rounded-2xl bg-slate-900/70 backdrop-blur-lg border border-slate-800/80 shadow-2xl shadow-black/40 p-5 sm:p-6">

              {/* Glow ring behind card */}
              <div className="absolute -inset-px rounded-2xl bg-gradient-to-br from-emerald-500/10 via-transparent to-teal-500/10 pointer-events-none" />

              {/* Card Header */}
              <div className="flex items-center justify-between pb-4 border-b border-slate-800/60">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/30">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-white leading-tight">Live Preview Simulator</h2>
                    <p className="text-[11px] text-slate-500">Simulate SMS invite + AI reply flow</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 bg-slate-800/80 p-1 rounded-lg text-xs font-medium border border-slate-700/50">
                  {(['review', 'sms'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-2.5 py-1 rounded-md transition-all capitalize ${
                        activeTab === tab
                          ? 'bg-emerald-500/20 text-emerald-400 font-semibold border border-emerald-500/30'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {tab === 'review' ? 'AI Reply' : 'SMS Invite'}
                    </button>
                  ))}
                </div>
              </div>

              {activeTab === 'review' ? (
                <div className="mt-4 space-y-4">
                  {/* Review Box */}
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 text-white font-bold flex items-center justify-center text-sm">
                          SJ
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white">Sarah Jenkins</div>
                          <div className="text-[11px] text-slate-500">Google Verified â€¢ 10m ago</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed italic">
                      &quot;Dr. Marcus and the team gave me the best dental experience ever. Gentle, painless, and my teeth look radiant. 10/10 recommend!&quot;
                    </p>
                  </div>

                  {/* AI Reply Box */}
                  <div className="p-4 rounded-xl bg-emerald-500/5 border border-emerald-500/20">
                    <div className="flex items-center justify-between mb-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Drafted Reply (SEO Optimized)
                      </span>
                      <button
                        onClick={handleRegenerate}
                        disabled={isDrafting}
                        className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                      >
                        {isDrafting ? 'Drafting...' : 'â†» Regenerate'}
                      </button>
                    </div>

                    <div className="text-xs text-slate-300 leading-relaxed min-h-[58px]">
                      {isDrafting ? (
                        <div className="flex items-center gap-2 py-4 text-emerald-400">
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce" />
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.2s]" />
                          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-bounce [animation-delay:0.4s]" />
                          <span className="text-xs font-medium ml-1">Generating personalized reply...</span>
                        </div>
                      ) : (
                        <p>&quot;Thank you so much, Sarah! We take pride in gentle, painless dental care at Apex Dental. We look forward to seeing you at your next checkup!&quot;</p>
                      )}
                    </div>

                    <div className="mt-2 flex items-center gap-1.5 text-[10px] text-teal-400 font-medium bg-teal-500/10 border border-teal-500/20 px-2 py-1 rounded">
                      <Zap className="w-3 h-3" />
                      Keywords: <strong className="text-teal-300">gentle dental care</strong>, <strong className="text-teal-300">painless</strong>
                    </div>
                  </div>

                  {/* Approve Button */}
                  {approved ? (
                    <div className="w-full py-3 px-4 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center gap-2 text-xs font-bold animate-pulse-subtle">
                      <CheckCircle2 className="w-4 h-4" />
                      Published to Google Business Profile!
                    </div>
                  ) : (
                    <button
                      onClick={triggerConfetti}
                      className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs shadow-lg shadow-emerald-500/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98] cursor-pointer"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      1-Tap Approve &amp; Publish to Google
                    </button>
                  )}
                  <p className="text-[10px] text-center text-slate-500 -mt-1">
                    Click to simulate instant 1-tap publishing
                  </p>
                </div>
              ) : (
                /* SMS Invite Tab */
                <div className="mt-4 space-y-4">
                  <div className="p-4 rounded-xl bg-slate-800/60 border border-slate-700/50 space-y-3">
                    <div className="flex items-center justify-between text-xs text-slate-500 border-b border-slate-700/50 pb-2">
                      <span className="flex items-center gap-1 text-emerald-400">
                        <MessageSquare className="w-3.5 h-3.5" /> Automated SMS Invite
                      </span>
                      <span className="text-slate-500">Delivered in 2.1s</span>
                    </div>
                    <div className="bg-slate-900/80 border border-slate-700/30 p-3 rounded-lg text-xs leading-relaxed text-slate-300">
                      <p>
                        &quot;Hi Sarah! Thank you for trusting Apex Dental today. Could you take 20 seconds to share your experience on Google? It means the world to our team:{' '}
                        <span className="text-emerald-400 underline">g.page/r/apex-review</span>&quot;
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500">
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> 68.4% Open &amp; Click Rate
                      </span>
                      <span>Zero Login Required</span>
                    </div>
                  </div>

                  <Link
                    href="/dashboard/invites"
                    className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-lg shadow-emerald-500/20"
                  >
                    <Send className="w-4 h-4" />
                    Test Send an SMS in Live Dashboard
                  </Link>
                </div>
              )}

              {/* Floating Badge */}
              <div className="absolute -bottom-4 -right-4 bg-slate-900/90 backdrop-blur-sm border border-emerald-500/25 rounded-xl px-3.5 py-2 shadow-xl shadow-black/40 flex items-center gap-2 animate-float">
                <div className="w-7 h-7 rounded-full bg-emerald-500/15 border border-emerald-500/25 flex items-center justify-center text-emerald-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <div className="text-[11px] font-bold text-white leading-tight">
                  Google API Sync
                  <span className="block text-[9px] font-normal text-emerald-400">Active &amp; Verified</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
