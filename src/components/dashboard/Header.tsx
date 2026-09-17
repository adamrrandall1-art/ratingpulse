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
  Menu,
  Trash2,
  AlertTriangle,
  RefreshCw
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
    resetAccountAndTestData,
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
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const displayName =
    user?.user_metadata?.full_name?.trim() ||
    profile?.full_name?.trim() ||
    (user?.email ? user.email.split('@')[0] : '') ||
    'Account';
  const displayEmail = user?.email || profile.email;
  const isPro =
    profile.plan_status === 'active' ||
    profile.plan_status === 'pro' ||
    profile.plan_status === 'trialing' ||
    profile.plan_status === 'trial' ||
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

  const handleResetAccount = async () => {
    setIsResetting(true);
    try {
      await resetAccountAndTestData();
      setShowResetModal(false);
      toast.success('Account Reset Successful', {
        description: 'All test data, reviews, invites, and business connections have been wiped.',
      });
    } catch (err: any) {
      console.error('Reset account error:', err);
      toast.error('Failed to reset account', {
        description: err?.message || 'Please try again.',
      });
    } finally {
      setIsResetting(false);
    }
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
          {(() => {
            const isConnected = Boolean(profile.google_place_id && profile.business_name && profile.google_connected !== false);
            return (
              <div className="hidden xl:flex items-center gap-2">
                {isConnected ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#10b981]/15 text-[#00e676] border border-[#10b981]/30">
                    <CheckCircle className="w-3 h-3 text-[#00e676]" />
                    Google Sync Active
                  </span>
                ) : (
                  <Link
                    href="/onboarding"
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-800/80 text-slate-400 border border-slate-700/60 hover:text-slate-200 hover:border-slate-600 transition-colors"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-slate-500" />
                    Google Disconnected
                  </Link>
                )}
              </div>
            );
          })()}
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

          {/* Prominent Reset Test Data Button with Red Outline */}
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-xl border border-rose-500/70 bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 hover:text-white text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer shrink-0"
            title="Wipe all mock reviews, SMS invites, and reset business connections"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-400 shrink-0" />
            <span className="hidden sm:inline text-[11px] font-bold">Reset Test Data</span>
          </button>

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

      {/* Reset Account & Clear All Test Data Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150 text-left">
          <div className="bg-white rounded-2xl max-w-md w-full border border-rose-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150 text-slate-900">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1 text-left">
                <h3 className="text-base font-bold text-slate-900">Reset Account & Clear All Test Data?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to clear all test data and reset business connections? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/80 text-xs text-rose-900 space-y-2 text-left">
              <p className="font-bold text-rose-950">This action will immediately:</p>
              <ul className="list-disc pl-4 space-y-1 text-rose-800 text-[11px]">
                <li>Delete all review invites, SMS dispatch logs, and customer feedback from Supabase.</li>
                <li>Delete all synced and mock reviews from the database.</li>
                <li>Clear Google Place ID, Google OAuth tokens, and rating metadata.</li>
                <li>Wipe all cached localStorage keys (<code className="font-mono text-rose-900">ratingpulse_*</code>).</li>
                <li>Reset the UI to a clean 0-state ready for real customer onboarding.</li>
              </ul>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowResetModal(false)}
                disabled={isResetting}
                className="px-4 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleResetAccount}
                disabled={isResetting}
                className="px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition-all transform active:scale-95 cursor-pointer"
              >
                {isResetting ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    Wiping & Resetting...
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    Yes, Wipe Everything & Reset
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
