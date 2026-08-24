'use client';

import React, { useState, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Star,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  Lock,
  Mail,
  AlertCircle,
  KeyRound,
  CheckCircle2,
  ArrowLeft
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<'signin' | 'forgot_password'>('signin');
  const [resetSent, setResetSent] = useState(false);

  const { user, signInWithEmail, signInWithGoogle, resetPasswordForEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const rawRedirect = searchParams.get('redirect');
  const redirectPath = rawRedirect && !rawRedirect.startsWith('/login') && !rawRedirect.startsWith('/signup')
    ? rawRedirect
    : '/dashboard';

  // If user is already authenticated, forward directly to dashboard
  React.useEffect(() => {
    if (user && !loading) {
      router.push(redirectPath);
    }
  }, [user, loading, router, redirectPath]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    if (mode === 'signin') {
      const res = await signInWithEmail(email, password);
      setLoading(false);

      if (res.error) {
        setError(res.error);
      } else {
        router.push(redirectPath);
      }
    } else {
      const res = await resetPasswordForEmail(email);
      setLoading(false);

      if (res.error) {
        setError(res.error);
      } else {
        setResetSent(true);
      }
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setLoading(true);
    const res = await signInWithGoogle();
    setLoading(false);
    if (res.error) {
      setError(res.error);
    } else {
      router.push(redirectPath);
    }
  };

  return (
    <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 space-y-6">
      <div className="text-center space-y-1">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3">
          {mode === 'forgot_password' ? (
            <KeyRound className="w-6 h-6 text-amber-500" />
          ) : (
            <Lock className="w-6 h-6" />
          )}
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          {mode === 'signin' ? 'Sign In to RatingPulse' : 'Reset Your Password'}
        </h1>
        <p className="text-xs text-slate-500">
          {mode === 'signin'
            ? 'Access your Google reviews feed & automated SMS tools'
            : 'Enter your email address to receive a secure password reset link'}
        </p>
      </div>

      {resetSent ? (
        <div className="text-center space-y-4 py-3">
          <div className="w-12 h-12 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900">Recovery Email Dispatched</h2>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              We sent a secure password reset link to <strong className="text-slate-900">{email}</strong>. Check your inbox and click the link to set your new password.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setResetSent(false);
              setMode('signin');
            }}
            className="inline-flex items-center gap-1.5 text-xs text-blue-600 font-bold hover:underline"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Sign In
          </button>
        </div>
      ) : (
        <>
          {mode === 'signin' && (
            <>
              {/* Google Sign In Button */}
              <button
                type="button"
                onClick={handleGoogleLogin}
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
                <span>Continue with Google</span>
              </button>

              <div className="flex items-center gap-3">
                <div className="flex-1 h-px bg-slate-200" />
                <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  or email
                </span>
                <div className="flex-1 h-px bg-slate-200" />
              </div>
            </>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address
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

            {mode === 'signin' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-slate-700">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      setMode('forgot_password');
                      setError(null);
                    }}
                    className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>
            )}

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
                <span>Processing...</span>
              ) : mode === 'signin' ? (
                <>
                  <span>Sign In to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <Mail className="w-4 h-4" />
                  <span>Send Recovery Email</span>
                </>
              )}
            </button>

            {mode === 'forgot_password' && (
              <div className="text-center pt-1">
                <button
                  type="button"
                  onClick={() => {
                    setMode('signin');
                    setError(null);
                  }}
                  className="text-xs text-slate-500 hover:text-slate-800 font-semibold cursor-pointer"
                >
                  ← Back to Sign In
                </button>
              </div>
            )}
          </form>

          {/* Bottom Switcher */}
          {mode === 'signin' && (
            <div className="pt-2 text-center text-xs text-slate-500">
              Don&apos;t have an account yet?{' '}
              <Link href="/signup" className="text-blue-600 font-bold hover:underline">
                Start 14-Day Free Trial
              </Link>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function LoginPage() {
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
            href="/signup"
            className="text-xs font-bold text-blue-600 hover:text-blue-700"
          >
            Create Account →
          </Link>
        </div>
      </header>

      {/* Main Login Card with Suspense */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <Suspense fallback={<div className="text-xs text-slate-400 font-medium">Loading sign-in...</div>}>
          <LoginForm />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} RatingPulse.co • 100% Google Review Compliant
      </footer>
    </div>
  );
}
