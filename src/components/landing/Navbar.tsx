'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, ArrowRight, Menu, X, User, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import AuthModal from '@/components/auth/AuthModal';

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
            ? 'bg-slate-950/80 backdrop-blur-xl border-b border-slate-800/60 py-3 shadow-xl shadow-black/20'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">

            {/* Brand Logo */}
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-emerald-500/30 group-hover:shadow-emerald-500/50 transition-all">
                <Star className="w-5 h-5 fill-white text-white" />
              </div>
              <div className="flex flex-col">
                <span className="font-bold text-xl tracking-tight text-white flex items-center gap-1">
                  RatingPulse<span className="text-emerald-400">.co</span>
                </span>
                <span className="text-[10px] uppercase font-semibold tracking-wider text-slate-500">
                  Google Review Automation
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-400">
              {['#features', '#how-it-works', '#calculator', '#pricing', '#faq'].map((href, i) => (
                <a
                  key={href}
                  href={href}
                  className="hover:text-emerald-400 transition-colors"
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
                    className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-emerald-400 hover:bg-slate-800/60 rounded-lg transition-colors flex items-center gap-1.5"
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
                    className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-slate-950 text-sm font-bold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/40 transition-all active:scale-95 cursor-pointer"
                  >
                    <Zap className="w-4 h-4" /> Start Free Trial
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center gap-2">
              <Link
                href="/dashboard"
                className="px-3 py-1.5 text-xs font-bold bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 rounded-lg shadow-sm"
              >
                {user ? 'Dashboard' : 'Free Trial'}
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-lg text-slate-400 hover:bg-slate-800/60 transition-colors cursor-pointer"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 p-4 bg-slate-900/95 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-2xl flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
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
                  className="py-2 text-slate-300 font-medium hover:text-emerald-400 transition-colors"
                >
                  {label}
                </a>
              ))}
              <div className="pt-3 border-t border-slate-800 flex flex-col gap-2.5">
                <Link
                  href="/dashboard"
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 text-sm font-bold rounded-xl shadow-md shadow-emerald-500/20 active:scale-98 transition-all flex items-center justify-center gap-2"
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


