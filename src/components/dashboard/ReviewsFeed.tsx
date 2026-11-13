'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Star,
  Sparkles,
  CheckCircle2,
  Clock,
  RefreshCw,
  Edit3,
  Check,
  Bot,
  Plus,
  Send,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Zap,
  Building,
  Phone,
  Mail,
  PhoneCall,
  MessageSquare,
  MessageSquareCheck,
} from 'lucide-react';
import { useRatingPulseStore, isBusinessConnected, computeMergedFeedback } from '@/lib/store';
import { Review, Invite } from '@/lib/supabase/types';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import PrivateFeedbackFeed from './PrivateFeedbackFeed';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface Props {
  initialFilter?: 'all' | 'pending' | 'published' | 'private';
  showSimulateButton?: boolean;
  maxItems?: number;
}

interface UnifiedItem {
  id: string;
  type: 'google' | 'private';
  author_name: string;
  author_avatar?: string | null;
  rating: number;
  text: string;
  date: string;
  status: string; // 'pending_approval' | 'published' | 'needs_follow_up' | 'contacted' | 'resolved'
  customer_phone?: string | null;
  customer_email?: string | null;
  notes?: string | null;
  resolution_status?: string | null;
  ai_draft_reply?: string | null;
  published_reply?: string | null;
  place_id?: string | null;
  original: any;
}

