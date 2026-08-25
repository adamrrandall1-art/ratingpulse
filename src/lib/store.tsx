'use client';

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  Profile,
  BusinessSettings,
  Review,
  Invite,
} from './supabase/types';
import {
  initialProfile,
  initialSettings,
  initialReviews,
  initialInvites,
} from './data';
import { supabase, isSupabaseConfigured } from './supabase/client';
import { useAuth } from './auth-context';

export const isLowStarOrFeedback = (inv: Partial<Invite>) => {
  const rating = inv.rating_received;
  const hasLowRating = rating !== null && rating !== undefined && Number(rating) <= 3 && Number(rating) > 0;
  const hasFeedbackText = Boolean(inv.feedback_text && inv.feedback_text.trim().length > 0);
  const isFeedbackStatus = inv.status === 'feedback_submitted' || inv.status === 'needs_follow_up';
  return hasLowRating || hasFeedbackText || isFeedbackStatus;
};

const STORAGE_KEYS = {
  PROFILE: 'ratingpulse_profile_v1',
  SETTINGS: 'ratingpulse_settings_v1',
  REVIEWS: 'ratingpulse_reviews_v1',
  INVITES: 'ratingpulse_invites_v1',
  DEMO_MODE: 'ratingpulse_demo_mode_v1',
};

export interface RatingPulseStoreContextType {
  profile: Profile;
  settings: BusinessSettings;
  reviews: Review[];
  invites: Invite[];
  isLoaded: boolean;
  isSaving: boolean;
  isDemoMode: boolean;
  toggleDemoMode: (enable?: boolean) => void;
  approveReview: (reviewId: string, customReply?: string) => Promise<void>;
  regenerateAiReply: (reviewId: string, customKeywords?: string[]) => Promise<void>;
  updateDraftText: (reviewId: string, text: string) => void;
  simulateIncomingGoogleReview: () => Review;
  sendSmsInvite: (customerName: string, customerPhone: string, serviceType?: string) => Promise<Invite>;
  sendEmailInvite: (customerName: string, customerEmail: string, serviceType?: string) => Promise<Invite>;
  updateInviteResolution: (inviteId: string, resolution: 'unresolved' | 'resolved' | 'needs_follow_up') => Promise<void>;
  updateSettings: (newSettings: Partial<BusinessSettings>) => Promise<void>;
  updateProfile: (newProfile: Partial<Profile>) => Promise<void>;
  resetDemoData: () => void;
  pendingReviewsCount: number;
  publishedReviewsCount: number;
  privateFeedbackCount: number;
  unresolvedFeedbackCount: number;
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

const RatingPulseStoreContext = createContext<RatingPulseStoreContextType | null>(null);

// Global in-memory cache guard to prevent duplicate network calls
let globalHasLoaded = false;
let globalProfileCache = initialProfile;
let globalSettingsCache = initialSettings;
let globalReviewsCache = initialReviews;
let globalInvitesCache = initialInvites;

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile>(globalProfileCache);
  const [settings, setSettings] = useState<BusinessSettings>(globalSettingsCache);
  const [reviews, setReviews] = useState<Review[]>(globalReviewsCache);
  const [invites, setInvites] = useState<Invite[]>(globalInvitesCache);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState(globalHasLoaded);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (authLoading) return; // Guard: Wait until auth has fully resolved to prevent double-fetch overwrite

