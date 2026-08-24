'use client';

import React from 'react';
import { MessageSquare, Sparkles, CheckCircle, BarChart3, ArrowRight, Zap } from 'lucide-react';
import Link from 'next/link';

export default function FeatureGrid() {
  const features = [
    {
      icon: MessageSquare,
      iconBg: 'from-emerald-500 to-teal-500',
      iconGlow: 'shadow-emerald-500/30',
      badge: 'Instant SMS',
      badgeColor: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20',
      title: 'Instant 1-Click SMS',
      description: 'Fire high-converting SMS review invites the moment service ends. No app, no login — one tap and the customer is writing their Google review.',
      bullets: ['68.2% average click-to-review rate', 'Direct Google URL deep-linking', 'Smart variables & custom copy'],
    },
    {
      icon: ArrowRight,
      iconBg: 'from-cyan-500 to-blue-500',
      iconGlow: 'shadow-cyan-500/30',
      badge: 'Smart Routing',
      badgeColor: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
      title: 'Smart Feedback Routing',
      description: 'Automatically detect unhappy customers before they hit Google. Route negative feedback to a private resolution flow, protecting your star rating.',
      bullets: ['Sentiment detection on responses', 'Private resolution capture', 'Protect your public rating'],
    },
    {
      icon: Sparkles,
      iconBg: 'from-violet-500 to-purple-600',
      iconGlow: 'shadow-violet-500/30',
      badge: 'AI Replies',
      badgeColor: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
      title: 'AI Response Generator',
      description: 'Gemini AI crafts personalized, SEO-rich replies for every review in seconds — trained on your brand voice with local keyword injection.',
      bullets: ['Brand voice matching', 'Local SEO keyword insertion', '1-tap publish to Google'],
    },
    {
      icon: BarChart3,
      iconBg: 'from-amber-500 to-orange-500',
      iconGlow: 'shadow-amber-500/30',
      badge: 'Analytics',
      badgeColor: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
      title: 'Analytics Dashboard',
      description: 'Track every SMS sent, review received, and reply published. Watch your Google Maps ranking climb in real time across your service area.',
      bullets: ['Review velocity tracking', 'SMS conversion funnel', 'Google Maps rank monitor'],
    },
  ];

  return (
    <section id="features" className="py-28 bg-[#0B0F17] relative">
      {/* Section glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-emerald-500/4 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">

        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider mb-4">
            <Zap className="w-3.5 h-3.5" />
            Core Growth Engine
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            Everything You Need to{' '}
            <span className="text-shimmer">Dominate Local Search</span>
          </h2>
          <p className="mt-4 text-base text-slate-400">
            A frictionless four-pillar workflow built for busy business owners who want top Google rankings without wasting hours on manual tasks.
          </p>
        </div>

        {/* 4-Column Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <div
                key={index}
                className="group flex flex-col bg-slate-900/70 backdrop-blur-lg border border-slate-800/80 rounded-2xl shadow-2xl p-6 hover:border-slate-700/80 hover:shadow-emerald-500/5 transition-all duration-300"
              >
                {/* Icon */}
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feat.iconBg} flex items-center justify-center shadow-lg ${feat.iconGlow} mb-4 group-hover:scale-110 transition-transform`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>

                {/* Badge */}
                <span className={`text-[11px] font-bold px-2 py-0.5 rounded-md border w-fit mb-3 ${feat.badgeColor}`}>
                  {feat.badge}
                </span>

                {/* Title & Description */}
                <h3 className="text-base font-bold text-white mb-2">{feat.title}</h3>
                <p className="text-sm text-slate-300 leading-relaxed mb-5 flex-1">{feat.description}</p>

                {/* Bullets */}
                <ul className="space-y-2 border-t border-slate-800/60 pt-4">
                  {feat.bullets.map((b, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-300">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                      {b}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        {/* Bottom Banner */}
        <div className="mt-14 p-6 sm:p-8 rounded-2xl bg-gradient-to-r from-emerald-950/60 to-teal-950/60 border border-emerald-500/15 flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <h4 className="text-lg font-bold text-white mb-1">
              Why Google Reviews Directly Dictate Your Revenue
            </h4>
            <p className="text-sm text-slate-400">
              87% of consumers read Google reviews before contacting a local business. Businesses with 200+ reviews earn 54% more revenue.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="px-6 py-3 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/20 whitespace-nowrap transition-all"
          >
            Experience Live Dashboard →
          </Link>
        </div>

      </div>
    </section>
  );
}