export default function ReviewsFeed({
  initialFilter = 'all',
  showSimulateButton = true,
  maxItems,
}: Props) {
  const searchParams = useSearchParams();
  const tabParam = searchParams?.get('tab');
  const idParam = searchParams?.get('id');

  const {
    activeBusiness,
    profile,
    reviews,
    invites,
    feedback,
    approveReview,
    updateDraftText,
    simulateIncomingGoogleReview,
    syncGoogleReviews,
    updateInviteResolution,
    pendingReviewsCount,
    publishedReviewsCount,
    privateFeedbackCount,
    unresolvedFeedbackCount,
    isDemoMode,
    searchQuery,
  } = useRatingPulseStore();

  const isConnected = isBusinessConnected(activeBusiness, isDemoMode);

  // Preserve deep links (?tab=private or ?id=...) on initial mount without hydration flicker
  const [activeTab, setActiveTab] = useState<'all' | 'google' | 'private'>(() => {
    if (tabParam === 'private' || tabParam === 'gated' || idParam) return 'private';
    if (tabParam === 'google') return 'google';
    return initialFilter === 'private' ? 'private' : 'all';
  });

  const [googleFilter, setGoogleFilter] = useState<'all' | 'pending' | 'published'>('all');
  const [privateSubFilter, setPrivateSubFilter] = useState<'needs_follow_up' | 'all' | 'contacted' | 'resolved' | 'archived'>('needs_follow_up');
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, string>>({});
  const [justApprovedId, setJustApprovedId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  useEffect(() => {
    if (tabParam === 'private' || tabParam === 'gated' || idParam) {
      setActiveTab('private');
    } else if (tabParam === 'google') {
      setActiveTab('google');
    }
  }, [tabParam, idParam]);

  // Merged private feedback dataset combining Supabase feedback table and low-star invites
  const privateFeedbackList = useMemo(() => {
    return computeMergedFeedback(invites, feedback);
  }, [invites, feedback]);

  // Google reviews strictly guarded by active place_id if configured
  const googleReviews = useMemo(() => {
    return reviews.filter((rev) => {
      if (profile.google_place_id && rev.place_id && rev.place_id !== profile.google_place_id) {
        return false;
      }
      return true;
    });
  }, [reviews, profile.google_place_id]);

  // Unified dataset combining Google reviews and Gated private feedback
  const allItems: UnifiedItem[] = useMemo(() => {
    const list: UnifiedItem[] = [];

    // 1. Google reviews
    googleReviews.forEach((rev) => {
      list.push({
        id: rev.id,
        type: 'google',
        author_name: rev.author_name,
        author_avatar: rev.author_avatar,
        rating: Number(rev.rating) || 5,
        text: rev.review_text || '',
        date: rev.review_date || new Date().toISOString(),
        status: rev.status,
        ai_draft_reply: rev.ai_draft_reply,
        published_reply: rev.published_reply,
        place_id: rev.place_id,
        original: rev,
      });
    });

    // 2. Private feedback items (never filtered out by Google place_id)
    privateFeedbackList.forEach((fb) => {
      const rating = Number(fb.rating_received) || Number(fb.rating) || 2;
      list.push({
        id: String(fb.id),
        type: 'private',
        author_name: fb.customer_name || 'Anonymous Customer',
        author_avatar: null,
        rating,
        text: fb.feedback_text || '(No written comments provided)',
        date: fb.review_received_at || fb.created_at || fb.sent_at || new Date().toISOString(),
        status: fb.status || fb.resolution_status || 'unresolved',
        resolution_status: fb.resolution_status || (fb.status === 'resolved' ? 'resolved' : 'needs_follow_up'),
        customer_phone: fb.customer_phone,
        customer_email: fb.customer_email,
        notes: fb.notes,
        original: fb,
      });
    });

    // Sort chronologically descending (newest first)
    return list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [googleReviews, privateFeedbackList]);

  // Filtered lists based on search query
  const displayedAllItems = useMemo(() => {
    let items = allItems;
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter((item) => {
        const nameMatch = item.author_name.toLowerCase().includes(q);
        const textMatch = item.text.toLowerCase().includes(q);
        const phoneMatch = item.customer_phone?.toLowerCase().includes(q);
        const emailMatch = item.customer_email?.toLowerCase().includes(q);
        const replyMatch = (item.ai_draft_reply || item.published_reply || '').toLowerCase().includes(q);
        return Boolean(nameMatch || textMatch || phoneMatch || emailMatch || replyMatch);
      });
    }
    return maxItems ? items.slice(0, maxItems) : items;
  }, [allItems, searchQuery, maxItems]);

  const displayedGoogleReviews = useMemo(() => {
    let items = googleReviews;
    if (googleFilter === 'pending') items = items.filter((r) => r.status === 'pending_approval');
    if (googleFilter === 'published') items = items.filter((r) => r.status === 'published');
    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      items = items.filter((rev) => {
        const nameMatch = rev.author_name.toLowerCase().includes(q);
        const textMatch = rev.review_text.toLowerCase().includes(q);
        const replyMatch = (rev.ai_draft_reply || rev.published_reply || '').toLowerCase().includes(q);
        return Boolean(nameMatch || textMatch || replyMatch);
      });
    }
    return maxItems ? items.slice(0, maxItems) : items;
  }, [googleReviews, googleFilter, searchQuery, maxItems]);

  if (!isConnected) {
    return (
      <div className="space-y-4">
        <div className="p-10 sm:p-14 bg-white rounded-2xl border border-slate-200 text-center flex flex-col items-center shadow-2xs">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Building className="w-6 h-6" />
          </div>
          <h3 className="text-base font-bold text-slate-900">No Business Connected</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-md leading-relaxed">
            Connect your Google Business profile to view reviews, sync ratings, and automate AI review replies.
          </p>
          <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5">
            <Link
              href="/dashboard/setup"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
            >
              Connect Google Business Profile →
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const handleApprove = async (id: string, text?: string) => {
    setJustApprovedId(id);
    const targetRev = reviews.find((r) => r.id === id);
    const finalReply = text !== undefined ? text : (reviewDrafts[id] ?? targetRev?.ai_draft_reply ?? '');
    await approveReview(id, finalReply);
    toast.success('Reply Published!', {
      description: 'The review reply was successfully approved and marked live.',
    });
    try {
      confetti({
        particleCount: 70,
        spread: 65,
        origin: { y: 0.7 },
        colors: ['#2563eb', '#10b981', '#fbbf24'],
      });
    } catch {
      // ignore
    }
    setTimeout(() => {
      setJustApprovedId(null);
    }, 1200);
  };

  const handleRegenerate = async (reviewOrId: any) => {
    const review = typeof reviewOrId === 'string' ? reviews.find((r) => r.id === reviewOrId) : reviewOrId;
    if (!review) return;
    setRegeneratingId(review.id);
    try {
      const res = await fetch('/api/reviews/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewerName: review.author_name,
          rating: review.rating,
          reviewText: review.review_text || review.text || '',
          businessName: activeBusiness?.name || 'My Business',
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate');
      }
      const generatedReply = data.reply || data.replyText;
      if (generatedReply) {
        setReviewDrafts((prev) => ({ ...prev, [review.id]: generatedReply }));
        updateDraftText(review.id, generatedReply);
        toast.success('AI reply generated!');
      }
    } catch (err: any) {
      console.error('Regenerate error:', err);
      toast.error('Could not generate AI reply', {
        description: err.message || 'Please check your Gemini API key configuration.',
      });
    } finally {
      setRegeneratingId(null);
    }
  };

  const handleSimulate = () => {
    setIsSimulating(true);
    simulateIncomingGoogleReview();
    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.5 },
        colors: ['#3b82f6', '#38bdf8'],
      });
    } catch {
      // ignore
    }
    setTimeout(() => {
      setIsSimulating(false);
      setGoogleFilter('pending');
      setActiveTab('google');
    }, 400);
  };

  const handleSyncGoogleReviews = async () => {
    setIsSyncing(true);
    try {
      const count = await syncGoogleReviews(profile.google_place_id);
      toast.success('Google Reviews Synced!', {
        description: count > 0
          ? `Successfully synced ${count} reviews from Google Places.`
          : 'Your Google reviews are up to date.',
      });
    } catch (err: any) {
      console.warn('Sync reviews error:', err);
    } finally {
      setIsSyncing(false);
    }
  };

  const handleTogglePrivateResolution = async (itemId: string, currentStatus?: string | null) => {
    const isCurrentlyResolved = currentStatus === 'resolved';
    const newResolution = isCurrentlyResolved ? 'needs_follow_up' : 'resolved';
    await updateInviteResolution(itemId, newResolution);

    if (isSupabaseConfigured && supabase && itemId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId)) {
      try {
        await Promise.allSettled([
          supabase.from('feedback').update({ status: isCurrentlyResolved ? 'unresolved' : 'resolved' }).eq('id', itemId),
          supabase.from('review_invites').update({ resolution_status: newResolution, status: isCurrentlyResolved ? 'unresolved' : 'resolved' }).eq('id', itemId),
        ]);
      } catch (err) {
        console.warn('Error updating status:', err);
      }
    }
    toast.success(isCurrentlyResolved ? 'Feedback Re-opened' : 'Feedback Marked Resolved!');
  };

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4">
      {/* Unified Feed Header Box */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        {/* Top Row: Left Title/Subtitle + Right 3-Way Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md transition-colors ${
                activeTab === 'private'
                  ? 'bg-slate-900 shadow-slate-900/20'
                  : activeTab === 'google'
                  ? 'bg-blue-600 shadow-blue-500/20'
                  : 'bg-indigo-600 shadow-indigo-500/20'
              }`}
            >
              {activeTab === 'private' ? (
                <ShieldAlert className="w-5 h-5 text-white" />
              ) : activeTab === 'google' ? (
                <Sparkles className="w-5 h-5 text-white" />
              ) : (
                <MessageSquareCheck className="w-5 h-5 text-white" />
              )}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {activeTab === 'private' ? (
                  <>
                    <span>Private Feedback Hub</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      Gated Private Reviews
                    </span>
                  </>
                ) : activeTab === 'google' ? (
                  <>
                    <span>Google Reviews Feed</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xs">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      Powered by Gemini
                    </span>
                  </>
                ) : (
                  <>
                    <span>All Reviews & Feedback</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                      Unified Feed
                    </span>
                  </>
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {activeTab === 'private'
                  ? 'Private 1–3 star ratings intercepted before reaching public Google listings.'
                  : activeTab === 'google'
                  ? 'Auto-syncs Google reviews & drafts local SEO keyword replies for 1-tap approval.'
                  : 'Chronological timeline of all customer reviews and intercepted private feedback.'}
              </p>
            </div>
          </div>

          {/* Right: Segmented 3-Tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setActiveTab('all')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>All Reviews ({allItems.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('google')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'google'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Google ({googleReviews.length})</span>
              {pendingReviewsCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-blue-100 text-blue-700">
                  {pendingReviewsCount}
                </span>
              )}
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('private')}
              className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'private'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
              <span>Gated Feedback ({privateFeedbackList.length})</span>
              {unresolvedFeedbackCount > 0 && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-rose-100 text-rose-700">
                  {unresolvedFeedbackCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Secondary Toolbar Row */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 min-h-[42px]">
          {activeTab === 'all' ? (
            <>
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="inline-flex items-center gap-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  {googleReviews.length} Public Google
                </span>
                <span>•</span>
                <span className="inline-flex items-center gap-1 font-medium">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  {privateFeedbackList.length} Gated Private
                </span>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleSyncGoogleReviews}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Google Reviews'}</span>
                </button>
                {showSimulateButton && isDemoMode && (
                  <button
                    onClick={handleSimulate}
                    disabled={isSimulating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-400" />
                    <span>{isSimulating ? 'Simulating...' : 'Simulate Review'}</span>
                  </button>
                )}
              </div>
            </>
          ) : activeTab === 'google' ? (
            <>
              {/* Google Sub-filters */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200/60 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setGoogleFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    googleFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({googleReviews.length})
                </button>
                <button
                  type="button"
                  onClick={() => setGoogleFilter('pending')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                    googleFilter === 'pending'
                      ? 'bg-blue-600 text-white font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Pending Approval</span>
                  {pendingReviewsCount > 0 && (
                    <span
                      className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                        googleFilter === 'pending' ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {pendingReviewsCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setGoogleFilter('published')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    googleFilter === 'published'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Published ({publishedReviewsCount})
                </button>
              </div>

              {/* Public Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSyncGoogleReviews}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 text-xs font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                  <span>{isSyncing ? 'Syncing...' : 'Sync Google Reviews'}</span>
                </button>
                {showSimulateButton && isDemoMode && (
                  <button
                    onClick={handleSimulate}
                    disabled={isSimulating}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium transition-all shadow-xs cursor-pointer disabled:opacity-50"
                  >
                    <Plus className="w-3.5 h-3.5 text-blue-400" />
                    <span>{isSimulating ? 'Simulating...' : 'Simulate Review'}</span>
                  </button>
                )}
              </div>
            </>
          ) : (
            <>
              {/* Private Sub-filters */}
              <div className="flex flex-wrap items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200/60 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => setPrivateSubFilter('needs_follow_up')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    privateSubFilter === 'needs_follow_up'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Needs Follow-up
                </button>
                <button
                  type="button"
                  onClick={() => setPrivateSubFilter('all')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    privateSubFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All
                </button>
                <button
                  type="button"
                  onClick={() => setPrivateSubFilter('contacted')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    privateSubFilter === 'contacted'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Contacted
                </button>
                <button
                  type="button"
                  onClick={() => setPrivateSubFilter('resolved')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    privateSubFilter === 'resolved'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Resolved
                </button>
                <button
                  type="button"
                  onClick={() => setPrivateSubFilter('archived')}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    privateSubFilter === 'archived'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  Archived
                </button>
              </div>

              <div className="text-xs text-slate-500 font-normal">
                Private submissions intercepted before Google Maps
              </div>
            </>
          )}
        </div>
      </div>

      {/* Main Tab Content */}
      {activeTab === 'private' ? (
        <PrivateFeedbackFeed
          liveFeedback={privateFeedbackList}
          highlightId={idParam || undefined}
          subFilter={privateSubFilter}
          onSubFilterChange={setPrivateSubFilter}
        />
      ) : activeTab === 'google' ? (
        displayedGoogleReviews.length === 0 ? (
          <div className="p-12 bg-white rounded-xl border border-slate-200 text-center flex flex-col items-center shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {googleReviews.length === 0 ? 'No Google reviews found yet.' : 'No Reviews to Display'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              {googleReviews.length === 0
                ? 'Start sending SMS/Email invites to generate your first reviews! Once reviews arrive on Google, they will appear here with AI response drafts ready for 1-tap approval.'
                : 'Zero reviews match the selected filter.'}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
              <Link
                href="/dashboard/invites"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                <span>Send Review Invite →</span>
              </Link>
              <button
                onClick={handleSyncGoogleReviews}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>{isSyncing ? 'Syncing...' : 'Sync Google Reviews'}</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Mobile View */}
            <div className="block md:hidden space-y-3">
              {displayedGoogleReviews.map((rev) => {
                const isJustApproved = justApprovedId === rev.id;
                const isPublished = rev.status === 'published';
                const isRegenerating = regeneratingId === rev.id;

                return (
                  <div key={rev.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-2.5 min-w-0">
                        <img
                          src={rev.author_avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face'}
                          alt={rev.author_name}
                          className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="text-xs font-bold text-slate-900 truncate">{rev.author_name}</div>
                          <div className="text-[11px] text-slate-400" suppressHydrationWarning>
                            {new Date(rev.review_date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </div>
                        </div>
                      </div>

                      <div className="inline-flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/80 shrink-0">
                        <div className="flex text-amber-500">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span className="text-[11px] font-bold text-amber-900">{rev.rating}.0</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-sm text-gray-700 leading-relaxed italic">&quot;{rev.review_text}&quot;</p>
                    </div>

                    <div className="bg-blue-50/60 border border-blue-100 rounded-lg p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span className="flex items-center gap-1 text-blue-600 font-bold">
                          <Bot className="w-3.5 h-3.5" />
                          {isPublished ? 'Published Reply:' : 'Gemini AI Reply Draft:'}
                        </span>
                        {!isPublished && (
                          <button
                            type="button"
                            onClick={() => handleRegenerate(rev.id)}
                            disabled={isRegenerating}
                            className="text-blue-600 hover:text-blue-700 active:text-blue-800 flex items-center gap-1 text-[11px] font-semibold cursor-pointer disabled:opacity-50 p-1"
                          >
                            <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                            <span>{isRegenerating ? 'Drafting...' : '↻ Regenerate'}</span>
                          </button>
                        )}
                      </div>

                      {isPublished ? (
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {rev.published_reply || rev.ai_draft_reply || 'No draft generated yet.'}
                        </p>
                      ) : (
                        <textarea
                          value={reviewDrafts[rev.id] ?? rev.ai_draft_reply ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setReviewDrafts((prev) => ({ ...prev, [rev.id]: val }));
                            updateDraftText(rev.id, val);
                          }}
                          rows={3}
                          className="w-full resize-y rounded-md border border-blue-200 bg-white/90 p-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                          placeholder="Type or tweak your reply..."
                        />
                      )}
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-100">
                      <div>
                        {isPublished ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Live on Google
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                            <Clock className="w-3 h-3 text-blue-600" />
                            Awaiting 1-Tap
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {!isPublished && (
                          <button
                            onClick={() => handleApprove(rev.id, reviewDrafts[rev.id] ?? rev.ai_draft_reply ?? '')}
                            disabled={isJustApproved}
                            className="min-h-[42px] px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all active:scale-95 flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            {isJustApproved ? (
                              <>
                                <Check className="w-4 h-4" />
                                <span>Approved!</span>
                              </>
                            ) : (
                              <>
                                <Sparkles className="w-4 h-4" />
                                <span>Approve</span>
                              </>
                            )}
                          </button>
                        )}
                        {isPublished && (
                          <a
                            href={`https://search.google.com/local/reviews?placeid=${profile.google_place_id || ''}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="min-h-[42px] inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-xl border border-slate-200 transition-colors"
                          >
                            <span>View on Google</span>
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-500 uppercase text-xs font-semibold border-b border-slate-200">
                      <th className="px-4 py-3">Customer / Reviewer</th>
                      <th className="px-4 py-3">Rating</th>
                      <th className="px-4 py-3">Review & Gemini AI Reply</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm">
                    {displayedGoogleReviews.map((rev) => {
                      const isJustApproved = justApprovedId === rev.id;
                      const isPublished = rev.status === 'published';
                      const isRegenerating = regeneratingId === rev.id;

                      return (
                        <tr
                          key={rev.id}
                          className="bg-white hover:bg-slate-50/50 text-slate-700 border-b border-slate-100 transition-colors"
                        >
                          <td className="px-4 py-3 align-top min-w-[160px]">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={rev.author_avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face'}
                                alt={rev.author_name}
                                className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                              />
                              <div className="truncate">
                                <div className="text-xs font-bold text-slate-900 truncate">{rev.author_name}</div>
                                <div className="text-[11px] text-slate-400 truncate" suppressHydrationWarning>
                                  {new Date(rev.review_date).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 align-top whitespace-nowrap">
                            <div className="inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80">
                              <div className="flex text-amber-500">
                                {[...Array(5)].map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`w-3 h-3 ${
                                      i < rev.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-[11px] font-bold text-amber-900">{rev.rating}.0</span>
                            </div>
                          </td>

                          <td className="px-4 py-3 align-top max-w-md">
                            <div className="space-y-2">
                              <p className="text-xs text-slate-800 leading-relaxed italic">&quot;{rev.review_text}&quot;</p>
                              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs space-y-1.5">
                                <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                                  <span className="flex items-center gap-1 text-blue-600">
                                    <Bot className="w-3.5 h-3.5" />
                                    {isPublished ? 'Published Reply:' : 'Gemini AI Reply Draft:'}
                                  </span>
                                  {!isPublished && (
                                    <button
                                      type="button"
                                      onClick={() => handleRegenerate(rev.id)}
                                      disabled={isRegenerating}
                                      className="text-slate-400 hover:text-blue-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-[10px] cursor-pointer"
                                    >
                                      <RefreshCw className={`w-2.5 h-2.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                                      <span>{isRegenerating ? 'Drafting...' : '↻ Regenerate'}</span>
                                    </button>
                                  )}
                                </div>

                                {isPublished ? (
                                  <p className="text-[11px] text-slate-600 leading-normal">
                                    {rev.published_reply || rev.ai_draft_reply || 'No draft generated yet.'}
                                  </p>
                                ) : (
                                  <textarea
                                    value={reviewDrafts[rev.id] ?? rev.ai_draft_reply ?? ''}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setReviewDrafts((prev) => ({ ...prev, [rev.id]: val }));
                                      updateDraftText(rev.id, val);
                                    }}
                                    rows={2}
                                    className="w-full resize-y rounded-md border border-blue-200 bg-white/90 p-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                                    placeholder="Type or tweak your reply..."
                                  />
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="px-4 py-3 align-top whitespace-nowrap">
                            {isPublished ? (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                                <Check className="w-3 h-3 text-emerald-600" />
                                Live on Google
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                                <Clock className="w-3 h-3 text-blue-600" />
                                Awaiting 1-Tap
                              </span>
                            )}
                          </td>

                          <td className="px-4 py-3 align-top text-right whitespace-nowrap">
                            <div className="flex items-center justify-end gap-1.5">
                              {!isPublished && (
                                <button
                                  onClick={() => handleApprove(rev.id, reviewDrafts[rev.id] ?? rev.ai_draft_reply ?? '')}
                                  disabled={isJustApproved}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 cursor-pointer"
                                >
                                  {isJustApproved ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Approved!</span>
                                    </>
                                  ) : (
                                    <>
                                      <Sparkles className="w-3.5 h-3.5" />
                                      <span>Approve</span>
                                    </>
                                  )}
                                </button>
                              )}
                              {isPublished && (
                                <a
                                  href={`https://search.google.com/local/reviews?placeid=${profile.google_place_id || ''}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-slate-500 hover:text-blue-600 hover:bg-slate-50 rounded-lg transition-colors"
                                >
                                  <span>View</span>
                                  <ExternalLink className="w-3 h-3" />
                                </a>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )
      ) : (
        /* Unified "All Reviews" Tab View (Google Reviews + Gated Private Feedback) */
        displayedAllItems.length === 0 ? (
          <div className="p-12 bg-white rounded-xl border border-slate-200 text-center flex flex-col items-center shadow-sm space-y-3">
            <div className="w-12 h-12 rounded-full bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <MessageSquareCheck className="w-6 h-6" />
            </div>
            <h3 className="text-sm font-bold text-slate-900">
              {allItems.length === 0 ? 'No customer reviews or feedback recorded yet.' : 'No Matching Reviews or Feedback'}
            </h3>
            <p className="text-xs text-slate-500 max-w-md leading-relaxed">
              {allItems.length === 0
                ? 'Send review invites via SMS or email! 4-5 star ratings route directly to Google, while 1-3 star ratings are intercepted here as private feedback.'
                : 'Zero items match your search filter.'}
            </p>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2.5">
              <Link
                href="/dashboard/invites"
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer"
              >
                <span>Send Review Invite →</span>
              </Link>
              <button
                onClick={handleSyncGoogleReviews}
                disabled={isSyncing}
                className="inline-flex items-center gap-1.5 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
                <span>Sync Google Reviews</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {displayedAllItems.map((item) => {
              const isPrivate = item.type === 'private';
              const isGoogle = item.type === 'google';
              const isResolved = item.resolution_status === 'resolved' || item.status === 'resolved';
              const isContacted = item.status === 'contacted' || item.resolution_status === 'contacted';
              const isPublished = item.status === 'published';
              const isJustApproved = justApprovedId === item.id;
              const isRegenerating = regeneratingId === item.id;

              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className={`bg-white rounded-2xl border p-5 shadow-2xs space-y-3.5 transition-all ${
                    isPrivate
                      ? isResolved
                        ? 'border-slate-200 bg-slate-50/30'
                        : 'border-amber-200/90 bg-gradient-to-r from-amber-50/20 via-white to-white'
                      : 'border-slate-200'
                  }`}
                >
                  {/* Item Header Row */}
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="flex items-start gap-3 min-w-0">
                      {isPrivate ? (
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-700 border border-amber-300/60 flex items-center justify-center shrink-0">
                          <ShieldAlert className="w-5 h-5 text-amber-600" />
                        </div>
                      ) : (
                        <img
                          src={item.author_avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face'}
                          alt={item.author_name}
                          className="w-10 h-10 rounded-xl object-cover ring-1 ring-slate-200 shrink-0"
                        />
                      )}

                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="text-sm font-bold text-slate-900 truncate">
                            {item.author_name}
                          </h4>

                          {/* Demarcation Badges */}
                          {isPrivate ? (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-900 border border-amber-300/80 shadow-2xs">
                              <ShieldAlert className="w-3 h-3 text-amber-700" />
                              Private Feedback
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200/80">
                              <Sparkles className="w-3 h-3 text-blue-600" />
                              Google Review
                            </span>
                          )}

                          {isPrivate && isResolved && (
                            <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                              Resolved
                            </span>
                          )}
                          {isPrivate && isContacted && !isResolved && (
                            <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">
                              Contacted
                            </span>
                          )}
                          {isPrivate && !isContacted && !isResolved && (
                            <span className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-700 border border-rose-200 text-[10px] font-semibold">
                              Needs Follow-up
                            </span>
                          )}

                          {isGoogle && isPublished && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                              <Check className="w-3 h-3 text-emerald-600" />
                              Live on Google
                            </span>
                          )}
                          {isGoogle && !isPublished && (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">
                              <Clock className="w-3 h-3 text-blue-600" />
                              Awaiting 1-Tap
                            </span>
                          )}
                        </div>

                        {/* Sub-meta: Date + Contact details for private feedback */}
                        <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                          <span suppressHydrationWarning>
                            {new Date(item.date).toLocaleDateString(undefined, {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                            })}
                          </span>

                          {isPrivate && item.customer_phone && (
                            <a
                              href={`tel:${item.customer_phone}`}
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium transition"
                            >
                              <Phone className="w-3 h-3" />
                              <span>{item.customer_phone}</span>
                            </a>
                          )}

                          {isPrivate && item.customer_email && (
                            <a
                              href={`mailto:${item.customer_email}`}
                              className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 font-medium transition"
                            >
                              <Mail className="w-3 h-3" />
                              <span>{item.customer_email}</span>
                            </a>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Right: Star Rating Pill + Quick Actions */}
                    <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
                      <div
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border font-bold text-xs ${
                          isPrivate
                            ? 'bg-amber-50 text-amber-900 border-amber-200/80'
                            : 'bg-amber-50 text-amber-900 border-amber-200/80'
                        }`}
                      >
                        <div className="flex items-center gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3.5 h-3.5 ${
                                i < item.rating
                                  ? isPrivate
                                    ? 'fill-amber-400 text-amber-500'
                                    : 'fill-amber-400 text-amber-400'
                                  : 'text-slate-200'
                              }`}
                            />
                          ))}
                        </div>
                        <span>{item.rating}.0</span>
                      </div>

                      {isPrivate ? (
                        <div className="flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleTogglePrivateResolution(item.id, item.resolution_status)}
                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1 ${
                              isResolved
                                ? 'bg-white hover:bg-slate-50 text-slate-700 border border-slate-300'
                                : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                            }`}
                          >
                            <Check className="w-3.5 h-3.5" />
                            <span>{isResolved ? 'Re-open' : 'Mark Resolved'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setActiveTab('private');
                            }}
                            className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold shadow-xs transition cursor-pointer flex items-center gap-1"
                          >
                            <span>Manage in Hub →</span>
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {!isPublished && (
                            <button
                              onClick={() => handleApprove(item.id, reviewDrafts[item.id] ?? item.ai_draft_reply ?? '')}
                              disabled={isJustApproved}
                              className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95 flex items-center gap-1 cursor-pointer"
                            >
                              {isJustApproved ? (
                                <>
                                  <Check className="w-3.5 h-3.5" />
                                  <span>Approved!</span>
                                </>
                              ) : (
                                <>
                                  <Sparkles className="w-3.5 h-3.5" />
                                  <span>1-Tap Approve</span>
                                </>
                              )}
                            </button>
                          )}
                          {isPublished && (
                            <a
                              href={`https://search.google.com/local/reviews?placeid=${profile.google_place_id || ''}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-semibold text-slate-600 hover:text-blue-600 hover:bg-slate-50 rounded-lg border border-slate-200 transition-colors"
                            >
                              <span>View on Google</span>
                              <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Customer Review / Feedback Quote */}
                  <div
                    className={`p-3.5 rounded-xl border text-xs leading-relaxed italic ${
                      isPrivate
                        ? 'bg-amber-50/30 border-amber-200/50 text-slate-800'
                        : 'bg-slate-50 border-slate-200 text-slate-800'
                    }`}
                  >
                    &quot;{item.text}&quot;
                  </div>

                  {/* Gemini AI Reply Draft for Google Reviews */}
                  {isGoogle && (
                    <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 space-y-1.5">
                      <div className="flex items-center justify-between text-[11px] font-semibold text-slate-600">
                        <span className="flex items-center gap-1 text-blue-600 font-bold">
                          <Bot className="w-3.5 h-3.5" />
                          {isPublished ? 'Published Reply:' : 'Gemini AI Reply Draft:'}
                        </span>
                        {!isPublished && (
                          <button
                            type="button"
                            onClick={() => handleRegenerate(item.id)}
                            disabled={isRegenerating}
                            className="text-blue-600 hover:text-blue-700 flex items-center gap-1 text-[11px] font-semibold cursor-pointer disabled:opacity-50 p-1"
                          >
                            <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                            <span>{isRegenerating ? 'Drafting...' : '↻ Regenerate'}</span>
                          </button>
                        )}
                      </div>

                      {isPublished ? (
                        <p className="text-xs text-slate-700 leading-relaxed">
                          {item.published_reply || item.ai_draft_reply || 'No draft generated yet.'}
                        </p>
                      ) : (
                        <textarea
                          value={reviewDrafts[item.id] ?? item.ai_draft_reply ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setReviewDrafts((prev) => ({ ...prev, [item.id]: val }));
                            updateDraftText(item.id, val);
                          }}
                          rows={2}
                          className="w-full resize-y rounded-md border border-blue-200 bg-white/90 p-2 text-xs text-slate-800 focus:border-blue-500 focus:bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 leading-relaxed"
                          placeholder="Type or tweak your reply..."
                        />
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
}