    async function loadData() {
      // 1. Check Demo Mode Preference from localStorage
      let currentDemoMode = true;
      try {
        const storedDemoMode = localStorage.getItem(STORAGE_KEYS.DEMO_MODE);
        if (storedDemoMode !== null) {
          currentDemoMode = storedDemoMode === 'true';
          setIsDemoMode(currentDemoMode);
        }
      } catch {
        // ignore
      }

      const currentUserId = user?.id || null;

      // 2. Try Supabase fetch if authenticated user exists
      if (isSupabaseConfigured && supabase && currentUserId) {
        try {
          const [profileRes, settingsRes, reviewsRes, invitesRes] = await Promise.allSettled([
            supabase.from('profiles').select('*').eq('id', currentUserId).maybeSingle(),
            supabase.from('business_settings').select('*').eq('user_id', currentUserId).maybeSingle(),
            supabase.from('reviews').select('*').eq('user_id', currentUserId).order('created_at', { ascending: false }),
            supabase.from('review_invites').select('*').eq('user_id', currentUserId).order('sent_at', { ascending: false }),
          ]);

          if (profileRes.status === 'fulfilled' && profileRes.value.data) {
            const prof = profileRes.value.data as Profile;
            setProfile(prof);
            globalProfileCache = prof;
          }

          if (settingsRes.status === 'fulfilled' && settingsRes.value.data) {
            const sett = settingsRes.value.data as BusinessSettings;
            setSettings(sett);
            globalSettingsCache = sett;
          }

          if (reviewsRes.status === 'fulfilled' && reviewsRes.value.data) {
            const revs = reviewsRes.value.data as Review[];
            if (revs.length > 0) {
              setReviews(revs);
              globalReviewsCache = revs;
            }
          }

          if (invitesRes.status === 'fulfilled' && invitesRes.value.data) {
            const invs = invitesRes.value.data as Invite[];
            console.log('Fetched Urgent Feedback / Review Invites:', invs);
            setInvites(invs);
            globalInvitesCache = invs;
          }

          globalHasLoaded = true;
          setIsLoaded(true);
          return;
        } catch (e) {
          console.warn('Supabase fetch fallback to local storage:', e);
        }
      }

      // 3. Local storage fallback
      try {
        const storedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
        const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        const storedReviews = localStorage.getItem(STORAGE_KEYS.REVIEWS);
        const storedInvites = localStorage.getItem(STORAGE_KEYS.INVITES);

        if (storedProfile) {
          const parsed = JSON.parse(storedProfile);
          setProfile(parsed);
          globalProfileCache = parsed;
        }
        if (storedSettings) {
          const parsed = JSON.parse(storedSettings);
          setSettings(parsed);
          globalSettingsCache = parsed;
        }
        if (storedReviews) {
          const parsed = JSON.parse(storedReviews);
          setReviews(parsed);
          globalReviewsCache = parsed;
        }
        if (storedInvites) {
          const parsed: Invite[] = JSON.parse(storedInvites);
          setInvites(parsed);
          globalInvitesCache = parsed;
        } else {
          setInvites(initialInvites);
          globalInvitesCache = initialInvites;
        }
      } catch (e) {
        console.error('Failed reading localStorage:', e);
      }

      globalHasLoaded = true;
      setIsLoaded(true);
    }

