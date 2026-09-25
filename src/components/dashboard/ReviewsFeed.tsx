'use client';

import React, { useState } from 'react';
import Link from 'next/link';
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
  ChevronRight,
  Zap,
  Building
} from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';
import confetti from 'canvas-confetti';

interface Props {
  initialFilter?: 'all' | 'pending' | 'published';
  showSimulateButton?: boolean;
  maxItems?: number;
}

export default function ReviewsFeed({
  initialFilter = 'all',
  showSimulateButton = true,
  maxItems,
}: Props) {
  const {
    profile,
    reviews,
    approveReview,
    regenerateAiReply,
    updateDraftText,
    simulateIncomingGoogleReview,
    syncGoogleReviews,
    pendingReviewsCount,
    publishedReviewsCount,
    toggleDemoMode,
    searchQuery,
  } = useRatingPulseStore();

  const isConnected = Boolean(
    profile.google_place_id &&
    profile.google_place_id.trim() !== '' &&
    profile.google_connected !== false
  );

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'published'>(initialFilter);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState<string>('');
  const [justApprovedId, setJustApprovedId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

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
    await approveReview(id, text);
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
      setEditingId(null);
    }, 1200);
  };

  const handleRegenerate = async (id: string) => {
    setRegeneratingId(id);
    await regenerateAiReply(id);
    setTimeout(() => {
      setRegeneratingId(null);
    }, 450);
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
      setStatusFilter('pending');
    }, 400);
  };

  const handleSyncGoogleReviews = async () => {
    setIsSyncing(true);
    try {
      const count = await syncGoogleReviews();
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
    <div className="space-y-4">
      
      {/* Header & Filter Controls */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/20">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              Incoming Google Reviews Feed
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-2xs">
                <Sparkles className="w-3 h-3 text-amber-300" />
                Powered by Gemini
              </span>
            </h2>
            <p className="text-xs text-slate-500">
              Auto-syncs Google reviews & drafts local SEO keyword replies for 1-tap approval.
            </p>
          </div>
        </div>

        {/* Right Actions: Filter Tabs + Sync + Simulate Review */}
        <div className="flex flex-wrap items-center gap-2">
          
          {/* Status Tabs */}
          <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All ({reviews.length})
            </button>
            <button
              onClick={() => setStatusFilter('pending')}
              className={`px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                statusFilter === 'pending'
                  ? 'bg-blue-600 text-white shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Pending Approval
              {pendingReviewsCount > 0 && (
                <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                  statusFilter === 'pending' ? 'bg-blue-800 text-white' : 'bg-blue-100 text-blue-800'
                }`}>
                  {pendingReviewsCount}
                </span>
              )}
            </button>
            <button
              onClick={() => setStatusFilter('published')}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                statusFilter === 'published'
                  ? 'bg-white text-slate-900 shadow-2xs font-bold'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Published ({publishedReviewsCount})
            </button>
          </div>

          {/* Sync Google Reviews Button */}
          <button
            onClick={handleSyncGoogleReviews}
            disabled={isSyncing}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 text-xs font-bold transition-all shadow-xs transform active:scale-95 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            <span>{isSyncing ? 'Syncing...' : 'Sync Google Reviews'}</span>
          </button>

          {/* Simulate New Google Review Button */}
          {showSimulateButton && (
            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>{isSimulating ? 'Simulating...' : 'Simulate Review'}</span>
            </button>
          )}

        </div>

      </div>      {/* Reviews Table Layout */}
      {displayedReviews.length === 0 ? (
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
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
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
                  const isEditing = editingId === rev.id;
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
                                  className="text-slate-400 hover:text-blue-600 flex items-center gap-1 text-[10px] cursor-pointer"
                                >
                                  <RefreshCw className={`w-2.5 h-2.5 ${isRegenerating ? 'animate-spin' : ''}`} />
                                  <span>Regenerate</span>
                                </button>
                              )}
                            </div>

                            {isEditing ? (
                              <div className="space-y-1.5">
                                <textarea
                                  value={editedText}
                                  onChange={(e) => setEditedText(e.target.value)}
                                  rows={2}
                                  className="w-full p-2 text-xs rounded border border-blue-300 focus:outline-none focus:ring-1 focus:ring-blue-500 bg-white text-slate-900"
                                />
                                <div className="flex items-center justify-end gap-1.5">
                                  <button
                                    onClick={() => setEditingId(null)}
                                    className="px-2 py-0.5 text-[10px] font-medium text-slate-500 hover:bg-slate-200 rounded"
                                  >
                                    Cancel
                                  </button>
                                  <button
                                    onClick={() => handleApprove(rev.id, editedText)}
                                    className="px-2 py-0.5 text-[10px] font-bold text-white bg-blue-600 hover:bg-blue-700 rounded"
                                  >
                                    Save & Publish
                                  </button>
                                </div>
                              </div>
                            ) : (
                              <p className="text-[11px] text-slate-600 leading-normal">
                                {rev.published_reply || rev.ai_draft_reply || 'No draft generated yet.'}
                              </p>
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
                            <>
                              <button
                                onClick={() => {
                                  setEditingId(rev.id);
                                  setEditedText(rev.ai_draft_reply || '');
                                }}
                                className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-600 transition-colors"
                                title="Edit reply text"
                              >
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleApprove(rev.id)}
                                disabled={isJustApproved}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all active:scale-95"
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
                            </>
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
      )}

    </div>
  );
}
