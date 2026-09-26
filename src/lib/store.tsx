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
import { clearLocalWorkspaceState, registerCacheResetListener } from './workspace-cleanup';

export const isLowStarOrFeedback = (inv: Partial<Invite>) => {
  const rating = inv.rating_received;
  const hasLowRating = rating !== null && rating !== undefined && Number(rating) <= 3 && Number(rating) > 0;
  const hasFeedbackText = Boolean(inv.feedback_text && inv.feedback_text.trim().length > 0);
  const isFeedbackStatus = inv.status === 'feedback_submitted' || inv.status === 'needs_follow_up' || inv.status === 'unresolved';
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
  syncGoogleReviews: (overridePlaceId?: string) => Promise<number>;
  disconnectBusiness: () => Promise<void>;
  switchBusiness: (businessId: string) => Promise<void>;
  clearWorkspaceData: () => void;
  resetAccountAndTestData: () => Promise<void>;
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
let globalReviewsCache: Review[] = [];
let globalInvitesCache = initialInvites;

// Register global in-memory cache clearer with workspace-cleanup
registerCacheResetListener(() => {
  globalProfileCache = initialProfile;
  globalSettingsCache = initialSettings;
  globalReviewsCache = [];
  globalInvitesCache = [];
  globalHasLoaded = false;
});

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile>(globalProfileCache);
  const [settings, setSettings] = useState<BusinessSettings>(globalSettingsCache);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [invites, setInvites] = useState<Invite[]>(globalInvitesCache);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState(globalHasLoaded);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  useEffect(() => {
    if (authLoading) return; // Guard: Wait until auth has fully resolved to prevent double-fetch overwrite

    const currentUserId = user?.id || null;

    async function loadData() {
      // 1. Check Demo Mode Preference from localStorage
      let currentDemoMode = false;
      try {
        const storedDemoMode = localStorage.getItem(STORAGE_KEYS.DEMO_MODE);
        if (storedDemoMode !== null) {
          currentDemoMode = storedDemoMode === 'true';
          setIsDemoMode(currentDemoMode);
        } else if (!currentUserId) {
          currentDemoMode = true;
          setIsDemoMode(true);
        } else {
          setIsDemoMode(false);
        }
      } catch {
        // ignore
      }

      // 2. Try Supabase fetch if authenticated user exists
      if (isSupabaseConfigured && supabase && currentUserId) {
        try {
          // Strictly wait for the active business profile to resolve from Supabase FIRST
          const { data: profileData, error: profileErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', currentUserId)
            .maybeSingle();

          let activeProfile: Profile | null = null;
          if (!profileErr && profileData) {
            activeProfile = profileData as Profile;
            setProfile(activeProfile);
            globalProfileCache = activeProfile;
          }

          // Concurrently fetch settings and invites
          const [settingsRes, invitesRes] = await Promise.allSettled([
            supabase.from('business_settings').select('*').eq('user_id', currentUserId).maybeSingle(),
            supabase.from('review_invites').select('*').eq('user_id', currentUserId).order('sent_at', { ascending: false }),
          ]);

          if (settingsRes.status === 'fulfilled' && settingsRes.value.data) {
            const sett = settingsRes.value.data as BusinessSettings;
            setSettings(sett);
            globalSettingsCache = sett;
          }

          if (invitesRes.status === 'fulfilled' && invitesRes.value.data) {
            const invs = invitesRes.value.data as Invite[];
            console.log('Fetched Urgent Feedback / Review Invites:', invs);
            setInvites(invs);
            globalInvitesCache = invs;
          }

          const isConnected = Boolean(
            activeProfile?.google_place_id &&
            activeProfile?.google_place_id.trim() !== '' &&
            activeProfile?.google_connected !== false
          );

          if (isConnected && activeProfile?.google_place_id) {
            const activePlaceId = activeProfile.google_place_id;
            const { data: revsData, error: revsErr } = await supabase
              .from('reviews')
              .select('*')
              .eq('user_id', currentUserId)
              .eq('place_id', activePlaceId)
              .order('created_at', { ascending: false });

            if (!revsErr && revsData && revsData.length > 0) {
              const revs = revsData as Review[];
              setReviews(revs);
              globalReviewsCache = revs;
              persistState(revs, globalInvitesCache, globalSettingsCache, activeProfile || undefined);
            } else {
              setReviews([]);
              globalReviewsCache = [];
              try {
                localStorage.removeItem(STORAGE_KEYS.REVIEWS);
              } catch {}

              // Auto-sync Google reviews in background if user connected a Place ID but reviews table has 0 records for this place
              void (async () => {
                try {
                  const syncRes = await fetch('/api/sync-reviews', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      place_id: activePlaceId,
                      business_id: currentUserId,
                      user_id: currentUserId,
                    }),
                  });
                  const syncData = await syncRes.json();
                  if (syncData.success && Array.isArray(syncData.reviews) && syncData.reviews.length > 0) {
                    setReviews(syncData.reviews);
                    globalReviewsCache = syncData.reviews;
                    persistState(syncData.reviews, globalInvitesCache, globalSettingsCache, activeProfile || undefined);
                  } else {
                    setReviews([]);
                    globalReviewsCache = [];
                  }
                } catch (syncErr) {
                  console.warn('[Auto-sync initial reviews exception]:', syncErr);
                  setReviews([]);
                  globalReviewsCache = [];
                }
              })();
            }
          } else {
            // Strict Guard: No business is connected. DO NOT query reviews table, set reviews = [], and purge cache
            setReviews([]);
            globalReviewsCache = [];
            try {
              localStorage.removeItem(STORAGE_KEYS.REVIEWS);
            } catch {}
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

        let parsedProfile: Profile | null = null;
        if (storedProfile) {
          parsedProfile = JSON.parse(storedProfile);
          if (parsedProfile) {
            setProfile(parsedProfile);
            globalProfileCache = parsedProfile;
          }
        }
        if (storedSettings) {
          const parsed = JSON.parse(storedSettings);
          setSettings(parsed);
          globalSettingsCache = parsed;
        }

        const expectedPlaceId = parsedProfile?.google_place_id || null;
        const isLocallyConnected = Boolean(expectedPlaceId && parsedProfile?.google_connected !== false);

        // Do NOT hydrate reviews from localStorage unless actively connected with matching place_id
        if (isLocallyConnected && storedReviews) {
          try {
            const parsed: Review[] = JSON.parse(storedReviews);
            if (
              expectedPlaceId &&
              Array.isArray(parsed) &&
              parsed.length > 0 &&
              parsed.every((r) => r.place_id === expectedPlaceId)
            ) {
              setReviews(parsed);
              globalReviewsCache = parsed;
            } else {
              localStorage.removeItem(STORAGE_KEYS.REVIEWS);
              setReviews([]);
              globalReviewsCache = [];
            }
          } catch {
            localStorage.removeItem(STORAGE_KEYS.REVIEWS);
            setReviews([]);
            globalReviewsCache = [];
          }
        } else if (!currentUserId && currentDemoMode && !storedProfile) {
          setReviews(initialReviews);
          globalReviewsCache = initialReviews;
        } else {
          localStorage.removeItem(STORAGE_KEYS.REVIEWS);
          setReviews([]);
          globalReviewsCache = [];
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

    // 4. Set up Realtime listener on review_invites for immediate live sync
    let subscription: any = null;
    const client = supabase;
    if (isSupabaseConfigured && client && currentUserId) {
      const channel = client
        .channel(`realtime_invites_${currentUserId}`)
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'review_invites',
            filter: `user_id=eq.${currentUserId}`,
          },
          async () => {
            console.log('[Realtime] review_invites change detected, refetching...');
            const { data } = await client
              .from('review_invites')
              .select('*')
              .eq('user_id', currentUserId)
              .order('sent_at', { ascending: false });

            if (data) {
              setInvites(data as Invite[]);
              globalInvitesCache = data as Invite[];
            }
          }
        )
        .subscribe();

      subscription = channel;
    }

    return () => {
      if (subscription && client) {
        client.removeChannel(subscription);
      }
    };
  }, [user?.id, authLoading]);

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
    const targetRev = reviews.find((r) => r.id === reviewId);
    const finalReply = customReply || targetRev?.ai_draft_reply || '';

    const updatedReviews = reviews.map((rev) => {
      if (rev.id === reviewId) {
        return {
          ...rev,
          review_reply: finalReply,
          published_reply: finalReply,
          replied_at: new Date().toISOString(),
          status: 'published' as const,
          published_at: new Date().toISOString(),
        };
      }
      return rev;
    });

    setReviews(updatedReviews);
    globalReviewsCache = updatedReviews;
    persistState(updatedReviews, invites, settings, profile);

    // Call 1-Tap Google Business Profile Review Reply API
    try {
      const uid = user?.id || profile.id;
      await fetch('/api/reviews/reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          replyText: finalReply,
          userId: uid,
        }),
      });
    } catch (err) {
      console.warn('[approveReview /api/reviews/reply warning]:', err);
    }

    if (isSupabaseConfigured && supabase) {
      const target = updatedReviews.find((r) => r.id === reviewId);
      if (target) {
        try {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(target.id);
          const reviewPayload: Record<string, unknown> = {
            user_id: profile.id,
            business_id: profile.id,
            place_id: profile.google_place_id || null,
            author_name: target.author_name,
            rating: target.rating,
            review_text: target.review_text,
            published_reply: target.published_reply,
            status: target.status,
            published_at: target.published_at,
            updated_at: new Date().toISOString(),
          };

          if (isUuid) {
            reviewPayload.id = target.id;
            await supabase.from('reviews').upsert(reviewPayload, { onConflict: 'id' });
          } else {
            await supabase.from('reviews').insert([reviewPayload]);
          }
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
          businessName: profile.business_name || 'our team',
          businessCategory: profile.business_category || 'Healthcare / Dental',
          tone,
          keywords,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.reply) {
          const updated = reviews.map((r) =>
            r.id === reviewId ? { ...r, ai_draft_reply: data.reply } : r
          );
          setReviews(updated);
          globalReviewsCache = updated;
          persistState(updated, invites, settings, profile);
        }
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
    const sampleScenarios = [
      {
        name: 'David K.',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        rating: 5,
        text: 'Outstanding experience today! The doctor took time to explain every detail of my treatment clearly and the staff was so welcoming. 10/10 recommend!',
        sentiment: 'positive' as const,
        keywords: ['clear explanation', 'welcoming staff', 'personalized care'],
        replies: [
          'Hi David, thank you so much for the 5-star praise! We take great pride in making sure every patient understands their care plan with clarity. We appreciate your recommendation and look forward to your next visit!',
          'Hello David! It was a pleasure having you in today. Hearing that our clear explanations and welcoming team made your visit exceptional means everything to us. See you next time!',
        ],
      },
      {
        name: 'Sarah M.',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        rating: 5,
        text: 'Fast, gentle, and extremely professional team. I was nervous about the laser cleaning, but it was 100% painless. So grateful to have found this clinic!',
        sentiment: 'positive' as const,
        keywords: ['gentle care', 'painless laser cleaning', 'professional'],
        replies: [
          'Thank you for such a wonderful review, Sarah! We know dental appointments can cause anxiety, so knowing our gentle laser cleaning kept you completely painless and relaxed is the best feedback we could receive.',
          'Hi Sarah! Thank you for trusting our clinic. Providing fast, comfortable, and pain-free treatments is our highest priority, and we are so glad you had such a great experience!',
        ],
      },
      {
        name: 'Carlos G.',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        rating: 5,
        text: 'Super clean modern facility and virtually no wait time. Dr. Marcus and the team provided top-tier cosmetic care. My smile looks amazing!',
        sentiment: 'positive' as const,
        keywords: ['modern facility', 'cosmetic care', 'no wait time'],
        replies: [
          'Hi Carlos! We are thrilled to hear how much you love your new smile! Respecting your time with zero wait while maintaining a spotless clinic is what we strive for every day. Enjoy your brilliant results!',
          'Thank you so much, Carlos! Crafting beautiful smile transformations in a modern, punctual setting is our passion. We appreciate your glowing 5-star review!',
        ],
      },
      {
        name: 'Emily W.',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        rating: 4,
        text: 'The dental treatment was fantastic and the hygienist was very sweet. Parking was a bit crowded around midday, but overall a great clinic.',
        sentiment: 'neutral' as const,
        keywords: ['sweet hygienist', 'dental treatment', 'parking access'],
        replies: [
          'Hi Emily, thank you for your kind 4-star feedback and for highlighting our wonderful hygienist! We appreciate your note regarding midday parking and have added designated patient spots right behind building B for your future convenience.',
          'Dear Emily, thank you for sharing your experience! We are glad you loved your dental treatment. We are working on optimizing parking signage to make your next visit completely seamless.',
        ],
      },
      {
        name: 'Rachel B.',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        rating: 5,
        text: 'Brought my 7-year-old daughter in for her first filling and the team was so patient and sweet with her. No tears at all! Highly recommend for families.',
        sentiment: 'positive' as const,
        keywords: ['family pediatric care', 'patient staff', 'fear-free visit'],
        replies: [
          'Thank you for such a heartwarming note, Rachel! Making pediatric visits calm, fear-free, and fun for kids is something our entire team cherishes. Give our warmest regards to your daughter!',
          'Hi Rachel, we are so delighted to hear your daughter had a tear-free first filling appointment! Thank you for trusting us with your family dental care.',
        ],
      },
    ];

    const pick = sampleScenarios[Math.floor(Math.random() * sampleScenarios.length)];
    const chosenReply = pick.replies[Math.floor(Math.random() * pick.replies.length)];
    const newId = `rev-${Date.now()}`;

    const newReview: Review = {
      id: newId,
      user_id: profile.id,
      business_id: profile.id,
      place_id: profile.google_place_id || '',
      author_name: pick.name,
      author_avatar: pick.avatar,
      rating: pick.rating,
      review_text: pick.text,
      review_date: 'Just now',
      sentiment: pick.sentiment,
      keywords_used: pick.keywords,
      created_at: new Date().toISOString(),
      status: settings.auto_publish_5_star && pick.rating === 5 ? 'published' : 'pending_approval',
      ai_draft_reply: chosenReply,
      published_reply: settings.auto_publish_5_star && pick.rating === 5 ? chosenReply : undefined,
      published_at: settings.auto_publish_5_star && pick.rating === 5 ? new Date().toISOString() : undefined,
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

    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ratingpulse.co';
    const qParams = new URLSearchParams();
    if (profile.business_name) qParams.set('business', profile.business_name);
    if (profile.google_place_id) qParams.set('placeId', profile.google_place_id);
    if (profile.review_url) qParams.set('reviewUrl', profile.review_url);
    if (profile.email) qParams.set('ownerEmail', profile.email);
    const reviewGateUrl = `${appUrl}/rate/${validUuid}?${qParams.toString()}`;

    const businessId = profile.google_place_id || profile.id;
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
          reviewLink: reviewGateUrl,
          reviewUrl: reviewGateUrl,
          reviewGateUrl,
          inviteId: validUuid,
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

    const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ratingpulse.co';
    const qParams = new URLSearchParams();
    if (profile.business_name) qParams.set('business', profile.business_name);
    if (profile.google_place_id) qParams.set('placeId', profile.google_place_id);
    if (profile.review_url) qParams.set('reviewUrl', profile.review_url);
    if (profile.email) qParams.set('ownerEmail', profile.email);
    const reviewGateUrl = `${appUrl}/rate/${validUuid}?${qParams.toString()}`;

    const businessId = profile.google_place_id || profile.id;
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
          reviewUrl: reviewGateUrl,
          reviewGateUrl,
          inviteId: validUuid,
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

    const uid = user?.id || profile.id;
    const isUidValid = uid && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid);

    if (isSupabaseConfigured && supabase && isUidValid) {
      try {
        const payload: Record<string, unknown> = {
          user_id: uid,
          brand_voice: updated.brand_voice || 'friendly_professional',
          auto_publish_5_star: Boolean(updated.auto_publish_5_star),
          custom_keywords: Array.isArray(updated.custom_keywords) ? updated.custom_keywords : ['gentle care', 'emergency dentist'],
          sms_template: updated.sms_template || '',
          notification_email: updated.notification_email || null,
          notification_phone: updated.notification_phone || null,
          sms_alerts_enabled: updated.sms_alerts_enabled ?? true,
          notify_email: updated.notify_email ?? true,
          notify_sms: updated.notify_sms ?? true,
          updated_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from('business_settings')
          .upsert(payload, { onConflict: 'user_id' });

        if (error) {
          console.error('Supabase save error details (business_settings):', error.message, error.details, error.hint);
        }
      } catch (err) {
        console.warn('Supabase update business_settings exception:', err);
      }
    }
  };

  const updateProfile = async (newProfile: Partial<Profile>) => {
    const updated = { ...profile, ...newProfile };
    setProfile(updated);
    globalProfileCache = updated;
    persistState(reviews, invites, settings, updated);

    const uid = user?.id || updated.id;
    const isUidValid = uid && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid);

    if (isSupabaseConfigured && supabase && isUidValid) {
      try {
        const cleanProfilePayload: Record<string, unknown> = {
          id: uid,
          email: updated.email || user?.email || '',
          full_name: updated.full_name || null,
          business_name: updated.business_name || 'Apex Dental & Aesthetics',
          business_category: updated.business_category || 'Healthcare / Dental',
          google_place_id: updated.google_place_id || '',
          formatted_address: updated.formatted_address || null,
          review_url: updated.review_url || null,
          google_rating: Number(updated.google_rating) || 4.9,
          google_review_count: Number(updated.google_review_count) || 0,
          google_connected: Boolean(updated.google_connected),
          phone: updated.phone || null,
          notification_email: updated.notification_email || null,
          notification_phone: updated.notification_phone || null,
          sms_alerts_enabled: updated.sms_alerts_enabled ?? true,
          updated_at: new Date().toISOString(),
        };

        const { error: profileError } = await supabase
          .from('profiles')
          .upsert(cleanProfilePayload, { onConflict: 'id' });

        if (profileError) {
          console.error('Supabase save error details (profiles):', profileError.message, profileError.details, profileError.hint);
        }

        const cleanSettingsPayload: Record<string, unknown> = {
          user_id: uid,
          brand_voice: settings.brand_voice || 'friendly_professional',
          auto_publish_5_star: Boolean(settings.auto_publish_5_star),
          custom_keywords: Array.isArray(settings.custom_keywords) ? settings.custom_keywords : ['gentle care', 'emergency dentist'],
          sms_template: settings.sms_template || '',
          notification_email: updated.notification_email || settings.notification_email || null,
          notification_phone: updated.notification_phone || settings.notification_phone || null,
          sms_alerts_enabled: updated.sms_alerts_enabled ?? settings.sms_alerts_enabled ?? true,
          notify_email: settings.notify_email ?? true,
          notify_sms: settings.notify_sms ?? true,
          updated_at: new Date().toISOString(),
        };

        const { error: settingsError } = await supabase
          .from('business_settings')
          .upsert(cleanSettingsPayload, { onConflict: 'user_id' });

        if (settingsError) {
          console.error('Supabase save error details (business_settings):', settingsError.message, settingsError.details, settingsError.hint);
        }
      } catch (err) {
        console.warn('Supabase update profile exception:', err);
      }
    }
  };

  const syncGoogleReviews = async (overridePlaceId?: string): Promise<number> => {
    const targetPlaceId = overridePlaceId || profile.google_place_id;
    if (!targetPlaceId) {
      console.warn('[syncGoogleReviews] No Google Place ID configured');
      return 0;
    }

    try {
      const uid = user?.id || profile.id;
      const res = await fetch('/api/sync-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          place_id: targetPlaceId,
          business_id: uid,
          user_id: uid,
        }),
      });

      const data = await res.json();
      if (data.success && Array.isArray(data.reviews) && data.reviews.length > 0) {
        const fetchedRevs: Review[] = data.reviews;
        let updatedReviewsList: Review[] = [];

        setReviews((prev) => {
          const existingMap = new Map(prev.map((r) => [r.id, r]));
          fetchedRevs.forEach((r) => existingMap.set(r.id, r));
          updatedReviewsList = Array.from(existingMap.values());
          globalReviewsCache = updatedReviewsList;
          persistState(updatedReviewsList, invites, settings, profile);
          return updatedReviewsList;
        });

        if (data.stats) {
          const updatedProfile: Profile = {
            ...profile,
            google_place_id: targetPlaceId,
            google_connected: true,
            google_rating: Number(data.stats.average_rating) || profile.google_rating,
            google_review_count: Number(data.stats.total_reviews) || profile.google_review_count,
          };
          setProfile(updatedProfile);
          globalProfileCache = updatedProfile;
          persistState(updatedReviewsList.length > 0 ? updatedReviewsList : reviews, invites, settings, updatedProfile);
        }

        return fetchedRevs.length;
      }
    } catch (err) {
      console.error('[syncGoogleReviews] Exception:', err);
    }
    return 0;
  };

  const clearWorkspaceData = () => {
    clearLocalWorkspaceState();
    const clearedProfile: Profile = {
      ...initialProfile,
      id: user?.id || '',
      email: user?.email || '',
      full_name: user?.user_metadata?.full_name || '',
    };
    const clearedSettings: BusinessSettings = {
      ...initialSettings,
      id: '',
      user_id: user?.id || '',
    };
    setProfile(clearedProfile);
    globalProfileCache = clearedProfile;
    setSettings(clearedSettings);
    globalSettingsCache = clearedSettings;
    setReviews([]);
    globalReviewsCache = [];
    setInvites([]);
    globalInvitesCache = [];
    setIsDemoMode(false);
  };

  const switchBusiness = async (businessId: string) => {
    setIsSaving(true);
    clearLocalWorkspaceState();

    setReviews([]);
    globalReviewsCache = [];
    setInvites([]);
    globalInvitesCache = [];

    if (isSupabaseConfigured && supabase && businessId) {
      try {
        const [profileRes, settingsRes, invitesRes] = await Promise.allSettled([
          supabase.from('profiles').select('*').eq('id', businessId).maybeSingle(),
          supabase.from('business_settings').select('*').eq('user_id', businessId).maybeSingle(),
          supabase.from('review_invites').select('*').eq('user_id', businessId).order('sent_at', { ascending: false }),
        ]);

        let switchedProfile: Profile | null = null;
        if (profileRes.status === 'fulfilled' && profileRes.value.data) {
          switchedProfile = profileRes.value.data as Profile;
          setProfile(switchedProfile);
          globalProfileCache = switchedProfile;
        }
        if (settingsRes.status === 'fulfilled' && settingsRes.value.data) {
          const sett = settingsRes.value.data as BusinessSettings;
          setSettings(sett);
          globalSettingsCache = sett;
        }
        if (invitesRes.status === 'fulfilled' && invitesRes.value.data) {
          const invs = (invitesRes.value.data || []) as Invite[];
          setInvites(invs);
          globalInvitesCache = invs;
        }

        const switchedPlaceId = switchedProfile?.google_place_id;
        if (switchedPlaceId) {
          const { data: revsData, error: revsErr } = await supabase
            .from('reviews')
            .select('*')
            .eq('place_id', switchedPlaceId)
            .order('created_at', { ascending: false });

          if (!revsErr && revsData && revsData.length > 0) {
            const revs = revsData as Review[];
            setReviews(revs);
            globalReviewsCache = revs;
            persistState(revs, globalInvitesCache, globalSettingsCache, switchedProfile || undefined);
          } else {
            setReviews([]);
            globalReviewsCache = [];
            try {
              localStorage.removeItem(STORAGE_KEYS.REVIEWS);
            } catch {}
          }
        } else {
          setReviews([]);
          globalReviewsCache = [];
          try {
            localStorage.removeItem(STORAGE_KEYS.REVIEWS);
          } catch {}
        }
      } catch (err) {
        console.error('[switchBusiness Exception]:', err);
      }
    }

    setIsSaving(false);
  };

  const disconnectBusiness = async () => {
    setIsSaving(true);
    clearLocalWorkspaceState();

    const clearedProfile: Profile = {
      ...initialProfile,
      id: user?.id || profile.id || '',
      email: user?.email || profile.email || '',
      full_name: user?.user_metadata?.full_name || profile.full_name || '',
    };

    const clearedSettings: BusinessSettings = {
      ...initialSettings,
      id: settings.id || '',
      user_id: user?.id || profile.id || '',
    };

    setProfile(clearedProfile);
    globalProfileCache = clearedProfile;
    setSettings(clearedSettings);
    globalSettingsCache = clearedSettings;
    setReviews([]);
    globalReviewsCache = [];
    setInvites([]);
    globalInvitesCache = [];
    setIsDemoMode(false);

    const uid = user?.id || profile.id;
    const isUidValid = uid && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid);

    if (isUidValid) {
      try {
        await fetch('/api/business/disconnect', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: uid }),
        }).catch(() => {});
      } catch (err) {
        console.warn('API /api/business/disconnect exception:', err);
      }
    }

    if (isSupabaseConfigured && supabase && isUidValid) {
      try {
        await Promise.allSettled([
          // 1. Clear profile tokens & google details
          supabase
            .from('profiles')
            .update({
              business_name: '',
              google_place_id: '',
              formatted_address: null,
              review_url: null,
              google_rating: 0,
              google_review_count: 0,
              google_connected: false,
              google_access_token: null,
              google_refresh_token: null,
              google_token_expiry: null,
              google_account_id: null,
              google_location_id: null,
              google_account_name: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', uid),

          // 2. Clear business_settings place_id, business_name, google connection tokens & review url
          supabase
            .from('business_settings')
            .update({
              place_id: null,
              business_name: null,
              google_review_url: null,
              google_access_token: null,
              google_refresh_token: null,
              connected_at: null,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', uid),

          // 3. Clear existing reviews for this business/user
          supabase
            .from('reviews')
            .delete()
            .eq('user_id', uid),
        ]);
      } catch (err) {
        console.warn('Supabase disconnectBusiness exception:', err);
      }
    }

    setIsSaving(false);
  };

  const resetAccountAndTestData = async () => {
    setIsSaving(true);

    const clearedProfile: Profile = {
      ...profile,
      business_name: '',
      business_category: '',
      google_place_id: '',
      formatted_address: '',
      review_url: '',
      google_rating: 0,
      google_review_count: 0,
      google_connected: false,
      google_access_token: null,
      google_refresh_token: null,
      google_token_expiry: null,
      google_account_id: null,
      google_location_id: null,
      google_account_name: null,
      phone: '',
      notification_phone: '',
    };

    const clearedSettings: BusinessSettings = {
      ...settings,
      custom_keywords: [],
      brand_voice: 'friendly_professional',
      auto_publish_5_star: false,
      notification_phone: '',
      sms_template: 'Hi {{customer_name}}, thank you for choosing {{business_name}}! Could you take 30 seconds to share your experience with us on Google? {{review_link}}',
    };

    // 1. Reset React State immediately for zero-delay UI zero-state
    setReviews([]);
    globalReviewsCache = [];
    setInvites([]);
    globalInvitesCache = [];
    setProfile(clearedProfile);
    globalProfileCache = clearedProfile;
    setSettings(clearedSettings);
    globalSettingsCache = clearedSettings;
    setIsDemoMode(false);

    // 2. Clear all local storage caches
    try {
      localStorage.removeItem(STORAGE_KEYS.PROFILE);
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.REVIEWS);
      localStorage.removeItem(STORAGE_KEYS.INVITES);
      localStorage.removeItem(STORAGE_KEYS.DEMO_MODE);
      localStorage.removeItem('ratingpulse_is_pro');
      localStorage.removeItem('ratingpulse_demo_auth');
      localStorage.removeItem('ratingpulse_places_recent');
      localStorage.setItem(STORAGE_KEYS.DEMO_MODE, 'false');
    } catch (e) {
      console.error('LocalStorage account reset error', e);
    }

    const uid = user?.id || profile.id;
    const isUidValid = uid && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid);

    // 3. Trigger backend reset API
    if (isUidValid) {
      try {
        await fetch('/api/account/reset', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId: uid }),
        });
      } catch (err) {
        console.warn('API /api/account/reset call exception:', err);
      }
    }

    // 4. Direct Supabase fallback cleanup
    if (isSupabaseConfigured && supabase && isUidValid) {
      try {
        await Promise.allSettled([
          supabase.from('review_invites').delete().eq('user_id', uid),
          supabase.from('reviews').delete().eq('user_id', uid),
          supabase
            .from('profiles')
            .update({
              business_name: '',
              business_category: '',
              google_place_id: '',
              formatted_address: null,
              review_url: null,
              google_rating: 0,
              google_review_count: 0,
              google_connected: false,
              google_access_token: null,
              google_refresh_token: null,
              google_token_expiry: null,
              google_account_id: null,
              google_location_id: null,
              google_account_name: null,
              phone: null,
              notification_phone: null,
              updated_at: new Date().toISOString(),
            })
            .eq('id', uid),
          supabase
            .from('business_settings')
            .update({
              brand_voice: 'friendly_professional',
              auto_publish_5_star: false,
              custom_keywords: [],
              sms_template: 'Hi {{customer_name}}, thank you for choosing {{business_name}}! Could you take 30 seconds to share your experience with us on Google? {{review_link}}',
              google_review_url: null,
              place_id: null,
              notification_phone: null,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', uid),
        ]);
      } catch (err) {
        console.warn('Supabase resetAccountAndTestData exception:', err);
      }
    }

    setIsSaving(false);
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
    syncGoogleReviews,
    disconnectBusiness,
    switchBusiness,
    clearWorkspaceData,
    resetAccountAndTestData,
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
    syncGoogleReviews: async () => 0,
    disconnectBusiness: async () => {},
    switchBusiness: async () => {},
    clearWorkspaceData: () => {},
    resetAccountAndTestData: async () => {},
    resetDemoData: () => {},
    pendingReviewsCount: globalReviewsCache.filter((r) => r.status === 'pending_approval').length,
    publishedReviewsCount: globalReviewsCache.filter((r) => r.status === 'published').length,
    privateFeedbackCount: globalInvitesCache.filter((inv) => isLowStarOrFeedback(inv)).length,
    unresolvedFeedbackCount: globalInvitesCache.filter((inv) => isLowStarOrFeedback(inv) && inv.resolution_status !== 'resolved').length,
    searchQuery: '',
    setSearchQuery: () => {},
  };
}