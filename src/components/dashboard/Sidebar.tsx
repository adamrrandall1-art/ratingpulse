'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  MessageSquareCheck,
  Send,
  Settings,
  Star,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  ArrowLeft,
  X,
  Zap,
  Loader2,
  LogOut
} from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import BrandLogo from '@/components/BrandLogo';

export default function Sidebar({
  onClose,
  className = '',
}: {
  onClose?: () => void;
  className?: string;
}) {
  const pathname = usePathname();
  const { profile, pendingReviewsCount } = useRatingPulseStore();
  const { user } = useAuth();
  const [billingLoading, setBillingLoading] = useState(false);

  const isPro =
    profile.plan_status === 'active' ||
    profile.plan_status === 'pro' ||
    (typeof window !== 'undefined' && localStorage.getItem('ratingpulse_is_pro') === 'true');

  const handleSidebarBillingAction = async (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    if (billingLoading) return;
    setBillingLoading(true);

    try {
      if (isPro) {
        const res = await fetch('/api/stripe/create-portal-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id || profile.id,
            userEmail: user?.email || profile.email,
            customerId: profile.stripe_customer_id,
          }),
        });
        const data = await res.json();
        if (data?.url) {
          window.location.assign(data.url);
          return;
        }
        throw new Error(data?.error || 'Failed to open billing portal');
      } else {
        const res = await fetch('/api/stripe/create-checkout-session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userId: user?.id || profile.id,
            email: user?.email || profile.email,
            businessId: profile.google_place_id || profile.id,
            priceId: 'price_1U7MZG1fc0NSzHx1a8xy48tf',
          }),
        });
        const data = await res.json();
        if (data?.url) {
          window.location.assign(data.url);
          return;
        }
        throw new Error(data?.error || 'Failed to start checkout');
      }
    } catch (err: any) {
      toast.error('Billing error', { description: err?.message || 'Could not connect to Stripe' });
      setBillingLoading(false);
    }
  };

  const navItems = [
    {
      name: 'Overview',
      href: '/dashboard',
      icon: LayoutDashboard,
      badge: null,
    },
    {
      name: 'Review Approvals',
      href: '/dashboard/reviews',
      icon: MessageSquareCheck,
      badge: pendingReviewsCount > 0 ? `${pendingReviewsCount} New` : null,
      badgeColor: 'bg-[#00d2c4] text-slate-950',
    },
    {
      name: 'SMS Invites',
      href: '/dashboard/invites',
      icon: Send,
      badge: null,
    },
    {
      name: 'Settings & Sync',
      href: '/dashboard/settings',
      icon: Settings,
      badge: null,
    },
    {
      name: 'Onboarding Setup',
      href: '/onboarding',
      icon: Sparkles,
      badge: 'Setup',
      badgeColor: 'bg-[#10b981] text-slate-950 font-bold',
    },
  ];

  return (
    <aside className={`w-64 bg-[#0d1317] text-white flex flex-col justify-between shrink-0 min-h-screen border-r border-[#00d2c4]/15 ${className}`}>
      
      {/* Top Brand Logo & Business Pill */}
      <div>
        <div className="p-4 border-b border-[#00d2c4]/15 bg-[#111820]/60">
          <div className="flex items-center justify-between">
            <BrandLogo size="sm" subtitle="dashboard" href="/" onClick={onClose} />

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#161f26] transition-colors"
                title="Close navigation drawer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Business Selector Pill */}
          <div className="mt-4 p-2.5 rounded-xl bg-[#161f26] border border-[#00d2c4]/20 flex items-center justify-between shadow-sm">
            <div className="truncate">
              <div className="text-xs font-bold text-slate-200 truncate">
                {profile.business_name}
              </div>
              <div className="text-[10px] text-[#00d2c4] flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-[#00d2c4] animate-pulse" />
                Google Place Synced
              </div>
            </div>
            <span className="text-xs font-bold text-amber-400 bg-[#111820] px-1.5 py-0.5 rounded border border-amber-500/30">
              {profile.google_rating} ★
            </span>
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="p-3 space-y-1">
          <div className="px-3 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Main Menu
          </div>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-gradient-to-r from-[#00d2c4]/20 via-[#06b6d4]/10 to-transparent border-l-2 border-[#00d2c4] text-[#00d2c4] font-bold shadow-sm'
                    : 'text-slate-300 hover:bg-[#161f26] hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#00d2c4]' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}

          {/* Dedicated Main Menu Upgrade / Manage Subscription Button */}
          <div className="pt-2">
            <button
              type="button"
              onClick={handleSidebarBillingAction}
              disabled={billingLoading}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer border ${
                isPro
                  ? 'bg-slate-800/90 hover:bg-slate-800 text-slate-200 border-slate-700'
                  : 'bg-gradient-to-r from-amber-500/15 via-orange-500/15 to-rose-500/15 hover:from-amber-500/25 hover:via-orange-500/25 hover:to-rose-500/25 text-amber-300 border-amber-500/40 shadow-xs'
              }`}
            >
              <div className="flex items-center gap-3">
                {billingLoading ? (
                  <Loader2 className="w-4 h-4 text-amber-400 animate-spin" />
                ) : (
                  <Zap className={`w-4 h-4 ${isPro ? 'text-blue-400' : 'text-amber-400 fill-amber-400'}`} />
                )}
                <span>{isPro ? 'Manage Subscription' : 'Upgrade to Pro'}</span>
              </div>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  isPro
                    ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                    : 'bg-gradient-to-r from-amber-500 to-rose-500 text-white shadow-xs'
                }`}
              >
                {isPro ? '⚡ PRO' : '⚡ $25/mo'}
              </span>
            </button>
          </div>
        </nav>
      </div>

      {/* Bottom Growth & Landing Page Links */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        {/* Dynamic Plan Status Card */}
        <div
          className={`p-3.5 rounded-2xl text-xs space-y-2.5 shadow-xl transition-all ${
            isPro
              ? 'bg-gradient-to-br from-blue-950 via-slate-900 to-slate-900 border border-blue-800/50'
              : 'bg-gradient-to-br from-slate-900 via-blue-950/70 to-slate-900 border-2 border-amber-500/50 shadow-amber-500/10 ring-1 ring-amber-500/20'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="flex items-center gap-1.5 text-white">
              <Sparkles className={`w-3.5 h-3.5 ${isPro ? 'text-blue-400' : 'text-amber-400'}`} />
              {isPro ? 'RatingPulse Pro' : 'Free Trial Active'}
            </span>
            <span className="text-emerald-400 font-extrabold text-xs">$25/mo</span>
          </div>

          <p className="text-[10px] text-slate-300 leading-relaxed">
            {isPro
              ? 'Unlimited review invites, AI replies & priority sync active.'
              : 'Unlock unlimited SMS & Email invites + 1-tap AI SEO replies.'}
          </p>

          <button
            type="button"
            onClick={handleSidebarBillingAction}
            disabled={billingLoading}
            className={`w-full text-center py-2.5 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-lg disabled:opacity-50 ${
              isPro
                ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700'
                : 'bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500 hover:from-amber-600 hover:via-orange-600 hover:to-rose-600 text-white shadow-orange-500/30 hover:scale-[1.02] active:scale-98'
            }`}
          >
            {billingLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
                <span>Redirecting...</span>
              </>
            ) : isPro ? (
              <span>Manage Subscription →</span>
            ) : (
              <span>⚡ Upgrade to Pro ($25/mo)</span>
            )}
          </button>
        </div>

        {/* Back to landing page */}
        <Link
          href="/"
          onClick={onClose}
          className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Public Site
        </Link>

        {/* Sign Out Button */}
        <button
          type="button"
          onClick={async (e) => {
            e.preventDefault();
            e.stopPropagation();
            if (onClose) onClose();
            try {
              if (user) {
                await fetch('/api/auth/signout', { method: 'POST' }).catch(() => {});
              }
              toast.success('Signed out successfully');
              window.location.assign('/login');
            } catch {
              window.location.assign('/login');
            }
          }}
          className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-xs font-semibold text-rose-400 hover:text-rose-300 hover:bg-rose-950/40 border border-rose-900/30 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

    </aside>
  );
}
