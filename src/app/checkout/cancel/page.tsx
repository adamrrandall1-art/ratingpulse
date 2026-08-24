'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowLeft, ShieldAlert, RotateCcw } from 'lucide-react';

export default function CheckoutCancelPage() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 text-center space-y-6">
        
        <div className="w-14 h-14 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>

        <div>
          <h1 className="text-2xl font-bold text-slate-900">Checkout Cancelled</h1>
          <p className="text-xs text-slate-500 mt-2 leading-relaxed">
            Your checkout was not completed and your card has not been charged. If you have any questions about our $25/mo plan or 14-day trial, we&apos;re here to help.
          </p>
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Link
            href="/#pricing"
            className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all"
          >
            <RotateCcw className="w-4 h-4" />
            Return to Pricing & Plans
          </Link>
          <Link
            href="/"
            className="w-full py-3 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 font-semibold text-xs transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Homepage
          </Link>
        </div>

      </div>
    </div>
  );
}
