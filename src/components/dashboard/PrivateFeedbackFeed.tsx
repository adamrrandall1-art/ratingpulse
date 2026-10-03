'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Star,
  Phone,
  Mail,
  CheckCircle2,
  AlertTriangle,
  Clock,
  ShieldAlert,
  Archive,
  PhoneCall,
  MessageSquare,
  Send,
  Sparkles,
  Check
} from 'lucide-react';
import { useRatingPulseStore, isLowStarOrFeedback } from '@/lib/store';
import { supabase, isSupabaseConfigured } from '@/lib/supabase/client';
import { Invite } from '@/lib/supabase/types';

interface PrivateFeedbackFeedProps {
  liveFeedback?: any[];
  highlightId?: string;
  onFeedbackUpdated?: () => void;
}

export default function PrivateFeedbackFeed({
  liveFeedback = [],
  highlightId,
  onFeedbackUpdated,
}: PrivateFeedbackFeedProps) {
  const { profile, invites, updateInviteResolution, searchQuery } = useRatingPulseStore();
  const [filter, setFilter] = useState<'needs_follow_up' | 'all' | 'contacted' | 'resolved' | 'archived'>('needs_follow_up');
  const [supabaseFeedback, setSupabaseFeedback] = useState<any[]>(liveFeedback);
  const [activeHighlightId, setActiveHighlightId] = useState<string | null>(highlightId || null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});
  const [savedNotes, setSavedNotes] = useState<Record<string, string>>({});
  const [contactedItems, setContactedItems] = useState<Record<string, boolean>>({});
  const [archivedItems, setArchivedItems] = useState<Record<string, boolean>>({});
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // 1. Fetch live feedback rows from Supabase
  useEffect(() => {
    async function fetchSupabaseFeedback() {
      if (!isSupabaseConfigured || !supabase) return;
      try {
        let query = supabase.from('feedback').select('*').order('created_at', { ascending: false });
        if (profile.id && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(profile.id)) {
          query = query.or(`user_id.eq.${profile.id},business_id.eq.${profile.id}`);
        }
        const { data, error } = await query;
        if (!error && data) {
          setSupabaseFeedback(data);
        }
      } catch (err) {
        console.warn('Error fetching private feedback from Supabase:', err);
      }
    }

    fetchSupabaseFeedback();
  }, [profile.id]);

  // Sync highlightId prop
  useEffect(() => {
    if (highlightId) {
      setActiveHighlightId(highlightId);
      // Auto-switch to "all" if the item might be resolved or archived
      setFilter('all');
    }
  }, [highlightId]);

  // Auto-scroll to highlighted item
  useEffect(() => {
    if (activeHighlightId && itemRefs.current[activeHighlightId]) {
      setTimeout(() => {
        itemRefs.current[activeHighlightId]?.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
        });
      }, 200);
    }
  }, [activeHighlightId, supabaseFeedback, invites]);

  // Merge store invites and live feedback items from Supabase
  const mergedItems = React.useMemo(() => {
    const inviteItems = invites.filter((inv: Invite) => isLowStarOrFeedback(inv));

    // Map live feedback items into unified format
    const formattedLiveItems = supabaseFeedback.map((f: any) => ({
      id: f.id,
      user_id: f.user_id,
      business_id: f.business_id,
      customer_name: f.customer_name || 'Anonymous Customer',
      customer_phone: f.customer_phone || '',
      customer_email: f.customer_email || '',
      service_type: 'Private Feedback Gate',
      status: f.status || 'unresolved',
      resolution_status: f.status === 'resolved' ? 'resolved' : 'needs_follow_up',
      rating_received: Number(f.rating) || 2,
      rating: Number(f.rating) || 2,
      feedback_text: f.feedback_text || '',
      notes: f.notes || '',
      created_at: f.created_at || new Date().toISOString(),
      sent_at: f.created_at || new Date().toISOString(),
      review_received_at: f.created_at || new Date().toISOString(),
    }));

    // Deduplicate by ID
    const map = new Map<string, any>();
    formattedLiveItems.forEach((item) => map.set(item.id, item));
    inviteItems.forEach((item) => {
      if (!map.has(item.id)) map.set(item.id, item);
    });

    return Array.from(map.values()).sort((a, b) => {
      const tA = new Date(a.review_received_at || a.created_at || a.sent_at || 0).getTime();
      const tB = new Date(b.review_received_at || b.created_at || b.sent_at || 0).getTime();
      return tB - tA;
    });
  }, [invites, supabaseFeedback]);

  // Filter feedback items by status and search query
  const feedbackItems = mergedItems.filter((item: any) => {
    const isArchived = archivedItems[item.id] || item.status === 'archived' || item.resolution_status === 'archived';
    const isResolved = item.resolution_status === 'resolved' || item.status === 'resolved';
    const isContacted = contactedItems[item.id] || item.status === 'contacted' || item.resolution_status === 'contacted';

    if (filter === 'archived') return isArchived;
    if (isArchived && filter !== 'all') return false;

    if (filter === 'needs_follow_up') {
      return !isResolved && !isArchived;
    }
    if (filter === 'contacted') {
      return isContacted && !isResolved && !isArchived;
    }
    if (filter === 'resolved') {
      return isResolved;
    }
    return true; // 'all' tab shows all records
  }).filter((item: any) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const nameMatch = item.customer_name?.toLowerCase().includes(q);
    const phoneMatch = item.customer_phone?.toLowerCase().includes(q);
    const emailMatch = item.customer_email?.toLowerCase().includes(q);
    const textMatch = item.feedback_text?.toLowerCase().includes(q);
    return Boolean(nameMatch || phoneMatch || emailMatch || textMatch);
  });

  const activeUnresolvedCount = mergedItems.filter(
    (item: any) => item.status !== 'resolved' && item.resolution_status !== 'resolved' && item.status !== 'archived' && !archivedItems[item.id]
  ).length;

  const handleToggleResolution = async (itemId: string, newResolution: 'needs_follow_up' | 'resolved') => {
    updateInviteResolution(itemId, newResolution);

    // Update in local state
    setSupabaseFeedback((prev) =>
      prev.map((f) => (f.id === itemId ? { ...f, status: newResolution === 'resolved' ? 'resolved' : 'unresolved' } : f))
    );

    if (isSupabaseConfigured && supabase && itemId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId)) {
      try {
        await Promise.allSettled([
          supabase.from('feedback').update({ status: newResolution === 'resolved' ? 'resolved' : 'unresolved' }).eq('id', itemId),
          supabase.from('review_invites').update({ resolution_status: newResolution, status: newResolution === 'resolved' ? 'resolved' : 'unresolved' }).eq('id', itemId),
        ]);
      } catch (err) {
        console.warn('Error updating feedback status in database:', err);
      }
    }
    onFeedbackUpdated?.();
  };

  const handleToggleContacted = async (itemId: string) => {
    const isNowContacted = !contactedItems[itemId];
    setContactedItems((prev) => ({ ...prev, [itemId]: isNowContacted }));

    if (isSupabaseConfigured && supabase && itemId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId)) {
      try {
        await Promise.allSettled([
          supabase.from('feedback').update({ status: isNowContacted ? 'contacted' : 'unresolved' }).eq('id', itemId),
          supabase.from('review_invites').update({ resolution_status: isNowContacted ? 'contacted' : 'needs_follow_up' }).eq('id', itemId),
        ]);
      } catch (err) {
        console.warn('Error updating contacted status:', err);
      }
    }
  };

  const handleToggleArchive = async (itemId: string) => {
    const isNowArchived = !archivedItems[itemId];
    setArchivedItems((prev) => ({ ...prev, [itemId]: isNowArchived }));

    if (isSupabaseConfigured && supabase && itemId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId)) {
      try {
        await Promise.allSettled([
          supabase.from('feedback').update({ status: isNowArchived ? 'archived' : 'unresolved' }).eq('id', itemId),
          supabase.from('review_invites').update({ status: isNowArchived ? 'archived' : 'feedback_submitted' }).eq('id', itemId),
        ]);
      } catch (err) {
        console.warn('Error archiving item:', err);
      }
    }
  };

  const handleSaveNote = async (itemId: string) => {
    const noteText = noteInputs[itemId];
    if (noteText === undefined) return;

    setSavedNotes((prev) => ({ ...prev, [itemId]: noteText }));

    if (isSupabaseConfigured && supabase && itemId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(itemId)) {
      try {
        await supabase.from('feedback').update({ notes: noteText }).eq('id', itemId);
      } catch (err) {
        console.warn('Error saving note to feedback record:', err);
      }
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-rose-200/80 shadow-sm overflow-hidden space-y-0">
      
      {/* Urgent Header */}
      <div className="p-5 sm:p-6 bg-gradient-to-r from-rose-50/90 via-red-50/40 to-white border-b border-rose-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-rose-600 text-white flex items-center justify-center font-bold text-sm shadow-md shadow-rose-600/20">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h2 className="text-base font-extrabold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Private Feedback & Low-Star Interception</span>
            </h2>

            {activeUnresolvedCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-3 py-0.5 rounded-full text-xs font-extrabold bg-rose-600 text-white shadow-xs animate-pulse">
                [ {activeUnresolvedCount} Needs Attention ]
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                [ All Resolved ]
              </span>
            )}
          </div>
          <p className="text-xs font-medium text-slate-600 mt-1.5">
            Direct customer feedback from 1–3 star submissions intercepted before reaching public Google listings.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-1 p-1 bg-white border border-rose-200/80 rounded-xl text-xs font-bold self-start sm:self-auto shadow-2xs">
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
            All ({mergedItems.length})
          </button>
          <button
            type="button"
            onClick={() => setFilter('contacted')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'contacted'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-blue-600'
            }`}
          >
            <PhoneCall className="w-3.5 h-3.5" />
            <span>Contacted</span>
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
          <button
            type="button"
            onClick={() => setFilter('archived')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'archived'
                ? 'bg-slate-800 text-white shadow-xs'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Archived</span>
          </button>
        </div>
      </div>

      {/* Feedback List Body */}
      {feedbackItems.length === 0 ? (
        <div className="p-10 sm:p-14 text-center space-y-3 bg-slate-50/50">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto text-xl font-bold border border-emerald-200">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-sm font-extrabold text-slate-800">
            No private feedback found in this filter.
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When customers leave 1–3 star ratings on your review gate, their comments appear here immediately for private follow-up.
          </p>
        </div>
      ) : (
        <div className="divide-y divide-slate-100 bg-white">
          {feedbackItems.map((item) => {
            const rawRating = item.rating_received !== undefined && item.rating_received !== null ? item.rating_received : item.rating;
            const rating = Number(rawRating) || 2;
            const isResolved = item.resolution_status === 'resolved' || item.status === 'resolved';
            const isContacted = contactedItems[item.id] || item.status === 'contacted' || item.resolution_status === 'contacted';
            const isArchived = archivedItems[item.id] || item.status === 'archived' || item.resolution_status === 'archived';
            const isHighlighted = activeHighlightId === item.id;
            const customerName = item.customer_name || 'Valued Customer';
            const customerPhone = item.customer_phone;
            const customerEmail = item.customer_email || (customerPhone?.includes('@') ? customerPhone : undefined);
            const feedbackText = item.feedback_text;
            const dateStr = item.review_received_at || item.sent_at || item.created_at || new Date().toISOString();
            const currentNote = noteInputs[item.id] !== undefined ? noteInputs[item.id] : (savedNotes[item.id] || item.notes || '');

            return (
              <div
                key={item.id}
                ref={(el) => { itemRefs.current[item.id] = el; }}
                id={`feedback-${item.id}`}
                className={`p-5 sm:p-6 transition-all space-y-4 ${
                  isHighlighted
                    ? 'ring-4 ring-rose-500/80 bg-rose-50/80 shadow-md'
                    : isResolved
                    ? 'bg-slate-50/40 hover:bg-slate-50/80'
                    : 'bg-rose-50/15 hover:bg-rose-50/30'
                }`}
              >
                {/* Highlight Alert Banner if deep linked */}
                {isHighlighted && (
                  <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-bold shadow-xs">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                      Direct Alert Link Selected ({item.customer_name})
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveHighlightId(null)}
                      className="text-white/80 hover:text-white text-[11px] underline cursor-pointer"
                    >
                      Dismiss Highlight
                    </button>
                  </div>
                )}

                {/* Top Row: Customer info, rating badge & resolution status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    {/* Star Rating Badge */}
                    <div className={`px-3 py-1 rounded-xl font-extrabold text-xs flex items-center gap-1.5 border shadow-2xs ${
                      rating <= 1
                        ? 'bg-rose-600 text-white border-rose-700'
                        : rating === 2
                        ? 'bg-orange-600 text-white border-orange-700'
                        : 'bg-amber-500 text-white border-amber-600'
                    }`}>
                      <Star className="w-3.5 h-3.5 fill-current" />
                      <span>{rating}.0 / 5 Stars</span>
                    </div>

                    <div>
                      <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                        <span>{customerName}</span>
                        {!isResolved && !isArchived && (
                          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                        )}
                        {isContacted && !isResolved && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 text-[10px] font-bold">
                            Contacted
                          </span>
                        )}
                      </h4>
                      <p className="text-[11px] text-slate-500">
                        {item.service_type || 'Private Feedback Gate'} • {new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                      </p>
                    </div>
                  </div>

                  {/* Resolution Actions Bar */}
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => handleToggleContacted(item.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 border shadow-2xs ${
                        isContacted
                          ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{isContacted ? 'Contacted ✓' : 'Mark Contacted'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleResolution(item.id, isResolved ? 'needs_follow_up' : 'resolved')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-2xs flex items-center gap-1 ${
                        isResolved
                          ? 'bg-slate-200 hover:bg-slate-300 text-slate-800'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isResolved ? 'Re-open' : 'Mark as Resolved'}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleToggleArchive(item.id)}
                      title={isArchived ? 'Unarchive feedback' : 'Archive feedback'}
                      className={`p-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer border ${
                        isArchived
                          ? 'bg-slate-800 text-white border-slate-900'
                          : 'bg-white text-slate-400 hover:text-slate-700 border-slate-200'
                      }`}
                    >
                      <Archive className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* Customer Feedback Quote Block */}
                <div className={`p-4 rounded-xl border text-xs leading-relaxed font-medium ${
                  isResolved
                    ? 'bg-slate-100/70 border-slate-200 text-slate-600'
                    : 'bg-white border-rose-200 text-slate-800 shadow-2xs'
                }`}>
                  <p className="italic">
                    &quot;{feedbackText || 'Customer submitted a low-star rating on the review gate without providing detailed text.'}&quot;
                  </p>
                </div>

                {/* Direct Action Contact Buttons */}
                <div className="flex flex-wrap items-center gap-2.5 text-xs">
                  {customerPhone && !customerPhone.includes('@') && (
                    <a
                      href={`tel:${customerPhone}`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-700 text-white font-bold transition-all shadow-xs transform active:scale-95"
                    >
                      <Phone className="w-3.5 h-3.5" />
                      <span>Call Customer ({customerPhone})</span>
                    </a>
                  )}

                  {customerEmail && (
                    <a
                      href={`mailto:${customerEmail}?subject=Following up on your recent experience with our team`}
                      className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold transition-all shadow-xs transform active:scale-95"
                    >
                      <Mail className="w-3.5 h-3.5" />
                      <span>Email Customer ({customerEmail})</span>
                    </a>
                  )}

                  <span className="text-[11px] text-slate-400 ml-auto hidden sm:inline">
                    Intercepted before public review posting
                  </span>
                </div>

                {/* Internal Notes / Direct Follow-up Field */}
                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Add internal resolution note or log call summary..."
                      value={currentNote}
                      onChange={(e) => setNoteInputs((prev) => ({ ...prev, [item.id]: e.target.value }))}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') {
                          handleSaveNote(item.id);
                        }
                      }}
                      className="w-full text-xs px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSaveNote(item.id)}
                    className="px-3.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                  >
                    <MessageSquare className="w-3 h-3" />
                    <span>Save Note</span>
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}