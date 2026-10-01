'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  Star,
  KeyRound,
  Lock,
  ArrowRight,
  CheckCircle2,
  AlertCircle,
  ShieldCheck,
  Sparkles,
  Loader2,
  RefreshCw
} from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import confetti from 'canvas-confetti';

function ResetPasswordForm() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [hasSession, setHasSession] = useState<boolean>(false);
  const [isCheckingSession, setIsCheckingSession] = useState<boolean>(true);

  const { updateUserPassword } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    let isMounted = true;

    async function initRecoverySession() {
      if (!isSupabaseConfigured || !supabase) {
        if (isMounted) {
          setHasSession(true);
          setIsCheckingSession(false);
        }
        return;
      }

      try {
        // 1. Check if PKCE code is in query params
        const code = searchParams.get('code');
        if (code) {
          const { data: exchangeData, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);
          if (!exchangeError && exchangeData?.session) {
            if (isMounted) {
              setHasSession(true);
              setIsCheckingSession(false);
            }
            return;
          }
        }

        // 2. Check if token_hash is in query params (email OTP / token link)
        const tokenHash = searchParams.get('token_hash');
        const type = searchParams.get('type');
        if (tokenHash && type === 'recovery') {
          const { data: verifyData, error: verifyError } =
            await supabase.auth.verifyOtp({ token_hash: tokenHash, type: 'recovery' });
          if (!verifyError && verifyData?.session) {
            if (isMounted) {
              setHasSession(true);
              setIsCheckingSession(false);
            }
            return;
          }
        }

        // 3. Check existing active session
        const { data: { session } } = await supabase.auth.getSession();
        if (session) {
          if (isMounted) {
            setHasSession(true);
            setIsCheckingSession(false);
          }
          return;
        }

        // 4. Wait briefly for Supabase onAuthStateChange (implicit hash tokens)
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, authSession) => {
            if (event === 'PASSWORD_RECOVERY' || (authSession && isMounted)) {
              setHasSession(true);
              setIsCheckingSession(false);
            }
          }
        );

        // Safety timeout to finalize checking state
        const timer = setTimeout(() => {
          if (isMounted) {
            setIsCheckingSession(false);
          }
        }, 2000);

        return () => {
          subscription.unsubscribe();
          clearTimeout(timer);
        };
      } catch (err) {
        console.warn('Session check warning:', err);
        if (isMounted) {
          setIsCheckingSession(false);
        }
      }
    }

    initRecoverySession();

    return () => {
      isMounted = false;
    };
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      if (isSupabaseConfigured && supabase) {
        // Ensure session is active before updating
        const { data: sessionData } = await supabase.auth.getSession();
        
        // If no session found yet, re-check code or prompt user
        const code = searchParams.get('code');
        if (!sessionData?.session && code) {
          await supabase.auth.exchangeCodeForSession(code);
        }

        const { error: sbError } = await supabase.auth.updateUser({ password });
        if (sbError) {
          throw sbError;
        }
      } else {
        const res = await updateUserPassword(password);
        if (res.error) throw new Error(res.error);
      }

      setSuccess(true);
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

      setTimeout(() => {
        router.push('/dashboard');
      }, 1500);
    } catch (err: any) {
      console.error('Password update error:', err);
      setError(
        err.message ||
          'Failed to update password. Your recovery session may have expired. Please request a new recovery link.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full bg-white rounded-3xl border border-slate-200 shadow-xl p-8 sm:p-10 space-y-6">
      <div className="text-center space-y-1">
        <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
          <KeyRound className="w-6 h-6 text-amber-500" />
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
          Set New Password
        </h1>
        <p className="text-xs text-slate-500">
          Enter and confirm your new secure password below
        </p>
      </div>

      {isCheckingSession ? (
        <div className="py-8 text-center space-y-3">
          <Loader2 className="w-7 h-7 text-blue-600 animate-spin mx-auto" />
          <p className="text-xs text-slate-500 font-medium">
            Verifying recovery session...
          </p>
        </div>
      ) : success ? (
        <div className="text-center space-y-3 py-4">
          <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto animate-bounce">
            <CheckCircle2 className="w-8 h-8" />
          </div>
          <h2 className="text-lg font-bold text-slate-900">Password Successfully Updated!</h2>
          <p className="text-xs text-slate-600">
            Your new password has been saved. Redirecting you directly to the dashboard...
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-700 transition-colors shadow-xs"
            >
              <span>Launch Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              New Password *
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

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1">
              Confirm New Password *
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="password"
                required
                minLength={6}
                placeholder="••••••••"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full pl-9 pr-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
              />
            </div>
          </div>

          {error && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-semibold block">Password Update Notice</span>
                <span className="leading-relaxed block">{error}</span>
                <Link
                  href="/login"
                  className="inline-block font-bold text-blue-600 hover:underline pt-1"
                >
                  Request a new password reset email →
                </Link>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Saving New Password...</span>
              </>
            ) : (
              <>
                <span>Save New Password & Log In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      )}

      <div className="pt-2 text-center text-xs text-slate-500">
        Remember your password?{' '}
        <Link href="/login" className="text-blue-600 font-bold hover:underline">
          Sign In
        </Link>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
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
            Sign In →
          </Link>
        </div>
      </header>

      {/* Main Form wrapped with Suspense */}
      <main className="flex-1 flex items-center justify-center p-4 sm:p-6">
        <Suspense fallback={<div className="text-xs text-slate-400 font-medium">Loading reset password...</div>}>
          <ResetPasswordForm />
        </Suspense>
      </main>

      {/* Footer */}
      <footer className="py-4 text-center text-xs text-slate-400">
        © {new Date().getFullYear()} RatingPulse.co • 100% Google Review Compliant
      </footer>
    </div>
  );
}
