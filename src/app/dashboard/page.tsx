'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  Star,
  TrendingUp,
  ExternalLink,
  MessageSquare,
  ShieldCheck,
  AlertCircle,
  Building2,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Send,
  SlidersHorizontal,
  Clock,
  Check,
  ChevronDown
} from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { useAuth } from '@/lib/auth-context';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';
import SendInviteModal from '@/components/dashboard/SendInviteModal';
import QuickReviewSender from '@/components/dashboard/QuickReviewSender';

interface Review {
  id: string;
  author_name: string;
  rating: number;
  text: string;
  relative_time_description: string;
  source: 'google' | 'private_feedback';
}

interface BusinessProfile {
  name: string;
  place_id: string | null;
  address?: string;
  rating?: number;
  total_reviews?: number;
}

export default function DashboardOverview() {
  const { user } = useAuth();
  const {
    profile,
    updateProfile,
    reviews: storeReviews,
    syncGoogleReviews,
    invites,
    sendSmsInvite,
    resetAccountAndTestData,
    isDemoMode,
    pendingReviewsCount,
    publishedReviewsCount
  } = useRatingPulseStore();

  const [inviteModalOpen, setInviteModalOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [filterRating, setFilterRating] = useState<'all' | 'positive' | 'negative'>('all');

  // Business profile single source of truth
  const business: BusinessProfile = {
    name: profile.business_name || '',
    place_id: (profile.google_connected !== false && profile.google_place_id) ? profile.google_place_id : null,
    address: (profile as any)?.business_address || '',
    rating: profile.google_rating || 5.0,
    total_reviews: profile.google_review_count || 0
  };

  const isGoogleConnected = Boolean(business.place_id);

  // Guarded reviews: if Google is NOT connected, NEVER show ghost, mock, or unscoped reviews
  const allReviews: Review[] = isGoogleConnected
    ? (storeReviews || []).map((rev) => ({
        id: rev.id,
        author_name: rev.author_name,
        rating: rev.rating,
        text: rev.review_text,
        relative_time_description: rev.review_date
          ? new Date(rev.review_date).toLocaleDateString()
          : 'Recent',
        source: 'google'
      }))
    : [];

  const displayedReviews = isGoogleConnected
    ? allReviews.filter((rev) => {
        if (filterRating === 'positive') return rev.rating >= 4;
        if (filterRating === 'negative') return rev.rating < 4;
        return true;
      })
    : [];

  const handleSyncLatestReviews = async () => {
    if (!isGoogleConnected) {
      toast.info('Please connect a Google Business Profile first.');
      return;
    }
    setIsSyncing(true);
    try {
      await syncGoogleReviews();
      toast.success('Reviews Synced', {
        description: 'Latest customer reviews have been refreshed from Google.',
      });
    } catch (err: any) {
      toast.error('Sync failed', { description: err?.message || 'Could not reach Google API' });
    } finally {
      setIsSyncing(false);
    }
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

  return (
    <div className="space-y-8">
      
      {/* Page Title & Quick Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-slate-900">
            Reputation Overview
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Monitor incoming Google Business Profile reviews and protect customer trust.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Prominent Reset Test Data Button */}
          <button
            type="button"
            onClick={() => setShowResetModal(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-all shadow-2xs active:scale-95 cursor-pointer"
            title="Wipe all mock reviews, SMS invites, Place IDs, and reset business connection"
          >
            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
            <span>Reset Test Data</span>
          </button>

          <button
            onClick={() => setInviteModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-lg shadow-sm transition-all transform active:scale-95 cursor-pointer"
          >
            <Send className="w-3.5 h-3.5 fill-white" />
            <span>Send Invite</span>
          </button>

          {isGoogleConnected ? (
            <button
              onClick={handleSyncLatestReviews}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all disabled:opacity-50 cursor-pointer"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Latest Reviews'}
            </button>
          ) : (
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Connect Google Profile</span>
            </Link>
          )}
        </div>
      </div>

      {/* 3-COLUMN KPI METRIC CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* KPI 1: Active Business Profile */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Connected Location</span>
              <Building2 className="w-4 h-4 text-slate-400" />
            </div>
            <h3 className="text-lg font-bold text-slate-900">
              {business?.name || 'No Business Connected'}
            </h3>
            <p className="text-xs text-slate-500 mt-1 truncate">
              {business?.place_id ? `Place ID: ${business.place_id}` : 'Link a location to start monitoring'}
            </p>
          </div>
          
          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs">
            <span className="text-slate-500">Google Status</span>
            {isGoogleConnected ? (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                Google Sync Active 🟢
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
                Disconnected
              </span>
            )}
          </div>
        </div>

        {/* KPI 2: Review Volume & Score */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Rating & Score</span>
              <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {isGoogleConnected && business?.rating ? business.rating.toFixed(1) : '—'}
              </span>
              <span className="text-xs text-slate-500">
                {isGoogleConnected ? `/ 5.0 (${business?.total_reviews || 0} reviews)` : 'No data'}
              </span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Smart Routing Guard</span>
            <span className="font-semibold text-blue-600">Active (1-3★ Filtered)</span>
          </div>
        </div>

        {/* KPI 3: SMS Invite Funnel */}
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">Automation Funnel</span>
              <TrendingUp className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-extrabold text-slate-900">
                {isGoogleConnected ? '100%' : '0%'}
              </span>
              <span className="text-xs text-slate-500">delivery health</span>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>SMS Dispatcher</span>
            <span className="font-semibold text-emerald-600">Operational</span>
          </div>
        </div>

      </div>

      {/* Quick Review SMS / Email Sender Card */}
      <QuickReviewSender />

      {/* REVIEWS TABLE CONTAINER */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        
        {/* Table Header & Controls */}
        <div className="px-6 py-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Recent Customer Reviews</h3>
            <p className="text-xs text-slate-500">Public Google reviews and confidential private feedback</p>
          </div>

          {/* Filter Toggle */}
          <div className="inline-flex rounded-lg border border-slate-200 p-1 bg-slate-50 text-xs font-medium text-slate-600">
            <button 
              onClick={() => setFilterRating('all')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${filterRating === 'all' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'}`}
            >
              All
            </button>
            <button 
              onClick={() => setFilterRating('positive')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${filterRating === 'positive' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'}`}
            >
              4-5★ Public
            </button>
            <button 
              onClick={() => setFilterRating('negative')}
              className={`px-3 py-1 rounded-md transition-all cursor-pointer ${filterRating === 'negative' ? 'bg-white text-slate-900 shadow-sm font-semibold' : 'hover:text-slate-900'}`}
            >
              1-3★ Private
            </button>
          </div>
        </div>

        {/* Table Content or Strict Guarded Empty State */}
        {!isGoogleConnected || displayedReviews.length === 0 ? (
          <div className="px-6 py-16 text-center max-w-md mx-auto">
            <div className="w-12 h-12 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center mx-auto text-slate-400 mb-4">
              <AlertCircle className="w-6 h-6 text-slate-400" />
            </div>
            <h4 className="text-base font-bold text-slate-900 mb-1">
              {!isGoogleConnected ? 'No Google Business Connected' : 'No Reviews Synced Yet'}
            </h4>
            <p className="text-xs text-slate-500 mb-6 leading-relaxed">
              {!isGoogleConnected 
                ? 'Connect your Google Business Profile in Onboarding or Settings to start syncing customer reviews.'
                : 'Send an automated SMS invite to your recent customers to start collecting ratings.'}
            </p>
            {!isGoogleConnected && (
              <Link
                href="/onboarding"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg shadow-sm transition-all"
              >
                Connect Google Account
              </Link>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-slate-700">
              <thead className="bg-slate-50 text-xs font-semibold text-slate-500 uppercase px-6 py-3 border-b border-slate-200">
                <tr>
                  <th scope="col" className="px-6 py-3">Customer</th>
                  <th scope="col" className="px-6 py-3">Rating</th>
                  <th scope="col" className="px-6 py-3">Review & Feedback</th>
                  <th scope="col" className="px-6 py-3">Date</th>
                  <th scope="col" className="px-6 py-3">Channel</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedReviews.map((rev) => (
                  <tr key={rev.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="px-6 py-4 font-semibold text-slate-900 whitespace-nowrap">
                      {rev.author_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center gap-1 text-amber-400">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-3.5 h-3.5 ${i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`} 
                          />
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-600 max-w-md">
                      {rev.text}
                    </td>
                    <td className="px-6 py-4 text-xs text-slate-400 whitespace-nowrap">
                      {rev.relative_time_description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {rev.source === 'google' ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          Google Public
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          Private Feedback
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

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
                <AlertCircle className="w-5 h-5" />
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