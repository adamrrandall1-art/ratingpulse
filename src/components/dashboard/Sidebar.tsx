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
    profile.plan_status === 'trialing' ||
    profile.plan_status === 'trial' ||
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
            priceId: 'price_1UAZP71k4PvXtJu0TYLD5qVZ',
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
    <aside className={`w-64 bg-white text-slate-900 flex flex-col justify-between shrink-0 min-h-screen border-r border-slate-200 ${className}`}>
      
      {/* Top Brand Logo & Business Pill */}
      <div>
        <div className="p-4 border-b border-slate-200 bg-slate-50/60">
          <div className="flex items-center justify-between">
            <BrandLogo size="sm" subtitle="dashboard" href="/" onClick={onClose} />

            {onClose && (
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
                title="Close navigation drawer"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>

          {/* Business Selector Pill */}
          {(() => {
            const isConnected = Boolean(profile.google_place_id && profile.business_name && profile.google_connected !== false);
            return isConnected ? (
              <div className="mt-4 p-2.5 rounded-xl bg-white border border-slate-200 flex items-center justify-between shadow-xs">
                <div className="truncate">
                  <div className="text-xs font-bold text-slate-900 truncate">
                    {profile.business_name}
                  </div>
                  <div className="text-[10px] text-emerald-600 flex items-center gap-1 font-semibold">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Google Sync Active 🟢
                  </div>
                </div>
                <span className="text-xs font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                  {profile.google_rating} ★
                </span>
              </div>
            ) : (
              <Link
                href="/onboarding"
                onClick={onClose}
                className="mt-4 p-2.5 rounded-xl bg-slate-100/70 border border-dashed border-slate-300 hover:border-blue-400 flex items-center justify-between transition-colors group cursor-pointer block"
              >
                <div className="truncate">
                  <div className="text-xs font-semibold text-slate-600 group-hover:text-slate-900 truncate">
                    No Business Connected
                  </div>
                  <div className="text-[10px] text-slate-400 group-hover:text-blue-600 flex items-center gap-1 font-medium">
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-400" />
                    Disconnected • Click to Link
                  </div>
                </div>
                <span className="text-xs font-semibold text-slate-500 group-hover:text-blue-600 bg-white px-1.5 py-0.5 rounded border border-slate-200 shadow-2xs">
                  + Link
                </span>
              </Link>
            );
          })()}
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
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs transition-all ${
                  isActive
                    ? 'bg-blue-50/70 border-l-2 border-blue-600 text-blue-600 font-semibold shadow-2xs'
                    : 'text-slate-600 font-medium hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${item.badgeColor || 'bg-blue-100 text-blue-800'}`}>
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
                  ? 'bg-slate-100 hover:bg-slate-200 text-slate-800 border-slate-200'
                  : 'bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200 shadow-2xs'
              }`}
            >
              <div className="flex items-center gap-3">
                {billingLoading ? (
                  <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                ) : (
                  <Zap className={`w-4 h-4 ${isPro ? 'text-blue-600' : 'text-blue-600 fill-blue-600'}`} />
                )}
                <span>{isPro ? 'Manage Subscription' : 'Upgrade to Pro'}</span>
              </div>
              <span
                className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                  isPro
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                    : 'bg-blue-600 text-white shadow-2xs'
                }`}
              >
                {isPro ? 'PRO' : '$25/mo'}
              </span>
            </button>
          </div>
        </nav>
      </div>

      {/* Bottom Growth & Landing Page Links */}
      <div className="p-4 border-t border-slate-200 space-y-3">
        {/* Dynamic Plan Status Card */}
        <div
          className={`p-3.5 rounded-2xl text-xs space-y-2.5 border transition-all ${
            isPro
              ? 'bg-slate-50 border-slate-200 shadow-xs'
              : 'bg-blue-50/50 border-blue-200 shadow-xs'
          }`}
        >
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="flex items-center gap-1.5 text-slate-900">
              <Sparkles className={`w-3.5 h-3.5 ${isPro ? 'text-blue-600' : 'text-blue-600'}`} />
              {isPro ? 'RatingPulse Pro' : 'Free Trial Active'}
            </span>
            <span className="text-emerald-700 font-extrabold text-xs">$25/mo</span>
          </div>

          <p className="text-[10px] text-slate-600 leading-relaxed">
            {isPro
              ? 'Unlimited review invites, AI replies & priority sync active.'
              : 'Unlock unlimited SMS & Email invites + 1-tap AI SEO replies.'}
          </p>

          <button
            type="button"
            onClick={handleSidebarBillingAction}
            disabled={billingLoading}
            className={`w-full text-center py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50 ${
              isPro
                ? 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm'
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
          className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-xs font-medium text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors"
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
          className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-xs font-semibold text-rose-600 hover:text-rose-700 hover:bg-rose-50 border border-rose-200 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
          <span>Sign Out</span>
        </button>
      </div>

    </aside>
  );
}
