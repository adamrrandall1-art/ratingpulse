'use client';

import React, { useState, useEffect } from 'react';
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
  Building
} from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';
import { Review } from '@/lib/supabase/types';
import PrivateFeedbackFeed from './PrivateFeedbackFeed';
import confetti from 'canvas-confetti';
import { toast } from 'sonner';

interface Props {
  initialFilter?: 'all' | 'pending' | 'published' | 'private';
  showSimulateButton?: boolean;
  maxItems?: number;
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
    approveReview,
    regenerateAiReply,
    updateDraftText,
    simulateIncomingGoogleReview,
    syncGoogleReviews,
    pendingReviewsCount,
    publishedReviewsCount,
    privateFeedbackCount,
    unresolvedFeedbackCount,
    toggleDemoMode,
    searchQuery,
  } = useRatingPulseStore();

  const isConnected = Boolean(
    profile.google_place_id &&
    profile.google_place_id.trim() !== '' &&
    profile.google_connected !== false
  );

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'published' | 'private'>(
    tabParam === 'private' || tabParam === 'gated' ? 'private' : initialFilter
  );
  const [publicFilter, setPublicFilter] = useState<'all' | 'pending' | 'published'>('all');
  const [privateSubFilter, setPrivateSubFilter] = useState<'needs_follow_up' | 'all' | 'contacted' | 'resolved' | 'archived'>('needs_follow_up');
  const [reviewDrafts, setReviewDrafts] = useState<Record<string, string>>({});
  const [justApprovedId, setJustApprovedId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

  useEffect(() => {
    if (tabParam === 'private' || tabParam === 'gated' || idParam) {
      setStatusFilter('private');
    }
  }, [tabParam, idParam]);

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

  const filteredReviews = reviews.filter((rev) => {
    // Strict active place_id guard: if profile.google_place_id is set, only show reviews for this active place
    if (profile.google_place_id && rev.place_id && rev.place_id !== profile.google_place_id) {
      return false;
    }

    if (statusFilter === 'pending' && rev.status !== 'pending_approval') return false;
    if (statusFilter === 'published' && rev.status !== 'published') return false;

    if (searchQuery && searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const nameMatch = rev.author_name.toLowerCase().includes(q);
      const textMatch = rev.review_text.toLowerCase().includes(q);
      const replyMatch = (rev.ai_draft_reply || rev.published_reply || '').toLowerCase().includes(q);
      if (!nameMatch && !textMatch && !replyMatch) return false;
    }

    return true;
  });

  const displayedReviews = maxItems ? filteredReviews.slice(0, maxItems) : filteredReviews;

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
        colors: ['#2563eb', '#10b981', '#fbbf24']
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
          businessName: activeBusiness?.name || "RatingPulse"
        })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Failed to generate');
      }
      const generatedReply = data.reply || data.replyText;
      if (generatedReply) {
        setReviewDrafts(prev => ({ ...prev, [review.id]: generatedReply }));
        updateDraftText(review.id, generatedReply);
        toast.success('AI reply generated!');
      }
    } catch (err: any) {
      console.error("Regenerate error:", err);
      toast.error('Could not generate AI reply', {
        description: err.message || 'Please check your Gemini API key configuration.',
      });
    } finally {
      setRegeneratingId(null); // Always unlock the spinner
    }
  };

  const handleSimulate = () => {
    setIsSimulating(true);
    const newRev = simulateIncomingGoogleReview();
    try {
      confetti({
        particleCount: 40,
        spread: 50,
        origin: { y: 0.5 },
        colors: ['#3b82f6', '#38bdf8']
      });
    } catch {
      // ignore
    }
    setTimeout(() => {
      setIsSimulating(false);
      setPublicFilter('pending');
      setStatusFilter('pending');
    }, 400);
  };

  const handleSyncGoogleReviews = async () => {
    setIsSyncing(true);
    try {
      const count = await syncGoogleReviews(profile.google_place_id);
      const { toast } = await import('sonner');
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

  return (
    <div className="w-full max-w-full overflow-x-hidden space-y-4">
      
      {/* Unified Feed Header Box */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
        
        {/* Top Row: Left Title/Subtitle + Right Tab Switcher */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shadow-md transition-colors ${
              statusFilter === 'private' ? 'bg-slate-900 shadow-slate-900/20' : 'bg-blue-600 shadow-blue-500/20'
            }`}>
              {statusFilter === 'private' ? <ShieldAlert className="w-5 h-5 text-white" /> : <Sparkles className="w-5 h-5 text-white" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                {statusFilter === 'private' ? (
                  <>
                    <span>Private Feedback Hub</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700 border border-slate-200">
                      Gated Private Reviews
                    </span>
                  </>
                ) : (
                  <>
                    <span>Google Reviews Feed</span>
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xs">
                      <Sparkles className="w-3 h-3 text-amber-300" />
                      Powered by Gemini
                    </span>
                  </>
                )}
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                {statusFilter === 'private'
                  ? 'Private 1–3 star ratings intercepted before reaching public Google listings.'
                  : 'Auto-syncs Google reviews & drafts local SEO keyword replies for 1-tap approval.'}
              </p>
            </div>
          </div>

          {/* Right: Segmented Tab Switcher */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
            <button
              type="button"
              onClick={() => setStatusFilter(publicFilter)}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter !== 'private'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <span>Google Reviews ({reviews.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setStatusFilter('private')}
              className={`px-3.5 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
                statusFilter === 'private'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <ShieldAlert className="w-3.5 h-3.5 text-slate-500" />
              <span>Gated Feedback ({privateFeedbackCount || unresolvedFeedbackCount || 0})</span>
              {(privateFeedbackCount > 0 || unresolvedFeedbackCount > 0) && (
                <span className="text-[10px] px-1.5 py-0.2 rounded-full font-bold bg-slate-200 text-slate-700">
                  {privateFeedbackCount || unresolvedFeedbackCount}
                </span>
              )}
            </button>
          </div>
        </div>

        {/* Secondary Toolbar Row */}
        <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 min-h-[42px]">
          {statusFilter !== 'private' ? (
            <>
              {/* Public Sub-filters */}
              <div className="flex items-center gap-1 bg-slate-50 p-1 rounded-lg border border-slate-200/60 text-xs font-medium">
                <button
                  type="button"
                  onClick={() => {
                    setPublicFilter('all');
                    setStatusFilter('all');
                  }}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    statusFilter === 'all'
                      ? 'bg-white text-slate-900 shadow-2xs font-bold'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  All ({reviews.length})
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPublicFilter('pending');
                    setStatusFilter('pending');
                  }}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1.5 ${
                    statusFilter === 'pending'
                      ? 'bg-blue-600 text-white font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <span>Pending Approval</span>
                  {pendingReviewsCount > 0 && (
                    <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                      statusFilter === 'pending' ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {pendingReviewsCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPublicFilter('published');
                    setStatusFilter('published');
                  }}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    statusFilter === 'published'
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
                {showSimulateButton && (
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
      {statusFilter === 'private' ? (
        <PrivateFeedbackFeed
          highlightId={idParam || undefined}
          subFilter={privateSubFilter}
          onSubFilterChange={setPrivateSubFilter}
        />
      ) : displayedReviews.length === 0 ? (
        <div className="p-12 bg-white rounded-xl border border-slate-200 text-center flex flex-col items-center shadow-sm">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Reviews to Display</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            {reviews.length === 0
              ? 'Click below to sync Google reviews for your connected business listing.'
              : 'Zero reviews match the selected filter.'}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={handleSyncGoogleReviews}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing...' : 'Sync Google Reviews'}
            </button>
            {showSimulateButton && (
              <button
                onClick={handleSimulate}
                disabled={isSimulating}
                className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-bold transition-colors shadow-sm cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5 text-blue-400" />
                {isSimulating ? 'Simulating...' : 'Simulate Review'}
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          
          {/* MOBILE VIEW: Stacked Responsive Cards (< 768px: block md:hidden) */}
          <div className="block md:hidden space-y-3">
            {displayedReviews.map((rev) => {
              const isJustApproved = justApprovedId === rev.id;
              const isPublished = rev.status === 'published';
              const isRegenerating = regeneratingId === rev.id;

              return (
                <div
                  key={rev.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm space-y-3"
                >
                  {/* Header Row: Customer avatar + Name + Date on left; Star rating pill on right */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2.5 min-w-0">
                      <img
                        src={rev.author_avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face'}
                        alt={rev.author_name}
                        className="w-9 h-9 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <div className="text-xs font-bold text-slate-900 truncate">
                          {rev.author_name}
                        </div>
                        <div className="text-[11px] text-slate-400" suppressHydrationWarning>
                          {new Date(rev.review_date).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                          })}
                        </div>
                      </div>
                    </div>

                    {/* Star Rating Pill */}
                    <div className="inline-flex items-center gap-1 bg-amber-50 px-2 py-1 rounded-lg border border-amber-200/80 shrink-0">
                      <div className="flex text-amber-500">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-3 h-3 ${
                              i < rev.rating
                                ? 'fill-amber-400 text-amber-400'
                                : 'text-slate-200'
                            }`}
                          />
                        ))}
                      </div>
                      <span className="text-[11px] font-bold text-amber-900">
                        {rev.rating}.0
                      </span>
                    </div>
                  </div>

                  {/* Body Row: Full italicized customer review text */}
                  <div>
                    <p className="text-sm text-gray-700 leading-relaxed italic">
                      &quot;{rev.review_text}&quot;
                    </p>
                  </div>

                  {/* AI Draft Box: Light blue rounded container */}
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

                  {/* Bottom Action Bar */}
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

          {/* DESKTOP VIEW: Multi-column Data Table (>= 768px: hidden md:block) */}
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
                  {displayedReviews.map((rev) => {
                    const isJustApproved = justApprovedId === rev.id;
                    const isPublished = rev.status === 'published';
                    const isRegenerating = regeneratingId === rev.id;

                    return (
                      <tr
                        key={rev.id}
                        className="bg-white hover:bg-slate-50/50 text-slate-700 border-b border-slate-100 transition-colors"
                      >
                        {/* Customer / Reviewer */}
                        <td className="px-4 py-3 align-top min-w-[160px]">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={rev.author_avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face'}
                              alt={rev.author_name}
                              className="w-8 h-8 rounded-full object-cover ring-1 ring-slate-200 shrink-0"
                            />
                            <div className="truncate">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {rev.author_name}
                              </div>
                              <div className="text-[11px] text-slate-400 truncate" suppressHydrationWarning>
                                {new Date(rev.review_date).toLocaleDateString()}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Star Rating */}
                        <td className="px-4 py-3 align-top whitespace-nowrap">
                          <div className="inline-flex items-center gap-1 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/80">
                            <div className="flex text-amber-500">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`w-3 h-3 ${
                                    i < rev.rating
                                      ? 'fill-amber-400 text-amber-400'
                                      : 'text-slate-200'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-[11px] font-bold text-amber-900">
                              {rev.rating}.0
                            </span>
                          </div>
                        </td>

                        {/* Review & Gemini AI Reply */}
                        <td className="px-4 py-3 align-top max-w-md">
                          <div className="space-y-2">
                            {/* Review Text */}
                            <p className="text-xs text-slate-800 leading-relaxed italic">
                              &quot;{rev.review_text}&quot;
                            </p>

                            {/* AI Reply Box */}
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

                        {/* Status */}
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

                        {/* Actions */}
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
      )}

    </div>
  );
}
