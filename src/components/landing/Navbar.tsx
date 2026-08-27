'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, ArrowRight, Menu, X, User, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import AuthModal from '@/components/auth/AuthModal';
import Logo from '@/components/ui/Logo';

export default function Navbar() {
  const [scrolled, setScrolled]           = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode]           = useState<'signin' | 'signup'>('signin');
  const { user, signOut } = useAuth();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const openAuth = (mode: 'signin' | 'signup') => {
    setAuthMode(mode);
    setAuthModalOpen(true);
    setMobileMenuOpen(false);
  };

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
          scrolled
            ? 'bg-slate-950/85 backdrop-blur-2xl border-b border-slate-800/80 py-3 shadow-2xl shadow-black/40'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">

            {/* Dynamic Pulse Brand Logo */}
            <Logo size="md" subtitle="domain" />

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
              {['#features', '#how-it-works', '#calculator', '#pricing', '#faq'].map((href, i) => (
                <a
                  key={href}
                  href={href}
                  className="hover:text-cyan-400 transition-colors"
                >
                  {['Features', 'How It Works', 'ROI Calculator', 'Pricing', 'FAQ'][i]}
                </a>
              ))}
            </nav>

            {/* Action CTAs */}
            <div className="hidden md:flex items-center gap-3">
              {user ? (
                <>
                  <Link
                    href="/dashboard"
                    className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-cyan-400 hover:bg-slate-800/60 rounded-xl transition-colors flex items-center gap-1.5 border border-transparent hover:border-slate-700"
                  >
                    <User className="w-4 h-4" /> Dashboard
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="text-xs font-semibold text-slate-500 hover:text-rose-400 px-2 py-1 transition-colors cursor-pointer"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login"
                    className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/70 rounded-xl transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:via-blue-500 hover:to-indigo-500 text-white text-sm font-bold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:scale-[1.02] transition-all active:scale-95 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-white" /> Start Free Trial
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center gap-2">
              <Link
                href="/dashboard"
                className="px-3.5 py-1.5 text-xs font-bold bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white rounded-lg shadow-md shadow-cyan-500/20"
              >
                {user ? 'Dashboard' : 'Free Trial'}
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800/80 transition-colors cursor-pointer"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 p-4 bg-slate-900/95 backdrop-blur-2xl border border-slate-800/90 rounded-2xl shadow-2xl flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
              {[
                ['#features', 'Features'],
                ['#how-it-works', 'How It Works'],
                ['#calculator', 'ROI Calculator'],
                ['#pricing', 'Pricing ($25/mo)'],
                ['#faq', 'FAQ'],
              ].map(([href, label]) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="py-2 text-slate-300 font-medium hover:text-cyan-400 transition-colors"
                >
                  {label}
                </a>
              ))}
              <div className="pt-3 border-t border-slate-800 flex flex-col gap-2.5">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 text-white text-sm font-bold rounded-xl shadow-lg shadow-cyan-500/25 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4" />
                  <span>Sign into Dashboard</span>
                </Link>

                {!user ? (
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 border border-slate-700 text-slate-200 text-sm font-semibold rounded-xl hover:bg-slate-800 hover:text-white transition-colors"
                  >
                    Account Login / Register
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      setMobileMenuOpen(false);
                      signOut();
                    }}
                    className="w-full text-center py-2 text-xs font-semibold text-rose-400 hover:text-rose-300 transition-colors"
                  >
                    Sign Out
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </header>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialMode={authMode}
      />
    </>
  );
}


