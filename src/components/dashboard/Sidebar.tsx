'use client';

import React from 'react';
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
  ArrowLeft
} from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';

export default function Sidebar() {
  const pathname = usePathname();
  const { profile, pendingReviewsCount } = useRatingPulseStore();

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
      badgeColor: 'bg-blue-600 text-white',
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
      badgeColor: 'bg-emerald-500 text-white',
    },
  ];

  return (
    <aside className="w-64 bg-slate-900 text-white flex flex-col justify-between shrink-0 min-h-screen border-r border-slate-800">
      
      {/* Top Brand Logo & Business Pill */}
      <div>
        <div className="p-5 border-b border-slate-800">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Star className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <span className="font-bold text-lg text-white tracking-tight">RatingPulse</span>
              <span className="block text-[10px] text-blue-400 font-semibold tracking-wider uppercase">
                Dashboard
              </span>
            </div>
          </Link>

          {/* Business Selector Pill */}
          <div className="mt-4 p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-between">
            <div className="truncate">
              <div className="text-xs font-bold text-slate-200 truncate">
                {profile.business_name}
              </div>
              <div className="text-[10px] text-emerald-400 flex items-center gap-1 font-medium">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Google Place Synced
              </div>
            </div>
            <span className="text-xs font-bold text-amber-400 bg-slate-900/60 px-1.5 py-0.5 rounded border border-slate-700">
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
                className={`flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${item.badgeColor}`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </div>

      {/* Bottom Growth & Landing Page Links */}
      <div className="p-4 border-t border-slate-800 space-y-3">
        {/* $25/mo Plan Status Card */}
        <div className="p-3 rounded-xl bg-gradient-to-br from-blue-950 to-slate-900 border border-blue-800/40 text-xs">
          <div className="flex items-center justify-between text-[11px] font-bold text-blue-300 mb-1">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-blue-400" />
              Growth Plan
            </span>
            <span className="text-emerald-400">$25/mo</span>
          </div>
          <p className="text-[10px] text-slate-400">
            Unlimited SMS invites & 1-tap AI reply engine active.
          </p>
        </div>

        {/* Back to landing page */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2 w-full py-2 px-3 rounded-lg text-xs font-medium text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Public Site
        </Link>
      </div>

    </aside>
  );
}
