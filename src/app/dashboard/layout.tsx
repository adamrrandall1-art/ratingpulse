'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  Sparkles,
  ChevronDown,
  Building,
  LayoutDashboard,
  User,
  LogOut,
  Send,
  MessageSquare,
  TrendingUp,
  Settings
} from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { profile } = useRatingPulseStore();
  const { user, signOut } = useAuth();
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const displayName =
    user?.user_metadata?.full_name?.trim() ||
    profile?.full_name?.trim() ||
    (user?.email ? user.email.split('@')[0] : '') ||
    'Account';

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setProfileDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSignOut = async () => {
    setProfileDropdownOpen(false);
    try {
      if (signOut) await signOut();
      toast.success('Signed out successfully');
      window.location.assign('/login');
    } catch {
      window.location.assign('/login');
    }
  };

  const primaryNavItems = [
    { name: 'Dashboard', href: '/dashboard', active: pathname === '/dashboard' },
    { name: 'Businesses', href: '/dashboard/setup', active: pathname === '/dashboard/setup' || pathname === '/dashboard/businesses' },
    { name: 'Invites', href: '/dashboard/invites', active: pathname === '/dashboard/invites' },
    { name: 'Reviews', href: '/dashboard/reviews', active: pathname === '/dashboard/reviews' || pathname === '/dashboard/feedback' },
    { name: 'Reports', href: '/dashboard/analytics', active: pathname === '/dashboard/analytics' || pathname === '/dashboard/reports' },
    { name: 'Settings', href: '/dashboard/settings', active: pathname === '/dashboard/settings' },
  ];

  const isReviewsActive = pathname === '/dashboard/reviews' || pathname === '/dashboard/feedback';
  const isReportsActive = pathname === '/dashboard/analytics' || pathname === '/dashboard/reports';
  const isInvitesActive = pathname === '/dashboard/invites';
  const isSettingsActive = pathname === '/dashboard/settings';
  const isDashboardActive = pathname === '/dashboard';

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col">
      
      {/* 1. TOP NAVIGATION BAR (Sticky) */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Left: Brand Logo & Desktop Nav */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="cursor-pointer flex items-center gap-2.5 sm:gap-3 select-none hover:opacity-95 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900">
                RATING<span className="text-blue-600">PULSE</span>
              </span>
            </Link>

            {/* Desktop Navigation Links */}
            <nav className="hidden md:flex items-center gap-6">
              {primaryNavItems.map((item) => (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`text-sm transition-colors ${
                    item.active
                      ? 'text-blue-600 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 font-medium'
                  }`}
                >
                  {item.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Right: Actions & User Profile Menu */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            {/* Desktop Quick-Action CTA */}
            <Link
              href="/dashboard/invites"
              className="hidden md:inline-flex bg-blue-600 hover:bg-blue-700 text-white font-medium text-xs sm:text-sm px-3 sm:px-3.5 py-1.5 rounded-lg shadow-sm items-center gap-1.5 transition-colors shrink-0"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send SMS Invite</span>
            </Link>

            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2 p-1 sm:p-1.5 rounded-full hover:bg-slate-50 transition-colors cursor-pointer min-h-[44px] min-w-[44px] justify-center"
                aria-label="User profile menu"
              >
                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 font-bold text-xs flex items-center justify-center ring-1 ring-slate-200 shrink-0">
                  {displayName.charAt(0).toUpperCase()}
                </div>
                <span className="hidden sm:inline-block text-xs font-semibold text-slate-700 max-w-[120px] truncate">
                  {displayName}
                </span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* Profile Dropdown Menu */}
              {profileDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl border border-slate-200 shadow-xl p-1.5 z-50 text-xs text-slate-700 animate-in fade-in zoom-in-95 duration-100">
                  <div className="px-3 py-2 border-b border-slate-100 mb-1">
                    <div className="font-bold text-slate-900 truncate">{displayName}</div>
                    <div className="text-[11px] text-slate-500 truncate mt-0.5">
                      {profile.business_name || user?.email || 'No Business Connected'}
                    </div>
                  </div>

                  <Link
                    href="/dashboard/setup"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <Building className="w-4 h-4 text-slate-400" />
                    <span>Switch Business</span>
                  </Link>

                  <Link
                    href="/dashboard"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-slate-400" />
                    <span>Dashboard</span>
                  </Link>

                  <Link
                    href="/dashboard/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors"
                  >
                    <User className="w-4 h-4 text-slate-400" />
                    <span>Account</span>
                  </Link>

                  <div className="border-t border-slate-100 my-1" />

                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer font-medium"
                  >
                    <LogOut className="w-4 h-4 text-rose-600" />
                    <span>Sign Out</span>
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>
      </header>

      {/* 2. MAIN DASHBOARD CANVAS */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 pb-24 pt-4 sm:px-6 md:px-8 md:py-8">
        {children}
      </main>

      {/* 3. MOBILE FIXED BOTTOM NAVIGATION DOCK */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 py-1.5 flex justify-around items-center safe-area-pb shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        
        {/* Dashboard */}
        <Link
          href="/dashboard"
          className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] transition-colors ${
            isDashboardActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className={`text-[10px] mt-1 ${isDashboardActive ? 'font-bold' : 'font-medium'}`}>
            Overview
          </span>
        </Link>

        {/* Reviews */}
        <Link
          href="/dashboard/reviews"
          className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] transition-colors ${
            isReviewsActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <MessageSquare className="w-5 h-5" />
          <span className={`text-[10px] mt-1 ${isReviewsActive ? 'font-bold' : 'font-medium'}`}>
            Reviews
          </span>
        </Link>

        {/* Center Elevated Action: Send SMS Invite */}
        <Link
          href="/dashboard/invites"
          className="flex flex-col items-center justify-center -mt-5 px-2 group min-h-[44px]"
        >
          <div
            className={`w-12 h-12 rounded-full flex items-center justify-center shadow-lg ring-4 ring-white transition-transform active:scale-95 ${
              isInvitesActive
                ? 'bg-blue-700 shadow-blue-600/40 text-white'
                : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/30 text-white'
            }`}
          >
            <Send className="w-5 h-5" />
          </div>
          <span
            className={`text-[10px] mt-1 ${
              isInvitesActive ? 'font-bold text-blue-600' : 'font-semibold text-slate-700'
            }`}
          >
            Send Invite
          </span>
        </Link>

        {/* Reports */}
        <Link
          href="/dashboard/analytics"
          className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] transition-colors ${
            isReportsActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span className={`text-[10px] mt-1 ${isReportsActive ? 'font-bold' : 'font-medium'}`}>
            Reports
          </span>
        </Link>

        {/* Settings */}
        <Link
          href="/dashboard/settings"
          className={`flex flex-col items-center justify-center flex-1 py-1 min-h-[44px] transition-colors ${
            isSettingsActive ? 'text-blue-600' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Settings className="w-5 h-5" />
          <span className={`text-[10px] mt-1 ${isSettingsActive ? 'font-bold' : 'font-medium'}`}>
            Settings
          </span>
        </Link>

      </nav>

    </div>
  );
}
