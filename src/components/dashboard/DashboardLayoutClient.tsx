'use client';

import React, { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Zap } from 'lucide-react';
import Sidebar from '@/components/dashboard/Sidebar';
import Header from '@/components/dashboard/Header';
import { useRatingPulseStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export default function DashboardLayoutClient({
  children,
}: {
  children: React.ReactNode;
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [mobileUpgrading, setMobileUpgrading] = useState(false);
  const pathname = usePathname();
  const { profile } = useRatingPulseStore();
  const { user } = useAuth();

  const isPro =
    profile.plan_status === 'active' ||
    profile.plan_status === 'pro' ||
    profile.plan_status === 'trialing' ||
    profile.plan_status === 'trial' ||
    (typeof window !== 'undefined' && localStorage.getItem('ratingpulse_is_pro') === 'true');

  const handleMobileUpgrade = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (mobileUpgrading) return;
    setMobileUpgrading(true);

    try {
      const res = await fetch('/api/stripe/create-checkout-session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: user?.id || profile.id,
          email: user?.email || profile.email,
          businessId: profile.google_place_id || profile.id,
          priceId: 'price_1UAZP71k4PvXtJu0TYLD5qVZ',
        }),
      });
      const data = await res.json();
      if (data?.url) {
        window.location.assign(data.url);
        return;
      }
      throw new Error(data?.error || 'Failed to start checkout');
    } catch (err: any) {
      toast.error('Checkout error', { description: err?.message || 'Could not connect to Stripe' });
      setMobileUpgrading(false);
    }
  };

  // Close mobile drawer whenever route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex overflow-x-hidden w-full relative">
      {/* 1. Desktop Persistent Left Sidebar (>= lg / 1024px) */}
      <div className="hidden lg:flex shrink-0">
        <Sidebar />
      </div>

      {/* 2. Mobile Drawer Navigation (< lg / 1024px) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true">
          {/* Backdrop Overlay */}
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs transition-opacity animate-in fade-in"
            onClick={() => setMobileMenuOpen(false)}
            aria-hidden="true"
          />

          {/* Drawer Container */}
          <div className="fixed inset-y-0 left-0 max-w-[85vw] w-72 bg-white shadow-2xl flex flex-col z-50 animate-in slide-in-from-left duration-200 border-r border-slate-200">
            <Sidebar onClose={() => setMobileMenuOpen(false)} className="w-full border-r-0 min-h-full" />
          </div>
        </div>
      )}

      {/* 3. Main Content Container */}
      <div className="flex-1 flex flex-col min-w-0 w-full max-w-full pb-16 lg:pb-0 bg-slate-50">
        <Header onOpenMobileMenu={() => setMobileMenuOpen(true)} />
        <main className="flex-1 p-3.5 sm:p-6 lg:p-8 max-w-7xl w-full min-w-0 mx-auto">
          {children}
        </main>
      </div>

      {/* 4. Mobile Sticky Bottom Upgrade Banner (< lg and !isPro) */}
      {!isPro && (
        <div className="fixed bottom-3 inset-x-3 z-30 lg:hidden animate-in slide-in-from-bottom-5">
          <div className="bg-white/95 backdrop-blur-md border border-blue-200 rounded-2xl p-3 shadow-xl flex items-center justify-between gap-2.5">
            <div className="min-w-0 flex-1">
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5 truncate">
                <span className="w-2 h-2 rounded-full bg-blue-600 animate-pulse" />
                Free Trial Active
              </div>
              <p className="text-[10px] text-slate-500 truncate">
                Unlock unlimited SMS & AI replies ($25/mo)
              </p>
            </div>
            <button
              type="button"
              onClick={handleMobileUpgrade}
              disabled={mobileUpgrading}
              className="px-3.5 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm shrink-0 cursor-pointer flex items-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              {mobileUpgrading ? (
                <>
                  <span className="w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>...</span>
                </>
              ) : (
                <>
                  <Zap className="w-3.5 h-3.5 fill-white" />
                  <span>Upgrade</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
