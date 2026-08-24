'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Star,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Lock,
  Mail,
  User,
  Building2,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import confetti from 'canvas-confetti';

export default function SignupPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [confirmationMsg, setConfirmationMsg] = useState(false);

  const { signUpWithEmail, signInWithGoogle } = useAuth();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const res = await signUpWithEmail(email, password, fullName, businessName);
    setLoading(false);

    if (res.error) {
      setError(res.error);
    } else if (res.confirmationRequired) {
      setConfirmationMsg(true);
    } else {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#10b981', '#fbbf24'],
        });
      } catch {
        // ignore
      }
      router.push('/onboarding');
    }
  };

  const handleGoogleSignup = async () => {
    setError(null);
    setLoading(true);
    const res = await signInWithGoogle();
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      router.push('/onboarding');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between">
      
      {/* Top Navbar */}
      <header className="px-6 py-5 bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <span className="font-bold text-lg text-slate-900 tracking-tight">RatingPulse.co</span>
          </Link>

          <Link
            href="/login"
            className="text-xs font-bold text-slate-600 hover:text-blue-600"
          >
            Already have an account? Sign In →
          </Link>
        </div>
      </header>

      {/* Main Signup Card */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 space-y-6">
          
          <div className="text-center space-y-1">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-bold uppercase tracking-wider mb-2 border border-blue-100">
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              14-Day Free Trial
            </div>
            <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
              Create Your Account
            </h1>
            <p className="text-xs text-slate-500">
              Start collecting 5-star Google reviews in 2 minutes. No card required.
            </p>
          </div>

          {confirmationMsg ? (
            <div className="p-6 text-center space-y-3 bg-slate-50 rounded-2xl border border-slate-200">
              <div className="w-12 h-12 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center mx-auto">
                <Mail className="w-6 h-6" />
              </div>
              <h2 className="text-base font-bold text-slate-900">Check Your Email</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                We sent a confirmation link to <strong className="text-slate-800">{email}</strong>. Click the link to complete your signup.
              </p>
              <Link
                href="/login"
                className="text-xs text-blue-600 font-bold hover:underline block pt-2"
              >
                Go to Sign In
              </Link>
            </div>
          ) : (
            <>
              {/* Google Button */}
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={loading}
                className="w-full py-3 px-4 rounded-xl border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center justify-center gap-2.5 transition-colors shadow-2xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Sign up with Google</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  or with email
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-3.5">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Your Name *
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Dr. Marcus Vance"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Business Name *
                  </label>
                  <div className="relative">
                    <Building2 className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Apex Dental & Aesthetics"
                      value={businessName}
                      onChange={(e) => setBusinessName(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="email"
                      required
                      placeholder="owner@yourbusiness.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Password *
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="password"
                      required
                      minLength={6}
                      placeholder="••••••••"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-3.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer disabled:opacity-50"
                >
                  {loading ? (
                    <span>Creating Account...</span>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Start 14-Day Free Trial</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              {/* Bottom Switcher */}
              <div className="pt-2 text-center text-xs text-slate-500">
                Already have an account?{' '}
                <Link href="/login" className="text-blue-600 font-bold hover:underline">
                  Sign In
                </Link>
              </div>
            </>
          )}

        </div>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} RatingPulse.co • 100% Google Review Compliant
      </footer>

    </div>
  );
}
