'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Star, ArrowRight, Menu, X, User, Zap } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import AuthModal from '@/components/auth/AuthModal';
import BrandLogo from '@/components/BrandLogo';

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
            ? 'bg-[#111820]/90 backdrop-blur-2xl border-b border-[#00d2c4]/20 py-3 shadow-2xl shadow-black/60'
            : 'bg-transparent py-5'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">

            {/* Dynamic Brand Logo */}
            <BrandLogo size="md" subtitle="default" />

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
              {['#features', '#how-it-works', '#calculator', '#pricing', '#faq'].map((href, i) => (
                <a
                  key={href}
                  href={href}
                  className="hover:text-[#00d2c4] transition-colors"
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
                    className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-[#00d2c4] hover:bg-[#161f26] rounded-xl transition-colors flex items-center gap-1.5 border border-transparent hover:border-[#00d2c4]/30"
                  >
                    <User className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  <button
                    type="button"
                    onClick={() => signOut()}
                    className="text-xs font-semibold text-slate-400 hover:text-rose-400 px-2 py-1 transition-colors cursor-pointer"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/login?redirect=/dashboard"
                    className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white hover:bg-[#161f26] rounded-xl transition-colors flex items-center gap-1.5 border border-transparent hover:border-slate-700"
                  >
                    <User className="w-4 h-4 text-[#00d2c4]" />
                    <span>Sign into Dashboard</span>
                  </Link>
                  <Link
                    href="/dashboard"
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#00d2c4] via-[#06b6d4] to-[#10b981] hover:brightness-110 text-slate-950 text-sm font-extrabold shadow-[0_0_20px_rgba(0,210,196,0.3)] hover:shadow-[0_0_28px_rgba(0,210,196,0.5)] hover:scale-[1.02] transition-all active:scale-95 cursor-pointer"
                  >
                    <Zap className="w-4 h-4 fill-slate-950" />
                    <span>Start 14-Day Free Trial</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="flex md:hidden items-center gap-2">
              <Link
                href={user ? "/dashboard" : "/login?redirect=/dashboard"}
                className="px-3.5 py-1.5 text-xs font-extrabold bg-gradient-to-r from-[#00d2c4] via-[#06b6d4] to-[#10b981] text-slate-950 rounded-lg shadow-md shadow-[#00d2c4]/20"
              >
                {user ? 'Dashboard' : 'Sign In'}
              </Link>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#161f26] transition-colors cursor-pointer"
                aria-label="Toggle Menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation Dropdown */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-3 p-4 bg-[#111820]/95 backdrop-blur-2xl border border-[#00d2c4]/25 rounded-2xl shadow-2xl flex flex-col gap-3 animate-in fade-in zoom-in-95 duration-150">
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
                  className="py-2 text-slate-300 font-medium hover:text-[#00d2c4] transition-colors"
                >
                  {label}
                </a>
              ))}
              <div className="pt-3 border-t border-slate-800 flex flex-col gap-2.5">
                <Link
                  href={user ? "/dashboard" : "/login?redirect=/dashboard"}
                  onClick={() => setMobileMenuOpen(false)}
                  className="w-full text-center py-2.5 bg-gradient-to-r from-[#00d2c4] via-[#06b6d4] to-[#10b981] text-slate-950 text-sm font-extrabold rounded-xl shadow-lg shadow-[#00d2c4]/25 active:scale-98 transition-all flex items-center justify-center gap-2"
                >
                  <User className="w-4 h-4" />
                  <span>Sign into Dashboard</span>
                </Link>

                {!user ? (
                  <Link
                    href="/login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="w-full text-center py-2.5 border border-slate-700 text-slate-200 text-sm font-semibold rounded-xl hover:bg-[#161f26] hover:text-white transition-colors"
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


