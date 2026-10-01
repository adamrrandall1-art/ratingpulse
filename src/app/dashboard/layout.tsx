'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Sparkles, ChevronDown, Building, LayoutDashboard, User, LogOut, CheckCircle2 } from 'lucide-react';
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

  const isGoogleConnected = Boolean(
    profile.google_place_id && profile.business_name && profile.google_connected !== false
  );

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
    { name: 'Businesses', href: '/dashboard/setup', active: pathname === '/dashboard/setup' },
    { name: 'Feedback', href: '/dashboard/reviews', active: pathname === '/dashboard/reviews' },
    { name: 'Reports', href: '/dashboard/analytics', active: pathname === '/dashboard/analytics' },
    { name: 'Settings', href: '/dashboard/settings', active: pathname === '/dashboard/settings' },
  ];

  const subNavItems = [
    { name: 'Overview', href: '/dashboard', active: pathname === '/dashboard' },
    { name: 'Reviews', href: '/dashboard/reviews', active: pathname === '/dashboard/reviews' },
    { name: 'Analytics', href: '/dashboard/analytics', active: pathname === '/dashboard/analytics' },
    { name: 'Invites', href: '/dashboard/invites', active: pathname === '/dashboard/invites' },
    { name: 'Business Setup', href: '/dashboard/setup', active: pathname === '/dashboard/setup' },
    { name: 'Settings', href: '/dashboard/settings', active: pathname === '/dashboard/settings' },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col">
      
      {/* 1. TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          
          {/* Left: Brand Logo & Primary Nav */}
          <div className="flex items-center gap-8">
            <Link
              href="/"
              className="cursor-pointer flex items-center gap-3 select-none hover:opacity-95 transition-opacity"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-sm shrink-0">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold tracking-tight text-slate-900">
                RATING<span className="text-blue-600">PULSE</span>
              </span>
            </Link>

            {/* Primary Navigation Links */}
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

          {/* Right: User Profile Menu */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-2.5 p-1 rounded-full hover:bg-slate-50 transition-colors cursor-pointer"
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
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <Building className="w-4 h-4 text-slate-400" />
                  <span>Switch Business</span>
                </Link>

                <Link
                  href="/dashboard"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <LayoutDashboard className="w-4 h-4 text-slate-400" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  href="/dashboard/settings"
                  onClick={() => setProfileDropdownOpen(false)}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors"
                >
                  <User className="w-4 h-4 text-slate-400" />
                  <span>Account</span>
                </Link>

                <div className="border-t border-slate-100 my-1" />

                <button
                  type="button"
                  onClick={handleSignOut}
                  className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-rose-600 hover:bg-rose-50 transition-colors text-left cursor-pointer font-medium"
                >
                  <LogOut className="w-4 h-4 text-rose-600" />
                  <span>Sign Out</span>
                </button>
              </div>
            )}
          </div>

        </div>
      </header>

      {/* 2. SUB-NAVIGATION TAB ROW */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center gap-8 text-sm">
          {subNavItems.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`py-3.5 transition-all text-xs font-semibold ${
                tab.active
                  ? 'border-b-2 border-blue-600 text-blue-600'
                  : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tab.name}
            </Link>
          ))}
        </div>
      </div>

      {/* 3. MAIN DASHBOARD CANVAS */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

    </div>
  );
}
