'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Star,
  ShieldCheck,
  Send,
  Sparkles,
  TrendingUp,
  ArrowRight,
  CheckCircle2,
  Lock,
  Building2,
  Menu,
  X,
  AlertCircle
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900 flex flex-col font-sans selection:bg-blue-600 selection:text-white">
      {/* ─────────────────────────────────────────────────────────────
          1. TOP NAVIGATION BAR
      ───────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-md border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo Lockup */}
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm group-hover:bg-blue-700 transition-colors shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                RATING<span className="text-blue-600">PULSE</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-600">
              <a href="#how-it-works" className="hover:text-blue-600 transition-colors">
                How It Works
              </a>
              <a href="#smart-routing" className="hover:text-blue-600 transition-colors">
                Features
              </a>
              <a href="#testimonials" className="hover:text-blue-600 transition-colors">
                Case Studies
              </a>
              <a href="#pricing" className="hover:text-blue-600 transition-colors">
                Pricing
              </a>
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center gap-4">
              <Link
                href="/login"
                className="text-sm font-semibold text-slate-700 hover:text-blue-600 px-3 py-2 transition-colors"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:shadow transition-all"
              >
                <span>Start Free Trial</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>

            {/* Mobile Menu Toggle */}
            <div className="flex md:hidden">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100"
                aria-label="Toggle navigation menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-slate-100 bg-white px-4 pt-2 pb-6 space-y-3 shadow-lg">
            <a
              href="#how-it-works"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-md"
            >
              How It Works
            </a>
            <a
              href="#smart-routing"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-md"
            >
              Features
            </a>
            <a
              href="#testimonials"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-md"
            >
              Case Studies
            </a>
            <a
              href="#pricing"
              onClick={() => setMobileMenuOpen(false)}
              className="block px-3 py-2 text-base font-medium text-slate-700 hover:bg-slate-50 rounded-md"
            >
              Pricing
            </a>
            <div className="pt-4 border-t border-slate-100 space-y-2">
              <Link
                href="/login"
                className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-slate-700 bg-slate-50 rounded-lg"
              >
                Sign In
              </Link>
              <Link
                href="/signup"
                className="block w-full text-center px-4 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-sm"
              >
                Start Free Trial
              </Link>
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* ─────────────────────────────────────────────────────────────
            2. HERO SECTION
        ───────────────────────────────────────────────────────────── */}
        <section className="relative pt-12 pb-20 sm:pt-16 sm:pb-28 lg:pt-20 lg:pb-32 bg-white overflow-hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
              
              {/* Left Column (7 cols) */}
              <div className="lg:col-span-7 space-y-6 sm:space-y-8 text-left">
                
                {/* Eyebrow Badge */}
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-semibold tracking-wide">
                  <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                  <span>Automated Google Review System</span>
                </div>

                {/* High-Converting Headline */}
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.12]">
                  Turn happy customers into{' '}
                  <span className="text-blue-600">5-star Google reviews</span> on autopilot.
                </h1>

                {/* Sub-copy */}
                <p className="text-lg sm:text-xl text-slate-600 leading-relaxed max-w-2xl">
                  Automatically send gentle SMS review invites after customer visits. Route delighted customers directly to Google Maps, while filtering private feedback before it ever reaches the web.
                </p>

                {/* CTA Button Row */}
                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 pt-2">
                  <Link
                    href="/signup"
                    className="inline-flex items-center justify-center gap-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base px-7 py-4 rounded-xl shadow-md hover:shadow-lg transition-all"
                  >
                    <span>Start 14-Day Free Trial</span>
                    <ArrowRight className="w-5 h-5" />
                  </Link>
                  <a
                    href="#how-it-works"
                    className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 font-semibold text-base px-6 py-4 rounded-xl shadow-xs transition-colors"
                  >
                    <span>See How It Works</span>
                  </a>
                </div>

                {/* Compliance & Trust Checklist */}
                <div className="pt-4 border-t border-slate-100 grid grid-cols-2 sm:flex sm:flex-wrap gap-y-2 gap-x-6 text-xs font-medium text-slate-500">
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Lock className="w-4 h-4 text-blue-600 shrink-0" />
                    <span>TCPA & 10DLC Compliant</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>2-Minute Google Setup</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0" />
                    <span>Cancel anytime</span>
                  </div>
                </div>

              </div>

              {/* Right Column (5 cols) - Human Connection Photo Card */}
              <div className="lg:col-span-5 relative mt-4 lg:mt-0">
                <div className="relative mx-auto max-w-md lg:max-w-none">
                  
                  {/* Main Photo Card */}
                  <div className="relative rounded-2xl overflow-hidden bg-slate-100 border border-slate-200/80 shadow-2xl">
                    <img
                      src="https://images.unsplash.com/photo-1556740758-90de374c12ad?auto=format&fit=crop&w=800&q=80"
                      alt="Friendly local cafe owner smiling with smartphone"
                      className="w-full h-[430px] object-cover object-center"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/70 via-slate-950/10 to-transparent"></div>
                    
                    {/* Caption on image bottom */}
                    <div className="absolute bottom-4 left-4 right-4 text-white">
                      <p className="text-xs font-medium text-slate-200">Main Street Bakery & Cafe</p>
                      <p className="text-sm font-bold mt-0.5">David M. — Owner & Founder</p>
                    </div>
                  </div>

                  {/* Floating Card 1: New 5-Star Review */}
                  <div className="absolute -top-6 -left-4 sm:-left-8 bg-white p-3.5 sm:p-4 rounded-xl shadow-xl border border-slate-100 max-w-[260px]">
                    <div className="flex items-center gap-2 mb-1.5">
                      <div className="w-7 h-7 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-bold text-xs">
                        SM
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900 leading-tight">Sarah Mitchell</p>
                        <div className="flex text-amber-400 mt-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className="w-3 h-3 fill-amber-400 text-amber-400" />
                          ))}
                        </div>
                      </div>
                    </div>
                    <p className="text-[11px] text-slate-600 leading-snug">
                      &quot;Super quick response and the friendliest staff. Best in the area!&quot;
                    </p>
                    <div className="mt-2 pt-1.5 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-400">
                      <span>Google Reviews</span>
                      <span className="text-emerald-600 font-semibold">Just now</span>
                    </div>
                  </div>

                  {/* Floating Card 2: Google Sync Active */}
                  <div className="absolute -bottom-6 -right-2 sm:-right-6 bg-white p-3.5 sm:p-4 rounded-xl shadow-xl border border-slate-100 max-w-[240px]">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center">
                        <TrendingUp className="w-3.5 h-3.5" />
                      </div>
                      <span className="text-xs font-bold text-slate-900">Google Sync Active</span>
                    </div>
                    <div className="flex items-baseline gap-2 mt-1">
                      <span className="text-xl font-extrabold text-slate-900">4.9 ★</span>
                      <span className="text-xs font-semibold text-emerald-600">+48 this month</span>
                    </div>
                    <p className="text-[10px] text-slate-500 mt-0.5">
                      100% automated SMS response rate
                    </p>
                  </div>

                </div>
              </div>

            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            3. TRUST BAR (Local Merchants)
        ───────────────────────────────────────────────────────────── */}
        <section className="py-10 bg-slate-50 border-y border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-6">
              Trusted by leading local businesses across America
            </p>
            <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-slate-400 font-semibold text-sm">
              <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all text-slate-600">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Dental Practices</span>
              </div>
              <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all text-slate-600">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Auto Repair & Collision</span>
              </div>
              <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all text-slate-600">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Cafes & Restaurants</span>
              </div>
              <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all text-slate-600">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>HVAC & Plumbing</span>
              </div>
              <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all text-slate-600">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Law Firms & Legal</span>
              </div>
              <div className="flex items-center gap-2 grayscale hover:grayscale-0 transition-all text-slate-600">
                <Building2 className="w-4 h-4 text-blue-600" />
                <span>Salons & MedSpas</span>
              </div>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            4. HOW IT WORKS / SMART ROUTING SECTION
        ───────────────────────────────────────────────────────────── */}
        <section id="how-it-works" className="py-20 lg:py-28 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div id="smart-routing" className="text-center max-w-3xl mx-auto mb-16 space-y-4 scroll-mt-24">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                Intelligent Review Funnel
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                How RatingPulse protects your reputation & scales 5-star reviews
              </h2>
              <p className="text-base sm:text-lg text-slate-600">
                A frictionless 3-step system designed to maximize positive public reviews while intercepting dissatisfied customers privately.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Card 1: Automated SMS Invite */}
              <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-lg mb-6">
                    <Send className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-blue-600 mb-1">
                    Step 1
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    Automated SMS Invite
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    Customers receive a polite, customized SMS right after their appointment or purchase. 98% open rate with zero awkward in-person review requests.
                  </p>
                </div>
                <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs text-slate-700 font-mono">
                  &quot;Hi John, thanks for visiting us today! How was your experience? [Tap to Rate]&quot;
                </div>
              </div>

              {/* Card 2: Private Feedback Filter (1-3★) */}
              <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold text-lg mb-6">
                    <AlertCircle className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-amber-600 mb-1">
                    Step 2 (1–3 Stars)
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    Private Feedback Filter
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    Customers with issues are routed to a private resolution form. You receive an instant alert to make things right before they ever post publicly.
                  </p>
                </div>
                <div className="p-3 bg-amber-50/60 rounded-xl border border-amber-100 text-xs text-amber-900">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <ShieldCheck className="w-3.5 h-3.5 text-amber-600" />
                    Internal Resolution Form
                  </div>
                  <span className="text-[11px] text-amber-800">Direct owner notification sent instantly via email/SMS.</span>
                </div>
              </div>

              {/* Card 3: Google 5-Star Boost (4-5★) */}
              <div className="bg-white rounded-2xl p-8 border border-slate-200/80 shadow-xs hover:shadow-md transition-all flex flex-col justify-between">
                <div>
                  <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg mb-6">
                    <Star className="w-6 h-6 fill-emerald-600" />
                  </div>
                  <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 mb-1">
                    Step 3 (4–5 Stars)
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">
                    Google 5-Star Boost
                  </h3>
                  <p className="text-slate-600 text-sm leading-relaxed mb-6">
                    Delighted customers are directed straight to your official Google Maps review screen with 1 tap. Pre-filled with AI guidance for fast submission.
                  </p>
                </div>
                <div className="p-3 bg-emerald-50/60 rounded-xl border border-emerald-100 text-xs text-emerald-900">
                  <div className="font-bold flex items-center gap-1.5 mb-1">
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-600" />
                    1-Tap Google Maps Link
                  </div>
                  <span className="text-[11px] text-emerald-800">Directly increases your local Map Pack search ranking.</span>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            5. TESTIMONIALS SECTION
        ───────────────────────────────────────────────────────────── */}
        <section id="testimonials" className="py-20 bg-slate-50 border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
                Real Results
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Trusted by local business owners nationwide
              </h2>
              <p className="text-base sm:text-lg text-slate-600">
                See how Main Street merchants are dominating their local search rankings and attracting more walk-ins.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              
              {/* Testimonial 1 */}
              <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex text-amber-400 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed mb-6">
                    &quot;We went from 19 reviews to over 64 in our first 45 days. Our dental practice now ranks #1 in the local Google 3-Pack for our town.&quot;
                  </p>
                </div>
                <div>
                  <div className="p-2.5 bg-blue-50 rounded-lg text-xs font-bold text-blue-700 mb-4 flex items-center justify-between">
                    <span>Result:</span>
                    <span>+45 Google Reviews in 45 Days</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
                      alt="Dr. Rachel Evans"
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900">Dr. Rachel Evans</p>
                      <p className="text-xs text-slate-500">Evans Family Dentistry</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonial 2 */}
              <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex text-amber-400 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed mb-6">
                    &quot;The private feedback filter saved us from two unfair 1-star reviews when our AC unit broke down. We fixed it immediately and kept our 4.9 rating.&quot;
                  </p>
                </div>
                <div>
                  <div className="p-2.5 bg-emerald-50 rounded-lg text-xs font-bold text-emerald-700 mb-4 flex items-center justify-between">
                    <span>Result:</span>
                    <span>4.2 ★ → 4.9 ★ Average Rating</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=120&q=80"
                      alt="Marcus Vance"
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900">Marcus Vance</p>
                      <p className="text-xs text-slate-500">Apex Auto Precision</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Testimonial 3 */}
              <div className="bg-white rounded-2xl p-7 border border-slate-200/80 shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex text-amber-400 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                    ))}
                  </div>
                  <p className="text-slate-700 text-sm leading-relaxed mb-6">
                    &quot;Our customers actually reply to the SMS because it feels personal and takes 10 seconds. We brought in $18k in new catering bookings directly from Google search.&quot;
                  </p>
                </div>
                <div>
                  <div className="p-2.5 bg-blue-50 rounded-lg text-xs font-bold text-blue-700 mb-4 flex items-center justify-between">
                    <span>Result:</span>
                    <span>+72 Reviews • $18k New Revenue</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <img
                      src="https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=120&q=80"
                      alt="Elena Rossi"
                      className="w-10 h-10 rounded-full object-cover border border-slate-200"
                    />
                    <div>
                      <p className="text-sm font-bold text-slate-900">Elena Rossi</p>
                      <p className="text-xs text-slate-500">Rossi Bistro & Catering</p>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            6. PRICING SECTION
        ───────────────────────────────────────────────────────────── */}
        <section id="pricing" className="py-20 lg:py-28 bg-white border-t border-slate-100">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider">
                Simple, Transparent Pricing
              </div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
                Everything you need to dominate local search
              </h2>
              <p className="text-base sm:text-lg text-slate-600">
                No hidden fees, no per-review charges, and no long-term contracts.
              </p>
            </div>

            <div className="max-w-lg mx-auto bg-white rounded-3xl p-8 sm:p-10 border-2 border-blue-600 shadow-xl relative">
              <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-xs font-bold uppercase tracking-wider px-4 py-1 rounded-full shadow-sm">
                Most Popular for Local Businesses
              </div>

              <div className="text-center pb-8 border-b border-slate-100">
                <h3 className="text-2xl font-bold text-slate-900">Growth Plan</h3>
                <p className="text-sm text-slate-500 mt-1">For single-location businesses ready to scale</p>
                <div className="mt-6 flex items-baseline justify-center gap-2">
                  <span className="text-5xl font-black text-slate-900">$25</span>
                  <span className="text-slate-500 font-medium text-sm">/ month</span>
                </div>
                <p className="text-xs text-emerald-600 font-semibold mt-2">14-day free trial • Cancel anytime</p>
              </div>

              <div className="py-8 space-y-3.5 text-sm text-slate-700">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span><strong>Unlimited</strong> Automated SMS Review Invites</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span><strong>Private Feedback Filter</strong> (1-3★ protection)</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span><strong>1-Tap Google Maps</strong> direct boost</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span><strong>Gemini AI</strong> SEO Reply Assistant</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span><strong>Official 10DLC & TCPA</strong> carrier compliance</span>
                </div>
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <span><strong>Live Sync</strong> with Google Business Profile</span>
                </div>
              </div>

              <Link
                href="/signup"
                className="w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base py-4 rounded-xl shadow-md hover:shadow-lg transition-all"
              >
                <span>Start 14-Day Free Trial</span>
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </section>

        {/* ─────────────────────────────────────────────────────────────
            7. FINAL CTA BANNER
        ───────────────────────────────────────────────────────────── */}
        <section className="py-20 lg:py-24 bg-slate-50 border-t border-slate-100">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="bg-white rounded-3xl p-8 sm:p-12 lg:p-16 border border-slate-200 text-center space-y-6 shadow-sm">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-bold uppercase tracking-wider">
                14-Day Risk-Free Trial
              </div>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight max-w-2xl mx-auto leading-tight">
                Ready to dominate your local Google Maps rankings?
              </h2>
              <p className="text-slate-600 text-base sm:text-lg max-w-xl mx-auto">
                Set up your account in 2 minutes. Start collecting automated 5-star Google reviews today with zero commitment.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  href="/signup"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-base px-8 py-4 rounded-xl shadow-md hover:shadow-lg transition-all"
                >
                  <span>Start Your 14-Day Free Trial</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <Link
                  href="/login"
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 font-semibold text-base px-6 py-4 rounded-xl shadow-xs transition-colors"
                >
                  <span>Sign In</span>
                </Link>
              </div>
              <p className="text-xs text-slate-500 pt-2">
                No credit card required • Instant Google Places connection • Cancel anytime
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* ─────────────────────────────────────────────────────────────
          8. MINIMALIST FOOTER
      ───────────────────────────────────────────────────────────── */}
      <footer className="bg-white border-t border-slate-100 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            
            {/* Logo & Copyright */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                RATING<span className="text-blue-600">PULSE</span>
              </span>
              <span className="text-xs text-slate-400 ml-2">
                © {new Date().getFullYear()} RatingPulse.co. All rights reserved.
              </span>
            </div>

            {/* Links */}
            <div className="flex flex-wrap items-center gap-6 text-xs text-slate-500 font-medium">
              <Link href="/terms" className="hover:text-blue-600 transition-colors">
                Terms of Service
              </Link>
              <Link href="/privacy" className="hover:text-blue-600 transition-colors">
                Privacy Policy
              </Link>
              <Link href="/sms-consent" className="hover:text-blue-600 transition-colors">
                SMS Consent & TCPA
              </Link>
              <a href="mailto:support@ratingpulse.co" className="hover:text-blue-600 transition-colors">
                Support
              </a>
            </div>

          </div>
        </div>
      </footer>
    </div>
  );
}
