'use client';

import React from 'react';
import Link from 'next/link';
import { Star, ArrowRight, ShieldCheck, Heart } from 'lucide-react';
import BrandLogo from '@/components/BrandLogo';

export default function Footer() {
  return (
    <footer className="bg-[#0d1317] text-white pt-16 pb-12 border-t border-[#00d2c4]/15">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Pre-footer Call to Action Banner */}
        <div className="bg-gradient-to-br from-[#111820] via-[#161f26] to-[#111820] border border-[#00d2c4]/25 rounded-3xl p-8 sm:p-12 mb-16 shadow-2xl relative overflow-hidden text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8">
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
            className="px-8 py-4 rounded-xl bg-gradient-to-r from-[#00d2c4] via-[#06b6d4] to-[#10b981] hover:brightness-110 text-slate-950 font-extrabold text-sm shadow-[0_0_24px_rgba(0,210,196,0.35)] hover:shadow-[0_0_32px_rgba(0,210,196,0.55)] hover:scale-[1.02] transition-all shrink-0 flex items-center gap-2 transform active:scale-95 cursor-pointer"
          >
            Start 14-Day Free Trial
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Main Footer Links */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 pb-12 border-b border-slate-800/80 text-xs">
          
          <div className="col-span-2 space-y-4">
            <BrandLogo size="md" subtitle="default" />
            <p className="text-slate-400 text-xs max-w-sm leading-relaxed">
              The micro-SaaS platform empowering local service businesses to effortlessly capture 5-star Google reviews and publish AI-crafted SEO replies in 1 tap.
            </p>
            <div className="flex items-center gap-2 text-slate-400 pt-2">
              <ShieldCheck className="w-4 h-4 text-[#00d2c4]" />
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
            <h4 className="font-bold text-white uppercase tracking-wider mb-3">Legal &amp; Support</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#features" className="hover:text-white transition-colors">Google TOS Compliance</a></li>
              <li><Link href="/privacy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
              <li><Link href="/terms" className="hover:text-white transition-colors">Terms of Service</Link></li>
              <li><Link href="/sms-consent" className="hover:text-white transition-colors">SMS Consent &amp; 10DLC</Link></li>
              <li>
                <a
                  href="mailto:support@ratingpulse.co"
                  className="text-[#00d2c4] hover:underline font-semibold flex items-center gap-1 mt-1"
                >
                  support@ratingpulse.co
                </a>
              </li>
            </ul>
          </div>

        </div>

        {/* Copyright & Bottom Links */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div>
            © {new Date().getFullYear()} RatingPulse.co. All rights reserved.
          </div>
          <div className="flex items-center gap-4 text-slate-500">
            <a href="mailto:support@ratingpulse.co" className="hover:text-slate-300 transition-colors">
              Contact Support
            </a>
            <Link href="/privacy" className="hover:text-slate-300 transition-colors">Privacy Policy</Link>
            <Link href="/terms" className="hover:text-slate-300 transition-colors">Terms of Service</Link>
            <Link href="/sms-consent" className="hover:text-slate-300 transition-colors">SMS Consent</Link>
          </div>
        </div>

      </div>
    </footer>
  );
}
