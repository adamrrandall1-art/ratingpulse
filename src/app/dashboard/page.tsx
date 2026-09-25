'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Star,
  TrendingUp,
  MessageSquareCheck,
  Send,
  CheckCircle2,
  Smartphone,
  PhoneCall,
  ShieldAlert,
  Trash2,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import SendInviteModal from '@/components/dashboard/SendInviteModal';
import QuickReviewSender from '@/components/dashboard/QuickReviewSender';
import ReviewsFeed from '@/components/dashboard/ReviewsFeed';
import PrivateFeedbackFeed from '@/components/dashboard/PrivateFeedbackFeed';
import Logo from '@/components/ui/Logo';

export default function DashboardOverview() {
  const { user } = useAuth();
  const {
    profile,
    updateProfile,
    reviews,
    invites,
    sendSmsInvite,
    resetAccountAndTestData,
    isDemoMode,
    pendingReviewsCount,
    publishedReviewsCount,
    unresolvedFeedbackCount
  } = useRatingPulseStore();

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [liveUrgentCount, setLiveUrgentCount] = useState<number | null>(null);

  const handleResetAccount = async () => {
    setIsResetting(true);
    try {
      await resetAccountAndTestData();
      setShowResetModal(false);
      toast.success('Account Reset Successful', {
        description: 'All test data, reviews, invites, and business connections have been wiped.',
      });
    } catch (err: any) {
      toast.error('Failed to reset account', {
        description: err?.message || 'An error occurred during reset.',
      });
    } finally {
      setIsResetting(false);
    }
  };

  // Detect post-checkout upgrade parameters
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const urlParams = new URLSearchParams(window.location.search);
      const upgraded = urlParams.get('upgraded');
      const sessionId = urlParams.get('session_id');

      if (upgraded === 'true' || sessionId) {
        localStorage.setItem('ratingpulse_is_pro', 'true');
        updateProfile({ plan_status: 'active' });

        const uid = user?.id || profile.id;
        if (isSupabaseConfigured && supabase && uid && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid)) {
          supabase
            .from('profiles')
            .update({ plan_status: 'active', updated_at: new Date().toISOString() })
            .eq('id', uid)
            .then(() => console.log('Optimistic Pro plan persisted in Supabase'));
        }

        try {
          confetti({
            particleCount: 100,
            spread: 75,
            origin: { y: 0.6 },
            colors: ['#2563eb', '#10b981', '#fbbf24', '#8b5cf6'],
          });
        } catch {
          // ignore
        }

        toast.success('🎉 Welcome to RatingPulse Pro!', {
          description: 'Your account has been upgraded with unlimited review requests, Gemini AI replies, and priority sync.',
          duration: 6000,
        });

        window.history.replaceState({}, document.title, window.location.pathname);
      }
    }
  }, [user?.id, profile.id, updateProfile]);

  // Quick inline phone state for the sidebar card
  const [sidebarPhone, setSidebarPhone] = useState('');
  const [sidebarSending, setSidebarSending] = useState(false);
  const [sidebarSuccess, setSidebarSuccess] = useState(false);

  useEffect(() => {
    async function loadFeedback() {
      if (!isSupabaseConfigured || !supabase || isDemoMode) {
        return;
      }

      try {
        const activeUid = user?.id || profile.id;
        if (!activeUid) return;

        const { data: feedbackData, error: feedbackError } = await supabase
          .from('feedback')
          .select('*')
          .eq('user_id', activeUid)
          .order('created_at', { ascending: false });

        console.log('Direct Supabase feedback fetch:', feedbackData, feedbackError);

        if (!feedbackError && feedbackData) {
          setFeedbackList(feedbackData);
          const unresolvedItems = feedbackData.filter(
            (item: any) => item.status === 'unresolved' || !item.status
          );
          const urgentCount = unresolvedItems.length;
          setLiveUrgentCount(urgentCount);
          console.log('Feedback Query Results:', feedbackData, 'Live Urgent Count:', urgentCount);
        }
      } catch (e) {
        console.warn('Error loading feedback list:', e);
      }
    }

    loadFeedback();
  }, [user?.id, profile.id, isDemoMode, invites]);

  const displayUrgentCount = (!isDemoMode && liveUrgentCount !== null) ? liveUrgentCount : unresolvedFeedbackCount;

  const recentInvites = invites.slice(0, 6);

  const handleSidebarPhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sidebarPhone.trim()) return;

    setSidebarSending(true);
    await sendSmsInvite('Patient / Client', sidebarPhone, 'General Visit');
    setSidebarSending(false);
    setSidebarSuccess(true);

    try {
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.6 },
        colors: ['#2563eb', '#10b981']
      });
    } catch {
      // ignore
    }

    setTimeout(() => {
      setSidebarSuccess(false);
      setSidebarPhone('');
    }, 2500);
  };

  return (
    <div className="space-y-8">
      
      {/* Top Greeting & Google Status Bar */}
      {(() => {
        const userGreetingName =
          profile?.full_name?.trim() ||
          user?.user_metadata?.full_name?.trim() ||
          (user?.email ? user.email.split('@')[0] : '');

        const isConnected = Boolean(profile.google_connected && profile.google_place_id && profile.business_name);

        return (
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-xl border border-slate-200 shadow-sm">
            <div className="flex items-center gap-4">
              <Logo variant="icon" size="lg" />
              <div>
                <div className="flex items-center gap-3">
                  <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
                    {userGreetingName ? `Welcome back, ${userGreetingName}` : 'Welcome back'}
                  </h1>
                  {isConnected ? (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                      Google Sync Active 🟢
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                      Disconnected
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {isConnected ? (
                    <>
                      Connected to <strong className="text-blue-600">{profile.business_name}</strong> on Google Business Profile
                    </>
                  ) : (
                    <>Manage and automate your customer reviews</>
                  )}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Prominent Reset Test Data Button with Red Outline */}
              <button
                type="button"
                onClick={() => setShowResetModal(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-rose-300 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer shrink-0"
                title="Wipe all mock reviews, SMS invites, Place IDs, and reset business connection"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Reset Test Data</span>
              </button>

              <button
                onClick={() => setInviteModalOpen(true)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all transform active:scale-95 cursor-pointer"
              >
                <Send className="w-3.5 h-3.5 fill-white" />
                Send Review Invite
              </button>
            </div>
          </div>
        );
      })()}

      {/* Prominent Interactive Phone Input & Send Review Request Card */}
      <QuickReviewSender />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Rating Card */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Average Rating</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 flex items-baseline gap-2">
            {profile.google_connected && profile.google_place_id ? profile.google_rating : '—'}
            {profile.google_connected && profile.google_place_id && profile.google_rating >= 4.5 && (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                Top 1% in Area
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            {profile.google_connected && profile.google_place_id ? (
              <>Across <strong className="text-slate-800">{profile.google_review_count}</strong> Google reviews</>
            ) : (
              <span>No business connected</span>
            )}
          </div>
        </div>

        {/* Total Reviews */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Reviews</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 flex items-baseline gap-2">
            {profile.google_connected && profile.google_place_id ? profile.google_review_count : 0}
            {profile.google_connected && profile.google_place_id && (
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200">
                +28 this mo
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {profile.google_connected && profile.google_place_id ? `${publishedReviewsCount} AI replies published` : 'Connect a business to sync'}
          </div>
        </div>

        {/* Urgent Inquiries / Unresolved Low Star Feedback */}
        <a href="#urgent-feedback" className="block bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-rose-300 transition-all group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider group-hover:text-rose-600 transition-colors">Urgent Inquiries</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold border border-rose-200">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 flex items-baseline gap-2">
            {displayUrgentCount}
            {displayUrgentCount > 0 ? (
              <span className="text-xs font-bold text-rose-700 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
                Needs Action
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                All Cleared
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            1–3 star feedback awaiting resolution
          </div>
        </a>

        {/* Pending Approvals */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:border-slate-300 transition-all">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending AI Drafts</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center border border-blue-200">
              <MessageSquareCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 flex items-baseline gap-2">
            {pendingReviewsCount}
            {pendingReviewsCount > 0 ? (
              <span className="text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-200 animate-pulse">
                Needs 1-Tap
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                All Cleared
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Powered by Gemini AI
          </div>
        </div>

      </div>

      {/* Main Grid: Reviews Feed with Gemini 1-Tap Approvals & Recent Invites Stream */}
      <div className="grid lg:grid-cols-12 gap-8">
        
        {/* Left 7 Columns: Dedicated Google Reviews Feed */}
        <div className="lg:col-span-7 space-y-4">
          <ReviewsFeed />
        </div>

        {/* Right 5 Columns: Recent SMS Invites Stream & Fast Direct Sender */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* Fast Direct Phone Sender Card */}
          <div className="bg-white text-slate-900 rounded-xl p-6 border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Quick Review Request</h3>
                  <p className="text-[11px] text-slate-500">Trigger 1-click Google review link</p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                68% Avg Clicks
              </span>
            </div>

            <form onSubmit={handleSidebarPhoneSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Recipient Phone Number
                </label>
                <div className="relative">
                  <PhoneCall className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    required
                    placeholder="(555) 234-5678"
                    value={sidebarPhone}
                    onChange={(e) => setSidebarPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder:text-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={sidebarSending || !sidebarPhone}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold shadow-xs flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer ${
                  sidebarSuccess
                    ? 'bg-emerald-600 text-white'
                    : 'bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50'
                }`}
              >
                {sidebarSending ? (
                  <span>Sending...</span>
                ) : sidebarSuccess ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Review Request Sent!</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5 fill-white" />
                    <span>Send Review Request</span>
                  </>
                )}
              </button>
            </form>

            <button
              onClick={() => setInviteModalOpen(true)}
              className="w-full text-center text-[11px] font-semibold text-slate-500 hover:text-blue-600 transition-colors pt-1 block cursor-pointer"
            >
              Open Full SMS Template & Details Modal
            </button>
          </div>

          {/* Recent Invites Activity Stream */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Recent SMS & Email Invites
              </h3>
              <Link
                href="/dashboard/invites"
                className="text-xs font-semibold text-blue-600 hover:underline"
              >
                All Invites
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentInvites.map((inv) => (
                <div key={inv.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{inv.customer_name}</div>
                    <div className="text-[11px] text-slate-500">{inv.service_type} • {inv.customer_phone}</div>
                  </div>

                  <div>
                    {(inv.status === 'feedback_submitted' || inv.status === 'unresolved' || (inv.rating_received && inv.rating_received <= 3)) && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
                        <ShieldAlert className="w-3 h-3 text-rose-600" />
                        Urgent Alert
                      </span>
                    )}
                    {inv.status === 'reviewed' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        5-Star Left!
                      </span>
                    )}
                    {inv.status === 'opened' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                        Link Opened
                      </span>
                    )}
                    {inv.status === 'delivered' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        Delivered
                      </span>
                    )}
                    {inv.status === 'sent' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
                        Sending...
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Dedicated Section: Urgent Customer Inquiries & Low-Star Feedback Table */}
      <section id="urgent-feedback" className="pt-2 scroll-mt-6">
        <PrivateFeedbackFeed liveFeedback={feedbackList} />
      </section>

      <SendInviteModal
        isOpen={inviteModalOpen}
        onClose={() => setInviteModalOpen(false)}
      />

      {/* Reset Account & Clear All Test Data Confirmation Modal */}
      {showResetModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-rose-200 shadow-2xl p-6 space-y-5 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Reset Account & Clear All Test Data?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to clear all test data and reset business connections? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="p-3.5 rounded-xl bg-rose-50/60 border border-rose-200/80 text-xs text-rose-900 space-y-2">
              <p className="font-bold text-rose-950">This action will immediately:</p>
              <ul className="list-disc pl-4 space-y-1 text-rose-800 text-[11px]">
                <li>Delete all review invites, SMS dispatch logs, and customer feedback from Supabase.</li>
                <li>Delete all synced and mock reviews from the database.</li>
                <li>Clear Google Place ID, Google OAuth tokens, and rating metadata.</li>
                <li>Wipe all cached localStorage keys (<code className="font-mono text-rose-900">ratingpulse_*</code>).</li>
                <li>Reset the dashboard to a clean 0-state ready for real customer onboarding.</li>
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

    </div>
  );
}