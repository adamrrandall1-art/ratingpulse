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
  ShieldAlert
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

export default function DashboardOverview() {
  const { user } = useAuth();
  const {
    profile,
    updateProfile,
    reviews,
    invites,
    sendSmsInvite,
    isDemoMode,
    pendingReviewsCount,
    publishedReviewsCount,
    unresolvedFeedbackCount
  } = useRatingPulseStore();

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [feedbackList, setFeedbackList] = useState<any[]>([]);
  const [liveUrgentCount, setLiveUrgentCount] = useState<number | null>(null);

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
        const { data: feedbackData, error: feedbackError } = await supabase
          .from('feedback')
          .select('*')
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 sm:p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
            Welcome back, {profile.full_name || 'Dr. Marcus'}
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Connected to <strong className="text-slate-700">{profile.business_name}</strong> on Google Business Profile
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setInviteModalOpen(true)}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/30 transition-all transform active:scale-95 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5" />
            Send Review Invite
          </button>
        </div>
      </div>

      {/* Prominent Interactive Phone Input & Send Review Request Card */}
      <QuickReviewSender />

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
        
        {/* Rating Card */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Average Rating</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-500 flex items-center justify-center">
              <Star className="w-4 h-4 fill-amber-400" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 flex items-baseline gap-2">
            {profile.google_rating}
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              Top 1% in Area
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            Across <strong>{profile.google_review_count}</strong> Google reviews
          </div>
        </div>

        {/* Total Reviews */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Total Reviews</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 flex items-baseline gap-2">
            {profile.google_review_count}
            <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              +28 this mo
            </span>
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {publishedReviewsCount} AI replies published
          </div>
        </div>

        {/* Urgent Inquiries / Unresolved Low Star Feedback */}
        <a href="#urgent-feedback" className="block bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs hover:border-rose-300 hover:shadow-md transition-all group">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider group-hover:text-rose-600 transition-colors">Urgent Inquiries</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
              <ShieldAlert className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 flex items-baseline gap-2">
            {displayUrgentCount}
            {displayUrgentCount > 0 ? (
              <span className="text-xs font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-200 animate-pulse">
                Needs Action
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                All Cleared
              </span>
            )}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            1–3 star feedback awaiting resolution
          </div>
        </a>

        {/* Pending Approvals */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
          <div className="flex items-center justify-between text-slate-500 mb-2">
            <span className="text-xs font-bold uppercase tracking-wider">Pending AI Drafts</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <MessageSquareCheck className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-slate-900 flex items-baseline gap-2">
            {pendingReviewsCount}
            {pendingReviewsCount > 0 ? (
              <span className="text-xs font-bold text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded animate-pulse">
                Needs 1-Tap
              </span>
            ) : (
              <span className="text-xs font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
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
          <div className="bg-gradient-to-br from-slate-900 to-slate-950 text-white rounded-2xl p-6 border border-slate-800 shadow-xl space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white">
                  <Smartphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-white">Quick Review Request</h3>
                  <p className="text-[11px] text-slate-400">Trigger 1-click Google review link</p>
                </div>
              </div>
              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/70 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                68% Avg Clicks
              </span>
            </div>

            <form onSubmit={handleSidebarPhoneSubmit} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Recipient Phone Number
                </label>
                <div className="relative">
                  <PhoneCall className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-blue-400" />
                  <input
                    type="tel"
                    required
                    placeholder="(555) 234-5678"
                    value={sidebarPhone}
                    onChange={(e) => setSidebarPhone(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={sidebarSending || !sidebarPhone}
                className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer ${
                  sidebarSuccess
                    ? 'bg-emerald-500 text-white'
                    : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-600/30 disabled:opacity-50'
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
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Review Request</span>
                  </>
                )}
              </button>
            </form>

            <button
              onClick={() => setInviteModalOpen(true)}
              className="w-full text-center text-[11px] font-semibold text-slate-400 hover:text-blue-400 transition-colors pt-1 block cursor-pointer"
            >
              Open Full SMS Template & Details Modal
            </button>
          </div>

          {/* Recent Invites Activity Stream */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-900">
                Recent SMS & Email Invites
              </h3>
              <Link
                href="/dashboard/invites"
                className="text-xs font-semibold text-blue-600 hover:text-blue-700"
              >
                All Invites
              </Link>
            </div>

            <div className="divide-y divide-slate-100">
              {recentInvites.map((inv) => (
                <div key={inv.id} className="py-3 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-bold text-slate-900">{inv.customer_name}</div>
                    <div className="text-[11px] text-slate-400">{inv.service_type} • {inv.customer_phone}</div>
                  </div>

                  <div>
                    {(inv.status === 'feedback_submitted' || inv.status === 'unresolved' || (inv.rating_received && inv.rating_received <= 3)) && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 border border-rose-300">
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
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                        Delivered
                      </span>
                    )}
                    {inv.status === 'sent' && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-700">
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

    </div>
  );
}