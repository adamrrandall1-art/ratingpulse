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
  Trash2,
  Archive,
  PhoneCall,
  MessageSquare,
  Sparkles,
  Check,
  Edit2
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
  const [expandedNoteIds, setExpandedNoteIds] = useState<Record<string, boolean>>({});
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

  // Merge store invites and live feedback items from Supabase with robust deduplication
  const mergedItems = React.useMemo(() => {
    const inviteItems = invites.filter((inv: Invite) => isLowStarOrFeedback(inv));
    const map = new Map<string, any>();

    // 1. Process Supabase feedback records
    supabaseFeedback.forEach((f: any) => {
      const id = String(f.id);
      map.set(id, {
        id,
        user_id: f.user_id,
        business_id: f.business_id,
        customer_name: f.customer_name || 'Anonymous Customer',
        customer_phone: f.customer_phone || '',
        customer_email: f.customer_email || '',
        service_type: 'Private Feedback Gate',
        status: f.status || 'unresolved',
        resolution_status: f.status === 'resolved' ? 'resolved' : (f.status === 'contacted' ? 'contacted' : 'needs_follow_up'),
        rating_received: Number(f.rating) || 2,
        rating: Number(f.rating) || 2,
        feedback_text: f.feedback_text || '',
        notes: f.notes || '',
        created_at: f.created_at || new Date().toISOString(),
        sent_at: f.created_at || new Date().toISOString(),
        review_received_at: f.created_at || new Date().toISOString(),
      });
    });

    // 2. Process store invites with low rating / feedback text
    inviteItems.forEach((inv: Invite) => {
      const id = String(inv.id);
      if (!map.has(id)) {
        const alreadyExists = Array.from(map.values()).some(
          (existing) =>
            existing.feedback_text &&
            inv.feedback_text &&
            existing.feedback_text === inv.feedback_text &&
            existing.customer_name === inv.customer_name
        );
        if (!alreadyExists) {
          map.set(id, {
            ...inv,
            id,
            rating_received: Number(inv.rating_received) || Number((inv as any).rating) || 2,
            rating: Number(inv.rating_received) || Number((inv as any).rating) || 2,
            notes: (inv as any).notes || '',
          });
        }
      }
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
    <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden space-y-0">
      
      {/* Refined Header */}
      <div className="p-5 bg-white border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 flex-wrap">
            <div className="w-8 h-8 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-sm border border-rose-100">
              <ShieldAlert className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-1.5">
              <span>Private Feedback & Gated Inquiries</span>
            </h2>

            {activeUnresolvedCount > 0 ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
                {activeUnresolvedCount} Needs Attention
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                All Resolved
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Private 1–3 star ratings intercepted before reaching public Google listings.
          </p>
        </div>

        {/* Filter Tabs - Clean Segmented Control */}
        <div className="flex flex-wrap items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setFilter('needs_follow_up')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'needs_follow_up'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Needs Follow-up</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
              filter === 'all'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
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
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Contacted</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('resolved')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'resolved'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <span>Resolved</span>
          </button>
          <button
            type="button"
            onClick={() => setFilter('archived')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              filter === 'archived'
                ? 'bg-white text-slate-900 shadow-2xs font-bold'
                : 'text-slate-500 hover:text-slate-800'
            }`}
          >
            <span>Archived</span>
          </button>
        </div>
      </div>

      {/* Feedback List Body */}
      {feedbackItems.length === 0 ? (
        <div className="p-10 sm:p-14 text-center space-y-3 bg-slate-50/50">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 text-slate-500 flex items-center justify-center mx-auto text-xl font-bold border border-slate-200">
            <CheckCircle2 className="w-6 h-6 text-emerald-600" />
          </div>
          <h3 className="text-sm font-bold text-slate-800">
            No private feedback in this view.
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            When customers leave 1–3 star ratings on your review gate, their submissions appear here for private follow-up.
          </p>
        </div>
      ) : (
        <div className="p-4 sm:p-5 space-y-3 bg-slate-50/40">
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
            const isNoteExpanded = Boolean(expandedNoteIds[item.id]);

            return (
              <div
                key={item.id}
                ref={(el) => { itemRefs.current[item.id] = el; }}
                id={`feedback-${item.id}`}
                className={`rounded-xl border bg-white p-5 shadow-sm space-y-3 transition-all ${
                  isHighlighted
                    ? 'ring-2 ring-rose-400 border-rose-300 bg-rose-50/30'
                    : isResolved
                    ? 'border-slate-200 bg-slate-50/40'
                    : 'border-slate-200'
                }`}
              >
                {/* Highlight Alert Banner if deep linked */}
                {isHighlighted && (
                  <div className="flex items-center justify-between gap-2 px-3 py-1.5 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                    <span className="flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-rose-600" />
                      Selected from Alert Notification ({customerName})
                    </span>
                    <button
                      type="button"
                      onClick={() => setActiveHighlightId(null)}
                      className="text-rose-600 hover:text-rose-900 text-[11px] underline cursor-pointer"
                    >
                      Dismiss
                    </button>
                  </div>
                )}

                {/* Card Header Row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  
                  {/* Left: Customer Info & Star Badge */}
                  <div className="flex items-start gap-3 min-w-0">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                      <div className="flex items-center gap-0.5">
                        {[...Array(rating)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 fill-rose-500 text-rose-500" />
                        ))}
                      </div>
                      <span>{rating}.0 Star</span>
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-bold text-slate-900 truncate">
                          {customerName}
                        </h4>
                        {isContacted && !isResolved && (
                          <span className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-200 text-[10px] font-semibold">
                            Contacted
                          </span>
                        )}
                        {isResolved && (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-semibold">
                            Resolved
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mt-0.5">
                        <span>{new Date(dateStr).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        <span>•</span>
                        <span>Intercepted before Google Maps</span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Compact Action Row */}
                  <div className="flex flex-wrap items-center gap-2 self-start sm:self-auto shrink-0">
                    {/* Call Customer Button */}
                    {customerPhone && !customerPhone.includes('@') && (
                      <a
                        href={`tel:${customerPhone}`}
                        className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors font-medium"
                        title={`Call ${customerPhone}`}
                      >
                        <Phone className="w-3.5 h-3.5 text-slate-500" />
                        <span>Call</span>
                      </a>
                    )}

                    {/* Email Customer Button */}
                    {customerEmail && (
                      <a
                        href={`mailto:${customerEmail}?subject=Following up on your recent experience with our team`}
                        className="border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors font-medium"
                        title={`Email ${customerEmail}`}
                      >
                        <Mail className="w-3.5 h-3.5 text-slate-500" />
                        <span>Email</span>
                      </a>
                    )}

                    {/* Mark Contacted Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleContacted(item.id)}
                      className={`text-xs px-3 py-1.5 rounded-lg transition-colors font-medium flex items-center gap-1.5 cursor-pointer ${
                        isContacted
                          ? 'bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100'
                          : 'border border-slate-200 hover:bg-slate-50 text-slate-700'
                      }`}
                    >
                      <PhoneCall className="w-3.5 h-3.5" />
                      <span>{isContacted ? 'Contacted ✓' : 'Mark Contacted'}</span>
                    </button>

                    {/* Mark Resolved Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleResolution(item.id, isResolved ? 'needs_follow_up' : 'resolved')}
                      className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-colors cursor-pointer flex items-center gap-1.5 ${
                        isResolved
                          ? 'border border-slate-200 bg-slate-100 hover:bg-slate-200 text-slate-700'
                          : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-2xs'
                      }`}
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{isResolved ? 'Re-open' : 'Mark Resolved'}</span>
                    </button>

                    {/* Trash/Archive Button */}
                    <button
                      type="button"
                      onClick={() => handleToggleArchive(item.id)}
                      title={isArchived ? 'Unarchive feedback' : 'Archive feedback'}
                      className="text-slate-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                </div>

                {/* Customer Feedback Quote Block */}
                <div className="p-3.5 rounded-lg bg-slate-50/80 border border-slate-100 text-xs text-slate-700 leading-relaxed italic">
                  &quot;{feedbackText || 'Customer submitted a low-star rating on the review gate without additional comments.'}&quot;
                </div>

                {/* Collapsible Internal Note Section */}
                <div className="pt-1">
                  {!isNoteExpanded ? (
                    currentNote ? (
                      <div className="flex items-center gap-2 text-xs bg-slate-50 border border-slate-200/80 rounded-lg px-3 py-1.5">
                        <span className="font-semibold text-slate-700 shrink-0">Note:</span>
                        <span className="text-slate-600 truncate">{currentNote}</span>
                        <button
                          type="button"
                          onClick={() => setExpandedNoteIds((prev) => ({ ...prev, [item.id]: true }))}
                          className="ml-auto text-blue-600 hover:text-blue-700 font-medium text-[11px] cursor-pointer flex items-center gap-1 shrink-0"
                        >
                          <Edit2 className="w-3 h-3" />
                          <span>Edit</span>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setExpandedNoteIds((prev) => ({ ...prev, [item.id]: true }))}
                        className="text-xs text-slate-500 hover:text-slate-800 font-medium flex items-center gap-1.5 cursor-pointer transition-colors"
                      >
                        <MessageSquare className="w-3.5 h-3.5 text-slate-400" />
                        <span>+ Add note / log summary</span>
                      </button>
                    )
                  ) : (
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Log call summary or internal resolution note..."
                        value={currentNote}
                        onChange={(e) => setNoteInputs((prev) => ({ ...prev, [item.id]: e.target.value }))}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleSaveNote(item.id);
                            setExpandedNoteIds((prev) => ({ ...prev, [item.id]: false }));
                          }
                        }}
                        className="flex-1 text-xs px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:bg-white"
                        autoFocus
                      />
                      <div className="flex items-center gap-1.5 self-end sm:self-auto">
                        <button
                          type="button"
                          onClick={() => {
                            handleSaveNote(item.id);
                            setExpandedNoteIds((prev) => ({ ...prev, [item.id]: false }));
                          }}
                          className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold transition-all cursor-pointer"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setExpandedNoteIds((prev) => ({ ...prev, [item.id]: false }))}
                          className="px-2.5 py-1.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 text-xs transition-all cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
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