    loadData();
  }, [user?.id]);

  const persistState = (
    newReviews: Review[],
    newInvites: Invite[],
    newSettings?: BusinessSettings,
    newProfile?: Profile
  ) => {
    try {
      localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(newReviews));
      localStorage.setItem(STORAGE_KEYS.INVITES, JSON.stringify(newInvites));
      if (newSettings) localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      if (newProfile) localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(newProfile));
    } catch (e) {
      console.error('LocalStorage write error', e);
    }
  };

  const toggleDemoMode = (enable?: boolean) => {
    const nextMode = enable !== undefined ? enable : !isDemoMode;
    setIsDemoMode(nextMode);
    try {
      localStorage.setItem(STORAGE_KEYS.DEMO_MODE, String(nextMode));
    } catch {
      // ignore
    }

    if (nextMode) {
      setReviews(initialReviews);
      setInvites(initialInvites);
      setProfile(initialProfile);
      setSettings(initialSettings);
      persistState(initialReviews, initialInvites, initialSettings, initialProfile);
    } else {
      setReviews([]);
      setInvites([]);
      persistState([], [], settings, profile);
    }
  };

  const approveReview = async (reviewId: string, customReply?: string) => {
    setIsSaving(true);
    const updatedReviews = reviews.map((rev) => {
      if (rev.id === reviewId) {
        const finalReply = customReply || rev.ai_draft_reply;
        return {
          ...rev,
          published_reply: finalReply,
          status: 'published' as const,
          published_at: new Date().toISOString(),
        };
      }
      return rev;
    });

    setReviews(updatedReviews);
    globalReviewsCache = updatedReviews;
    persistState(updatedReviews, invites, settings, profile);

    if (isSupabaseConfigured && supabase) {
      const target = updatedReviews.find((r) => r.id === reviewId);
      if (target) {
        try {
          await supabase.from('reviews').upsert({
            id: target.id,
            user_id: profile.id,
            author_name: target.author_name,
            rating: target.rating,
            review_text: target.review_text,
            published_reply: target.published_reply,
            status: target.status,
            published_at: target.published_at,
          });
        } catch (err) {
          console.warn('Supabase approveReview sync warning:', err);
        }
      }
    }

    setIsSaving(false);
  };

  const regenerateAiReply = async (reviewId: string, customKeywords?: string[]) => {
    setIsSaving(true);
    const target = reviews.find((r) => r.id === reviewId);
    if (!target) {
      setIsSaving(false);
      return;
    }

    const keywords = customKeywords || settings.custom_keywords || [];
    const tone = settings.brand_voice || 'friendly_professional';

    try {
      const response = await fetch('/api/reviews/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewText: target.review_text,
          authorName: target.author_name,
          rating: target.rating,
          businessName: profile.business_name,
          tone,
          keywords,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const updated = reviews.map((r) =>
          r.id === reviewId ? { ...r, ai_draft_reply: data.reply } : r
        );
        setReviews(updated);
        globalReviewsCache = updated;
        persistState(updated, invites, settings, profile);
      }
    } catch (e) {
      console.error('Failed to regenerate AI reply:', e);
    } finally {
      setIsSaving(false);
    }
  };

  const updateDraftText = (reviewId: string, text: string) => {
    const updated = reviews.map((r) =>
      r.id === reviewId ? { ...r, ai_draft_reply: text } : r
    );
    setReviews(updated);
    globalReviewsCache = updated;
    persistState(updated, invites, settings, profile);
  };

  const simulateIncomingGoogleReview = (): Review => {
    const names = ['David K.', 'Sarah M.', 'Rachel B.', 'Carlos G.', 'Emily W.'];
    const comments = [
      'Outstanding experience today! The doctor took time to explain every detail clearly. 10/10 recommend!',
      'Fast, gentle, and extremely professional team. So grateful to have found this clinic!',
      'Dr. Marcus and staff are unbelievable. Zero pain during my appointment and spotless office.',
      'Super clean facility and virtually no wait time. Truly the highest standard in town.',
    ];

    const randomName = names[Math.floor(Math.random() * names.length)];
    const randomComment = comments[Math.floor(Math.random() * comments.length)];
    const newId = `rev-${Date.now()}`;

    const newReview: Review = {
      id: newId,
      user_id: profile.id,
      author_name: randomName,
      author_avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random() * 50)}?w=150&auto=format&fit=crop&q=80`,
      rating: 5,
      review_text: randomComment,
      review_date: 'Just now',
      sentiment: 'positive',
      keywords_used: ['gentle care', 'professional'],
      created_at: new Date().toISOString(),
      status: settings.auto_publish_5_star ? 'published' : 'pending_approval',
      ai_draft_reply: `Thank you so much, ${randomName}! We truly appreciate you taking the time to share your feedback. Our team is dedicated to gentle, personalized care, and we look forward to seeing you again soon!`,
      published_reply: settings.auto_publish_5_star
        ? `Thank you so much, ${randomName}! We truly appreciate you taking the time to share your feedback. Our team is dedicated to gentle, personalized care, and we look forward to seeing you again soon!`
        : undefined,
      published_at: settings.auto_publish_5_star ? new Date().toISOString() : undefined,
    };

    const updated = [newReview, ...reviews];
    setReviews(updated);
    globalReviewsCache = updated;
    persistState(updated, invites, settings, profile);

    return newReview;
  };

  const sendSmsInvite = async (
    customerName: string,
    customerPhone: string,
    serviceType: string = 'General Consultation'
  ): Promise<Invite> => {
    setIsSaving(true);
    const validUuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `inv-${Date.now()}`;

    const newInvite: Invite = {
      id: validUuid,
      user_id: profile.id,
      customer_name: customerName,
      customer_phone: customerPhone,
      service_type: serviceType,
      status: 'sent',
      sent_at: new Date().toISOString(),
    };

    const updated = [newInvite, ...invites];
    setInvites(updated);
    globalInvitesCache = updated;
    persistState(reviews, updated, settings, profile);

    const businessId = profile.google_place_id || profile.id;
    const reviewUrl = profile.review_url || (profile.google_place_id ? `https://search.google.com/local/writereview?placeid=${profile.google_place_id}` : '');
    const ownerEmail = profile.email || 'notifications@ratingpulse.co';

    try {
      const resp = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toPhone: customerPhone,
          customerName,
          businessName: profile.business_name,
          businessId,
          placeId: profile.google_place_id,
          reviewUrl,
          ownerEmail,
        }),
      });

      if (resp.ok) {
        setTimeout(() => {
          setInvites((prev) =>
            prev.map((inv) =>
              inv.id === newInvite.id ? { ...inv, status: 'delivered' } : inv
            )
          );
        }, 1500);
      }
    } catch (err) {
      console.warn('SMS dispatch network warning:', err);
    }

    if (isSupabaseConfigured && supabase) {
      void (async () => {
        try {
          const payload: Record<string, unknown> = {
            customer_name: customerName,
            customer_phone: customerPhone,
            service_type: serviceType,
            status: 'sent',
            sent_at: new Date().toISOString(),
          };
          const uid = user?.id || profile.id;
          if (uid && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid)) {
            payload.user_id = uid;
          }
          const { error } = await supabase.from('review_invites').insert([payload]);
          if (error) console.error('Supabase insert invite error:', error.message);
        } catch (err: unknown) {
          console.error('Supabase insert invite exception:', err);
        }
      })();
    }

    setIsSaving(false);
    return newInvite;
  };

  const sendEmailInvite = async (
    customerName: string,
    customerEmail: string,
    serviceType: string = 'General Consultation'
  ): Promise<Invite> => {
    setIsSaving(true);
    const validUuid = typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : `inv-${Date.now()}`;

    const newInvite: Invite = {
      id: validUuid,
      user_id: profile.id,
      customer_name: customerName,
      customer_phone: customerEmail,
      customer_email: customerEmail,
      service_type: serviceType,
      status: 'sent',
      sent_at: new Date().toISOString(),
    };

    const updated = [newInvite, ...invites];
    setInvites(updated);
    globalInvitesCache = updated;
    persistState(reviews, updated, settings, profile);

    const businessId = profile.google_place_id || profile.id;
    const reviewUrl = profile.review_url || (profile.google_place_id ? `https://search.google.com/local/writereview?placeid=${profile.google_place_id}` : '');
    const ownerEmail = profile.email || 'notifications@ratingpulse.co';

    try {
      const resp = await fetch('/api/send-email-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail,
          customerName,
          businessName: profile.business_name,
          businessId,
          placeId: profile.google_place_id,
          reviewUrl,
          ownerEmail,
        }),
      });

      if (resp.ok) {
        setTimeout(() => {
          setInvites((prev) =>
            prev.map((inv) =>
              inv.id === newInvite.id ? { ...inv, status: 'delivered' } : inv
            )
          );
        }, 1500);
      }
    } catch (err) {
      console.warn('Email dispatch network warning:', err);
    }

    if (isSupabaseConfigured && supabase) {
      void (async () => {
        try {
          const payload: Record<string, unknown> = {
            customer_name: customerName,
            customer_phone: customerEmail,
            customer_email: customerEmail,
            service_type: serviceType,
            status: 'sent',
            sent_at: new Date().toISOString(),
          };
          const uid = user?.id || profile.id;
          if (uid && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid)) {
            payload.user_id = uid;
          }
          const { error } = await supabase.from('review_invites').insert([payload]);
          if (error) console.error('Supabase insert email invite error:', error.message);
        } catch (err: unknown) {
          console.error('Supabase insert email invite exception:', err);
        }
      })();
    }

    setIsSaving(false);
    return newInvite;
  };

  const updateInviteResolution = async (
    inviteId: string,
    resolution: 'unresolved' | 'resolved' | 'needs_follow_up'
  ) => {
    const updated = invites.map((inv) =>
      inv.id === inviteId ? { ...inv, resolution_status: resolution } : inv
    );
    setInvites(updated);
    globalInvitesCache = updated;
    persistState(reviews, updated, settings, profile);

    if (isSupabaseConfigured && supabase) {
      try {
        await supabase
          .from('review_invites')
          .update({ resolution_status: resolution })
          .eq('id', inviteId);
      } catch (err) {
        console.warn('Error updating invite resolution in Supabase:', err);
      }
    }
  };

  const updateSettings = async (newSettings: Partial<BusinessSettings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    globalSettingsCache = updated;
    persistState(reviews, invites, updated, profile);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('business_settings').upsert({
          ...updated,
          user_id: profile.id,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase update business_settings warning:', err);
      }
    }
  };

  const updateProfile = async (newProfile: Partial<Profile>) => {
    const updated = { ...profile, ...newProfile };
    setProfile(updated);
    globalProfileCache = updated;
    persistState(reviews, invites, settings, updated);
    if (isSupabaseConfigured && supabase) {
      try {
        await supabase.from('profiles').upsert(updated);
        await supabase.from('business_settings').upsert({
          user_id: updated.id,
          brand_voice: settings.brand_voice || 'friendly_professional',
          auto_publish_5_star: settings.auto_publish_5_star ?? false,
          custom_keywords: settings.custom_keywords || ['gentle care', 'emergency dentist', 'friendly staff', 'painless dentistry'],
          sms_template: settings.sms_template || 'Hi {{customer_name}}, thank you for choosing {{business_name}}! Could you take 30 seconds to share your experience on Google? It means the world to our team: {{review_link}}',
          notify_email: settings.notify_email ?? true,
          notify_sms: settings.notify_sms ?? true,
          updated_at: new Date().toISOString(),
        });
      } catch (err) {
        console.warn('Supabase update profile warning:', err);
      }
    }
  };

  const resetDemoData = () => {
    setProfile(initialProfile);
    setSettings(initialSettings);
    setReviews(initialReviews);
    setInvites(initialInvites);
    setIsDemoMode(true);
    try {
      localStorage.setItem(STORAGE_KEYS.DEMO_MODE, 'true');
    } catch {
      // ignore
    }
    persistState(initialReviews, initialInvites, initialSettings, initialProfile);
  };

  const value: RatingPulseStoreContextType = {
    profile,
    settings,
    reviews,
    invites,
    isLoaded,
    isSaving,
    isDemoMode,
    toggleDemoMode,
    approveReview,
    regenerateAiReply,
    updateDraftText,
    simulateIncomingGoogleReview,
    sendSmsInvite,
    sendEmailInvite,
    updateInviteResolution,
    updateSettings,
    updateProfile,
    resetDemoData,
    pendingReviewsCount: reviews.filter((r) => r.status === 'pending_approval').length,
    publishedReviewsCount: reviews.filter((r) => r.status === 'published').length,
    privateFeedbackCount: invites.filter((inv) => isLowStarOrFeedback(inv)).length,
    unresolvedFeedbackCount: invites.filter((inv) => isLowStarOrFeedback(inv) && inv.resolution_status !== 'resolved').length,
    searchQuery,
    setSearchQuery,
  };

  return (
    <RatingPulseStoreContext.Provider value={value}>
      {children}
    </RatingPulseStoreContext.Provider>
  );
}

