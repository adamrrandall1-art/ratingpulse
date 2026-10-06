import React from 'react';
import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';
import BrandLogo from '@/components/BrandLogo';
import { Sparkles, ShieldCheck } from 'lucide-react';

export default function SignInPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-900 via-slate-950 to-slate-900 text-white flex flex-col justify-between">
      {/* Top Header */}
      <header className="px-6 py-4 bg-slate-900/80 backdrop-blur-xl border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <BrandLogo size="md" subtitle="default" />
          <Link
            href="/sign-up"
            className="text-xs font-bold text-[#00d2c4] hover:underline flex items-center gap-1.5"
          >
            Create Account →
          </Link>
        </div>
      </header>

      {/* Main Sign In Center Card */}
      <main className="flex-1 flex flex-col items-center justify-center p-4 sm:p-6 my-6">
        <div className="w-full max-w-md flex flex-col items-center space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center justify-center gap-2">
              <Sparkles className="w-5 h-5 text-[#00d2c4]" />
              Welcome to RatingPulse
            </h1>
            <p className="text-xs text-slate-400">
              Sign in to manage automated Google review growth &amp; AI replies.
            </p>
          </div>

          <div className="w-full flex justify-center shadow-2xl rounded-2xl">
            <SignIn
              appearance={{
                elements: {
                  rootBox: "w-full",
                  card: "bg-white text-slate-900 shadow-xl rounded-2xl border border-slate-200",
                  headerTitle: "text-slate-900 font-bold",
                  headerSubtitle: "text-slate-500 text-xs",
                  formButtonPrimary: "bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs py-2.5 rounded-xl shadow-md",
                  formFieldInput: "rounded-xl border-slate-300 text-slate-900 text-xs",
                  footerActionLink: "text-blue-600 font-bold hover:underline",
                }
              }}
            />
          </div>

          <div className="flex items-center gap-2 text-[11px] text-slate-400">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Bank-grade 256-bit encryption &amp; OAuth security</span>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-500 border-t border-slate-800/80">
        © {new Date().getFullYear()} RatingPulse.co • All rights reserved
      </footer>
    </div>
  );
}
