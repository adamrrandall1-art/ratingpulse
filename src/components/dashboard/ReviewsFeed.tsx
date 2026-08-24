'use client';

import React, { useState } from 'react';
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
  Zap
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
    reviews,
    approveReview,
    regenerateAiReply,
    updateDraftText,
    simulateIncomingGoogleReview,
    pendingReviewsCount,
    publishedReviewsCount,
    toggleDemoMode,
    searchQuery,
  } = useRatingPulseStore();

  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'published'>(initialFilter);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editedText, setEditedText] = useState<string>('');
  const [justApprovedId, setJustApprovedId] = useState<string | null>(null);
  const [isSimulating, setIsSimulating] = useState(false);
  const [regeneratingId, setRegeneratingId] = useState<string | null>(null);

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

        {/* Right Actions: Filter Tabs + Simulate Review */}
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

          {/* Simulate New Google Review Button */}
          {showSimulateButton && (
            <button
              onClick={handleSimulate}
              disabled={isSimulating}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-all shadow-xs transform active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Plus className="w-3.5 h-3.5 text-blue-400" />
              <span>{isSimulating ? 'Syncing...' : 'Simulate Google Review'}</span>
            </button>
          )}

        </div>

      </div>

      {/* Reviews Stream */}
      {displayedReviews.length === 0 ? (
        <div className="p-12 bg-white rounded-2xl border border-slate-200 text-center flex flex-col items-center">
          <div className="w-12 h-12 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mb-3">
            <Sparkles className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-bold text-slate-900">No Reviews to Display</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm">
            {reviews.length === 0
              ? 'Enable Demo Mode in the header or click below to populate realistic Google reviews and AI drafts.'
              : 'Zero reviews match the selected filter.'}
          </p>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
            <button
              onClick={handleSimulate}
              className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Simulate Incoming Google Review
            </button>
            <button
              onClick={() => toggleDemoMode(true)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              <Zap className="w-3.5 h-3.5" />
              Populate Demo Reviews
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {displayedReviews.map((rev) => {
            const isEditing = editingId === rev.id;
            const isJustApproved = justApprovedId === rev.id;
            const isPublished = rev.status === 'published';
            const isRegenerating = regeneratingId === rev.id;

            return (
              <div
                key={rev.id}
                className={`bg-white rounded-2xl border p-5 sm:p-6 shadow-2xs space-y-4 transition-all duration-200 ${
                  isPublished
                    ? 'border-slate-200/90'
                    : 'border-blue-200 ring-1 ring-blue-500/10'
                }`}
              >
                {/* Review Header: Author, Badge, Stars, Date */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  
                  <div className="flex items-center gap-3">
                    <img
                      src={rev.author_avatar || 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face'}
                      alt={rev.author_name}
                      className="w-11 h-11 rounded-full object-cover ring-2 ring-slate-100"
                    />
                    <div>
                      <div className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        {rev.author_name}
                        {isPublished ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.2 rounded-full flex items-center gap-1">
                            <Check className="w-3 h-3 text-emerald-600" />
                            Live on Google
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.2 rounded-full animate-pulse">
                            Awaiting 1-Tap Approval
                          </span>
                        )}
                      </div>

                      <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                        <span className="text-slate-600 font-medium flex items-center gap-1">
                          <ShieldCheck className="w-3 h-3 text-blue-600" /> Google Verified
                        </span>
                        <span>•</span>
                        <span suppressHydrationWarning>
                          {new Date(rev.review_date).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Star Rating Display */}
                  <div className="flex items-center gap-1 bg-amber-50/80 px-2.5 py-1 rounded-xl border border-amber-200/60 w-fit">
                    <div className="flex items-center gap-0.5">
                      {[...Array(rev.rating)].map((_, i) => (
                        <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <span className="text-xs font-bold text-amber-700 ml-1">
                      {rev.rating}.0
                    </span>
                  </div>

                </div>

                {/* Customer Review Quote */}
                <div className="p-3.5 rounded-xl bg-slate-50/80 border border-slate-100 text-xs sm:text-sm text-slate-700 leading-relaxed italic">
                  &quot;{rev.review_text}&quot;
                </div>

                {/* Gemini AI Reply Drafting Box */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/80 to-indigo-50/60 border border-blue-200 space-y-2.5">
                  
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5 font-bold text-blue-950">
                      <span className="p-1 rounded-lg bg-blue-600 text-white">
                        <Bot className="w-3.5 h-3.5" />
                      </span>
                      <span>{isPublished ? 'Live Google Reply' : 'Gemini AI Drafted SEO Reply'}</span>
                    </div>

                    {!isPublished && (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleRegenerate(rev.id)}
                          disabled={isRegenerating}
                          className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                        >
                          <RefreshCw className={`w-3 h-3 ${isRegenerating ? 'animate-spin' : ''}`} />
                          {isRegenerating ? 'Drafting...' : 'Regenerate'}
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(rev.id);
                            setEditedText(rev.ai_draft_reply);
                          }}
                          className="text-[11px] font-semibold text-slate-600 hover:text-slate-800 flex items-center gap-1 transition-colors"
                        >
                          <Edit3 className="w-3 h-3" />
                          Edit Reply
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Reply Content */}
                  {isEditing ? (
                    <div className="space-y-2 pt-1">
                      <textarea
                        value={editedText}
                        onChange={(e) => setEditedText(e.target.value)}
                        rows={3}
                        className="w-full p-3 rounded-xl border border-blue-300 text-xs text-slate-800 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => setEditingId(null)}
                          className="px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-blue-100/50 rounded-lg"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => {
                            updateDraftText(rev.id, editedText);
                            setEditingId(null);
                          }}
                          className="px-3.5 py-1.5 text-xs font-bold bg-blue-600 text-white rounded-lg shadow-xs"
                        >
                          Save Draft
                        </button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs sm:text-sm text-slate-800 leading-relaxed font-sans">
                      {isPublished ? rev.published_reply : rev.ai_draft_reply}
                    </p>
                  )}

                  {/* Local SEO Injected Keywords Strip */}
                  {rev.keywords_used && rev.keywords_used.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1.5 pt-1 text-[10px] text-blue-800">
                      <span className="font-semibold text-slate-500">Gemini SEO Keywords:</span>
                      {rev.keywords_used.map((kw, i) => (
                        <span key={i} className="bg-blue-100/90 text-blue-800 px-2 py-0.5 rounded-md font-bold">
                          #{kw}
                        </span>
                      ))}
                    </div>
                  )}

                </div>

                {/* 1-Tap Action Button */}
                <div>
                  {isPublished ? (
                    <div className="flex items-center justify-between text-xs text-slate-500 pt-1">
                      <span className="flex items-center gap-1.5 text-emerald-600 font-bold">
                        <CheckCircle2 className="w-4 h-4" />
                        Published & Synced to Google Business Profile
                      </span>
                      <span className="text-[11px] text-slate-400">Response active on Google Maps</span>
                    </div>
                  ) : isJustApproved ? (
                    <div className="w-full py-3 rounded-xl bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center gap-2 animate-pulse">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      Approved & Synced to Google Business Profile!
                    </div>
                  ) : (
                    <button
                      onClick={() => handleApprove(rev.id, isEditing ? editedText : undefined)}
                      className="w-full py-3 px-5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 transition-all transform active:scale-98 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4 text-amber-300" />
                      <span>Approve AI Reply</span>
                      <span className="text-[11px] font-medium text-blue-200">
                        • 1-Tap Publish to Google Profile
                      </span>
                    </button>
                  )}
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