export function useRatingPulseStore(): RatingPulseStoreContextType {
  const context = useContext(RatingPulseStoreContext);
  if (context) {
    return context;
  }

  // Standalone fallback if used outside Provider
  return {
    profile: globalProfileCache,
    settings: globalSettingsCache,
    reviews: globalReviewsCache,
    invites: globalInvitesCache,
    isLoaded: globalHasLoaded,
    isSaving: false,
    isDemoMode: true,
    toggleDemoMode: () => {},
    approveReview: async () => {},
    regenerateAiReply: async () => {},
    updateDraftText: () => {},
    simulateIncomingGoogleReview: () => initialReviews[0],
    sendSmsInvite: async () => initialInvites[0],
    sendEmailInvite: async () => initialInvites[0],
    updateInviteResolution: async () => {},
    updateSettings: async () => {},
    updateProfile: async () => {},
    resetDemoData: () => {},
    pendingReviewsCount: globalReviewsCache.filter((r) => r.status === 'pending_approval').length,
    publishedReviewsCount: globalReviewsCache.filter((r) => r.status === 'published').length,
    privateFeedbackCount: globalInvitesCache.filter((inv) => isLowStarOrFeedback(inv)).length,
    unresolvedFeedbackCount: globalInvitesCache.filter((inv) => isLowStarOrFeedback(inv) && inv.resolution_status !== 'resolved').length,
    searchQuery: '',
    setSearchQuery: () => {},
  };
}