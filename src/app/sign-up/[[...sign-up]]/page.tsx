import React from 'react';
import Link from 'next/link';
import { SignUp } from '@clerk/nextjs';
import BrandLogo from '@/components/BrandLogo';
import { Sparkles, ShieldCheck } from 'lucide-react';

export default function SignUpPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 via-white to-slate-50/80 text-slate-900 flex flex-col justify-between">
      {/* Top Header */}
      <header className="px-6 py-5 bg-white/90 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <BrandLogo size="md" subtitle="default" />
          <Link
            href="/sign-in"
            className="text-xs sm:text-sm text-blue-600 hover:text-blue-700 font-medium transition-colors"
          >
            Already have an account? <span className="font-bold underline decoration-blue-200 underline-offset-4 hover:decoration-blue-500">Sign In →</span>
          </Link>
        </div>
      </header>

      {/* Main Sign Up Center Card */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 my-8 sm:my-12">
        <div className="w-full max-w-md flex flex-col items-center space-y-6">
          <div className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2 border border-blue-200/60">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              14-Day Free Trial
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Start Your 14-Day Free Trial
            </h1>
            <p className="text-xs sm:text-sm text-slate-500">
              Turn customer interactions into 5-star Google reviews on autopilot.
            </p>
          </div>

          <div className="w-full flex justify-center shadow-xl shadow-slate-200/50 rounded-2xl">
            <SignUp
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-white text-slate-900 shadow-xl rounded-2xl border border-slate-200/80 p-6 sm:p-8",
                  headerTitle: "text-slate-900 font-bold",
                  headerSubtitle: "text-slate-500 text-xs sm:text-sm",
                  formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm py-2.5 rounded-xl shadow-md shadow-blue-600/20",
                  formFieldInput: "rounded-xl border border-slate-200 text-slate-900 text-xs sm:text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-100",
                  footerActionLink: "text-blue-600 font-bold hover:underline",
                }
              }}
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-500">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
            <span>No credit card required upfront • Instant setup</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-6 text-center text-xs text-slate-500 border-t border-slate-200/80 bg-white/50 backdrop-blur-xs">
        © {new Date().getFullYear()} RatingPulse.co • 100% Google Review Compliant
      </footer>
    </div>
  );
}
