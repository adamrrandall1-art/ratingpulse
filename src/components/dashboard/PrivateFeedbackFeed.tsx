'use client';

import React, { useState, useEffect } from 'react';
import {
  Star,
  Phone,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert
} from 'lucide-react';
import { useRatingPulseStore, isLowStarOrFeedback } from '@/lib/store';
import { Invite } from '@/lib/supabase/types';

export default function PrivateFeedbackFeed() {
  const { invites, updateInviteResolution, searchQuery, unresolvedFeedbackCount } = useRatingPulseStore();
  const [filter, setFilter] = useState<'needs_follow_up' | 'all' | 'resolved'>('needs_follow_up');

  // Filter for invites that have private feedback or low ratings
  const feedbackItems = invites.filter((inv: Invite) => {
    if (!isLowStarOrFeedback(inv)) return false;

    const isResolved = inv.resolution_status === 'resolved' || inv.status === 'resolved';

    // Apply resolution filter
    if (filter === 'needs_follow_up') {
      // Include any record where rating <= 3 and it is not explicitly marked as resolved or archived
      return !isResolved && inv.status !== 'archived';
    }
    if (filter === 'resolved') {
      return isResolved;
    }
    return true; // 'all' tab shows all records with rating <= 3 regardless of status
  }).filter((inv: Invite) => {
    // Apply global dashboard search query filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = inv.customer_name?.toLowerCase().includes(q);
    const phoneMatch = inv.customer_phone?.toLowerCase().includes(q);
    const emailMatch = inv.customer_email?.toLowerCase().includes(q);
    const textMatch = inv.feedback_text?.toLowerCase().includes(q);
    return Boolean(nameMatch || phoneMatch || emailMatch || textMatch);
  });

  useEffect(() => {
    console.log('Feedback Query Results:', feedbackItems);
  }, [feedbackItems]);

  return (
    <div className="bg-white rounded-2xl border-2 border-rose-100 shadow-sm overflow-hidden">
      
      {/* Urgent Header */}
      <div className="p-6 bg-gradient-to-r from-rose-50/90 via-red-50/50 to-white border-b border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-rose-600/20">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>⚠️ Urgent Customer Inquiries & Low-Star Feedback</span>
            </h2>

            {unresolvedFeedbackCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-extrabold bg-rose-600 text-white shadow-xs animate-pulse">
                [ {unresolvedFeedbackCount} Needs Attention ]
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                [ All Resolved ]
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-slate-600 mt-1.5">
            Direct feedback from customers rating 1–3 stars. Immediate follow-up recommended to resolve issues quickly.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-white border border-rose-200/80 rounded-xl text-xs font-bold self-start sm:self-auto shadow-2xs">
          <button
            type="button"
            onClick={() => setFilter('needs_follow_up')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'needs_follow_up'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-rose-600'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>Needs Follow-up</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-rose-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All Feedback
          </button>
          <button
            type="button"
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'resolved'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-emerald-600'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>Resolved</span>
          </button>
        </div>
      </div>

      {/* Feedback List Body */}
      {feedbackItems.length === 0 ? (
        <div className="p-10 text-center space-y-3 bg-slate-50/50">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-800">
            All clear. No urgent customer issues pending resolution.
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your customer feedback monitor is active. Any 1–3 star ratings will alert you here immediately for direct follow-up.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 bg-white">
          {feedbackItems.map((item) => {
            const rawRating = item.rating_received !== undefined && item.rating_received !== null ? item.rating_received : (item as any).rating;
            const rating = Number(rawRating) || 2;
            const isResolved = item.resolution_status === 'resolved' || item.status === 'resolved';
            const customerName = item.customer_name || (item as any).name || 'Valued Customer';
            const customerPhone = item.customer_phone || (item as any).phone;
            const customerEmail = item.customer_email || (item as any).email || (customerPhone?.includes('@') ? customerPhone : undefined);
            const feedbackText = item.feedback_text || (item as any).feedback || (item as any).notes;
            const dateStr = item.review_received_at || item.sent_at || (item as any).created_at || (item as any).updated_at || new Date().toISOString();

            return (
              <div
                key={item.id}
                className={`p-5 sm:p-6 transition-colors space-y-3.5 ${
                  isResolved
                    ? 'bg-slate-50/50 hover:bg-slate-50'
                    : 'bg-rose-50/20 hover:bg-rose-50/40'
                }`}
              >
                
                {/* Top Row: Customer info, rating badge & resolution status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Star Rating Badge */}
                    <div className={`px-3 py-1 rounded-xl font-extrabold text-xs flex items-center gap-1.5 border shadow-2xs ${
                      rating <= 2
                        ? 'bg-rose-600 text-white border-rose-700'
                        : rating === 3
                        ? 'bg-amber-500 text-white border-amber-600'
                        : 'bg-emerald-600 text-white border-emerald-700'
                    }`}>
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{rating}.0 / 5 Stars</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>{customerName}</span>
                        {!isResolved && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {item.service_type || 'Customer Inquiry'} • {new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Resolution Action Pill */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {isResolved ? (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Resolved</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-rose-100 text-rose-800 border border-rose-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-600" />
                        <span>Action Required</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => updateInviteResolution(item.id, isResolved ? 'needs_follow_up' : 'resolved')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs ${
                        isResolved
                          ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                      }`}
                    >
                      {isResolved ? 'Re-open' : '✓ Mark as Resolved'}
                    </button>
                  </div>
                </div>

                {/* Feedback Quote Block */}
                <div className={`p-4 rounded-xl border text-xs leading-relaxed font-medium ${
                  isResolved
                    ? 'bg-slate-100/70 border-slate-200 text-slate-600'
                    : 'bg-white border-rose-200 text-slate-800 shadow-2xs'
                }`}>
                  <p className="italic">
                    &quot;{feedbackText || 'Customer left a low-star rating on the review gate without additional comment text.'}&quot;
                  </p>
                </div>

                {/* Direct Action Contact Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1 text-xs">
                  {customerPhone && !customerPhone.includes('@') && (
                    <a
                      href={`tel:${customerPhone}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-xs transform active:scale-95"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Customer Now ({customerPhone})</span>
                    </a>
                  )}

                  {customerEmail && (
                    <a
                      href={`mailto:${customerEmail}?subject=Urgent: Following up on your recent visit with our team`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-xs transform active:scale-95"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Customer ({customerEmail})</span>
                    </a>
                  )}

                  <span className="text-[11px] text-slate-400 ml-auto hidden sm:inline">
                    Direct low-star review gate interception
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}