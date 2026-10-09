'use client';

import React, { useEffect } from 'react';
import { useRatingPulseStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { Sparkles, ArrowRight, RefreshCw } from 'lucide-react';
import Link from 'next/link';

export default function DemoPreviewPage() {
  const { toggleDemoMode, isDemoMode } = useRatingPulseStore();
  const router = useRouter();

  useEffect(() => {
    toggleDemoMode(true);
  }, [toggleDemoMode]);

  return (
    <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-slate-800/80 border border-slate-700 rounded-2xl p-8 space-y-6 shadow-2xl backdrop-blur-md">
        <div className="w-14 h-14 rounded-2xl bg-blue-600/20 text-blue-400 flex items-center justify-center mx-auto border border-blue-500/30">
          <Sparkles className="w-7 h-7" />
        </div>

        <div className="space-y-2">
          <h1 className="text-xl font-bold text-white tracking-tight">
            RatingPulse Interactive Demo Sandbox
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            Demo Mode has been activated with realistic reviews, AI reply drafts, and SMS invite simulations.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          <Link
            href="/dashboard"
            className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2"
          >
            <span>Enter Demo Dashboard</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/dashboard/setup"
            className="w-full py-3 px-4 rounded-xl bg-slate-700/60 hover:bg-slate-700 text-slate-300 text-xs font-semibold transition-all border border-slate-600"
          >
            <span>Explore Setup Sandbox</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
