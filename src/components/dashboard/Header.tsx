'use client';

import React, { useState } from 'react';
import {
  Send,
  Bell,
  CheckCircle,
  Database,
  RotateCcw,
  Sparkles,
  Search,
  LogOut,
  User,
  Settings,
  Zap,
  ShieldCheck,
  Check,
  X,
  Menu
} from 'lucide-react';
import Link from 'next/link';
import { useRatingPulseStore } from '@/lib/store';
import { isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import SendInviteModal from './SendInviteModal';
import confetti from 'canvas-confetti';

export default function Header({
  onOpenMobileMenu,
}: {
  onOpenMobileMenu?: () => void;
}) {
  const {
    profile,
    resetDemoData,
    isDemoMode,
    toggleDemoMode,
    simulateIncomingGoogleReview,
    searchQuery,
    setSearchQuery
  } = useRatingPulseStore();
  const { user, signOut } = useAuth();
  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const displayName = user?.user_metadata?.full_name || profile.full_name || 'Dr. Marcus Vance';
  const displayEmail = user?.email || profile.email;
  const isPro =
    profile.plan_status === 'active' ||
    profile.plan_status === 'pro' ||
    (typeof window !== 'undefined' && localStorage.getItem('ratingpulse_is_pro') === 'true');

  const handleToggleDemoMode = () => {
    const nextState = !isDemoMode;
    toggleDemoMode(nextState);

    if (nextState) {
      try {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.2 },
          colors: ['#3b82f6', '#10b981', '#fbbf24'],
        });
      } catch {
        // ignore
      }
      setToastMessage('⚡ Demo Mode Enabled: Populated realistic reviews & SMS history');
    } else {
      setToastMessage('🔒 Live Mode Enabled: Clean production state');
    }

    setTimeout(() => {
      setToastMessage(null);
    }, 3000);
  };

  return (
    <>
      <header className="min-h-16 py-2 bg-[#111820] border-b border-[#00d2c4]/15 px-3 sm:px-6 flex items-center justify-between z-20 sticky top-0 gap-2">
        
        {/* Left: Mobile Drawer Trigger + Search & Location indicator */}
        <div className="flex items-center gap-1.5 sm:gap-4 min-w-0">
          {onOpenMobileMenu && (
            <button
              type="button"
              onClick={onOpenMobileMenu}
              className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-[#161f26] transition-colors cursor-pointer shrink-0"
              title="Open navigation menu"
              aria-label="Open navigation menu"
            >
              <Menu className="w-5 h-5 text-slate-300" />
            </button>
          )}

          <div className="flex items-center gap-2 px-2.5 sm:px-3 py-1.5 rounded-xl bg-[#161f26] border border-[#00d2c4]/20 text-xs text-slate-400 transition-all focus-within:ring-2 focus-within:ring-[#00d2c4]/30 focus-within:border-[#00d2c4] focus-within:bg-[#18222a]">
            <Search className="w-3.5 h-3.5 text-[#00d2c4] shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search reviews & clients..."
              className="bg-transparent border-none text-xs text-slate-100 focus:outline-none w-20 xs:w-32 sm:w-48 md:w-64 placeholder:text-slate-500"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="text-slate-400 hover:text-slate-200 p-0.5 rounded-full hover:bg-slate-700/60 transition-colors"
                title="Clear search"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Google Connected Badge */}
          <div className="hidden xl:flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#10b981]/15 text-[#00e676] border border-[#10b981]/30">
              <CheckCircle className="w-3 h-3 text-[#00e676]" />
              Google Sync Active
            </span>
          </div>
        </div>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">

          {/* Interactive Demo Mode Toggle Switch */}
          <div className="hidden sm:flex items-center gap-1 bg-[#161f26] p-1 rounded-2xl border border-slate-800 transition-colors">
            <button
              onClick={handleToggleDemoMode}
              className={`flex items-center gap-1 px-2 py-1 rounded-xl text-xs font-bold transition-all cursor-pointer ${
                isDemoMode
                  ? 'bg-amber-500 text-white shadow-xs'
                  : 'bg-[#111820] text-slate-300 shadow-2xs border border-slate-700/50'
              }`}
              title="Toggle interactive mock reviews, SMS history, and simulator data"
            >
              <Zap className="w-3 h-3 text-amber-400 fill-amber-400" />
              <span className="text-[10px] uppercase font-bold">{isDemoMode ? 'Demo' : 'Live'}</span>
            </button>
          </div>

          {/* Send Review Invite Modal CTA */}
          <button
            onClick={() => setInviteModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 sm:py-2 rounded-xl bg-gradient-to-r from-[#00d2c4] via-[#06b6d4] to-[#10b981] hover:brightness-110 text-slate-950 text-xs font-extrabold shadow-[0_0_15px_rgba(0,210,196,0.3)] transition-all transform active:scale-95 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 fill-slate-950" />
            <span className="hidden md:inline">Send Review SMS</span>
            <span className="md:hidden">Send</span>
          </button>

          {/* User Profile Dropdown */}
          <div className="relative pl-2 border-l border-slate-800">
            <button
              onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
              className="flex items-center gap-3 p-1 rounded-xl hover:bg-[#161f26] transition-colors cursor-pointer text-left"
            >
              <img
                src="https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=100&h=100&fit=crop&crop=face"
                alt={displayName}
                className="w-9 h-9 rounded-full object-cover ring-2 ring-[#00d2c4]/30 self-center shrink-0"
              />
              <div className="hidden sm:flex flex-col items-start text-left">
                <span className="text-xs font-bold text-slate-100 leading-tight">
                  {displayName}
                </span>
                <span className="text-[10px] text-slate-400 font-medium leading-tight mt-0.5">
                  {profile.business_name}
                </span>
                {isPro && (
                  <div className="mt-1.5 inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[10px] font-extrabold bg-gradient-to-r from-[#00d2c4] to-[#10b981] text-slate-950 shadow-sm w-fit">
                    ⚡ PRO
                  </div>
                )}
              </div>
            </button>

            {/* Dropdown Menu & Click-away Backdrop */}
            {profileDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-20"
                  onClick={() => setProfileDropdownOpen(false)}
                  aria-hidden="true"
                />
                <div className="absolute right-0 mt-2 w-60 bg-[#161f26] rounded-2xl border border-[#00d2c4]/25 shadow-2xl p-2 space-y-1 z-30 animate-in fade-in zoom-in-95 duration-100">
                  <div className="p-2.5 border-b border-slate-800">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-xs font-bold text-slate-100 truncate">{displayName}</span>
                      {isPro ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-gradient-to-r from-[#00d2c4] to-[#10b981] text-slate-950 shadow-xs shrink-0">
                          ⚡ PRO
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-400 border border-amber-500/30 shrink-0">
                          Trial
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">{displayEmail}</div>
                    <div className="text-[10px] text-[#00d2c4] font-semibold truncate mt-0.5">{profile.business_name}</div>
                  </div>

                  <Link
                    href="/dashboard/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#18222a] hover:text-[#00d2c4] transition-colors"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    <span>Account Settings</span>
                  </Link>

                  <Link
                    href="/dashboard/settings"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#18222a] hover:text-[#00d2c4] transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Zap className={`w-4 h-4 ${isPro ? 'text-[#00d2c4]' : 'text-amber-400'}`} />
                      <span>{isPro ? 'Manage Billing' : 'Upgrade to Pro'}</span>
                    </div>
                    <span className="text-[10px] font-bold text-slate-400">$25/mo</span>
                  </Link>

                  <Link
                    href="/onboarding"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-300 hover:bg-[#18222a] hover:text-[#00d2c4] transition-colors"
                  >
                    <Sparkles className="w-4 h-4 text-[#00d2c4]" />
                    <span>Onboarding Wizard</span>
                  </Link>

                  <div className="pt-1 border-t border-slate-800">
                    <button
                      type="button"
                      onClick={async (e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        setProfileDropdownOpen(false);
                        try {
                          if (signOut) {
                            await signOut();
                          }
                          toast.success('Signed out successfully');
                          window.location.assign('/login');
                        } catch {
                          window.location.assign('/login');
                        }
                      }}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-rose-400 hover:bg-rose-950/40 transition-colors text-left cursor-pointer"
                    >
                      <LogOut className="w-4 h-4 text-rose-400" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

        </div>

      </header>

      {/* Floating Mode Switch Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-2xl shadow-2xl border border-slate-800 flex items-center gap-3 text-xs font-semibold animate-in slide-in-from-bottom-5 duration-200">
          <div className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center font-bold">
            ⚡
          </div>
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Modal */}
      <SendInviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />
    </>
  );
}
