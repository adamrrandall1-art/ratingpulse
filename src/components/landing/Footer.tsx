'use client';

import React from 'react';
import Link from 'next/link';
import { Star, ArrowRight, ShieldCheck, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-slate-900 text-white pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Pre-footer Call to Action Banner */}
        <div className="bg-gradient-to-br from-emerald-950/80 to-slate-900 border border-emerald-500/15 rounded-3xl p-8 sm:p-12 mb-16 shadow-2xl relative overflow-hidden text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8">
          <div className="max-w-xl">
            <h3 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Ready to collect 30+ new 5-star Google reviews this month?
            </h3>
            <p className="mt-2 text-sm sm:text-base text-slate-300">
              Start your 14-day free trial today. Set up in under 2 minutes. No credit card required.
            </p>
          </div>
          <Link
            href="/dashboard"
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 hover:from-emerald-400 hover:to-teal-400 transition-all shrink-0 flex items-center gap-2 transform active:scale-95"
          >
            Start 14-Day Free Trial
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-slate-800 text-xs">
          
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                <Star className="w-4 h-4 fill-white text-white" />
              </div>
              <span className="font-bold text-lg text-white">RatingPulse.co</span>
            </Link>
            <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
              The micro-SaaS platform empowering local service businesses to effortlessly capture 5-star Google reviews and publish AI-crafted SEO replies in 1 tap.
            </p>
            <div className="flex items-center gap-2 text-slate-400 pt-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Official Google Places API Integration</span>
            </div>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-3">Product</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#features" className="hover:text-white transition-colors">SMS Invites</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">AI Reply Engine</a></li>
              <li><a href="#features" className="hover:text-white transition-colors">1-Tap Approval</a></li>
              <li><a href="#calculator" className="hover:text-white transition-colors">ROI Calculator</a></li>
              <li><Link href="/dashboard" className="hover:text-white transition-colors">Interactive Demo</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-3">Pricing & Plans</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#pricing" className="hover:text-white transition-colors">Growth Plan ($25/mo)</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">14-Day Free Trial</a></li>
              <li><a href="#pricing" className="hover:text-white transition-colors">Money Back Guarantee</a></li>
              <li><a href="#faq" className="hover:text-white transition-colors">Billing FAQ</a></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-white uppercase tracking-wider mb-3">Legal & Safety</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#features" className="hover:text-white transition-colors">Google TOS Compliance</a></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/privacy#security" className="hover:text-white transition-colors">Security Overview</Link></li>
            </ul>
          </div>

        </div>

        {/* Copyright */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} RatingPulse.co. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
