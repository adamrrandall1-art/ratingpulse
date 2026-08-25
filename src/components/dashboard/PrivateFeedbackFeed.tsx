'use client';

import React, { useState } from 'react';
import {
  ShieldAlert,
  Star,
  Phone,
  Mail,
  CheckCircle2,
  AlertTriangle
} from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';

export default function PrivateFeedbackFeed() {
  const { invites, updateInviteResolution, searchQuery } = useRatingPulseStore();
  const [filter, setFilter] = useState<'all' | 'needs_follow_up' | 'resolved'>('all');

  // Filter for invites that have private feedback or low ratings
  const feedbackItems = invites.filter((inv) => {
    const hasFeedback = Boolean(inv.feedback_text || (inv.rating_received && inv.rating_received <= 3));
    if (!hasFeedback) return false;

    // Apply resolution filter
    if (filter === 'needs_follow_up') {
      return inv.resolution_status === 'needs_follow_up' || (!inv.resolution_status && (inv.rating_received ?? 0) <= 3);
    }
    if (filter === 'resolved') {
      return inv.resolution_status === 'resolved';
    }
    return true;
  }).filter((inv) => {
    // Apply global dashboard search query filter
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = inv.customer_name?.toLowerCase().includes(q);
    const phoneMatch = inv.customer_phone?.toLowerCase().includes(q);
    const emailMatch = inv.customer_email?.toLowerCase().includes(q);
    const textMatch = inv.feedback_text?.toLowerCase().includes(q);
    return Boolean(nameMatch || phoneMatch || emailMatch || textMatch);
  });

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              Private Customer Feedback
            </h2>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200">
              Protected Shield
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Ratings of 1-3 stars intercepted privately on your review gate. These are <strong>never</strong> posted to your public Google Business Profile.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            All
          </button>
          <button
            type="button"
            onClick={() => setFilter('needs_follow_up')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'needs_follow_up'
                ? 'bg-white text-amber-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <AlertTriangle className="w-3 h-3 text-amber-500" />
            <span>Needs Follow-up</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'resolved'
                ? 'bg-white text-emerald-700 shadow-xs'
                : 'text-slate-500 hover:text-slate-900'
            }`}
          >
            <CheckCircle2 className="w-3 h-3 text-emerald-500" />
            <span>Resolved</span>
          </button>
        </div>
      </div>

      {/* Feedback List Body */}
      {feedbackItems.length === 0 ? (
        <div className="p-10 text-center space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-400 flex items-center justify-center mx-auto text-xl">
            Shield
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            No private feedback received yet.
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Your review protection shield is fully active. Any 1-3 star ratings will be intercepted privately here so you can address issues before they hit Google.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {feedbackItems.map((item) => {
            const rating = item.rating_received || 2;
            const isResolved = item.resolution_status === 'resolved';

            return (
              <div key={item.id} className="p-5 sm:p-6 hover:bg-slate-50/70 transition-colors space-y-3.5">
                
                {/* Top Row: Customer info, rating badge & resolution status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                  <div className="flex items-center gap-3">
                    {/* Star Rating Badge */}
                    <div className={`px-2.5 py-1 rounded-xl font-bold text-xs flex items-center gap-1 border ${
                      rating <= 2
                        ? 'bg-rose-50 border-rose-200 text-rose-700'
                        : rating === 3
                        ? 'bg-amber-50 border-amber-200 text-amber-700'
                        : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                    }`}>
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{rating}.0 Stars</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900">
                        {item.customer_name}
                      </h4>
                      <p className="text-[11px] text-slate-400">
                        {item.service_type || 'General Visit'} • {new Date(item.sent_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Resolution Status Dropdown / Action */}
                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {isResolved ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Resolved</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        <span>Needs Follow-up</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => updateInviteResolution(item.id, isResolved ? 'needs_follow_up' : 'resolved')}
                      className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                    >
                      {isResolved ? 'Re-open' : 'Mark Resolved'}
                    </button>
                  </div>
                </div>

                {/* Feedback Message */}
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 text-xs text-slate-700 leading-relaxed italic">
                  &quot;{item.feedback_text || 'No comment text was provided with this rating.'}&quot;
                </div>

                {/* Customer Contact Action Buttons */}
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  {item.customer_phone && !item.customer_phone.includes('@') && (
                    <a
                      href={`tel:${item.customer_phone}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold transition-colors"
                    >
                      <Phone className="w-3 h-3" />
                      <span>Call {item.customer_phone}</span>
                    </a>
                  )}

                  {(item.customer_email || (item.customer_phone && item.customer_phone.includes('@'))) && (
                    <a
                      href={`mailto:${item.customer_email || item.customer_phone}?subject=Following up on your visit with our team`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold transition-colors"
                    >
                      <Mail className="w-3 h-3" />
                      <span>Email {item.customer_email || item.customer_phone}</span>
                    </a>
                  )}

                  <span className="text-[11px] text-slate-400 ml-auto">
                    Intercepted securely via Review Gate
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