'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import {
  Profile,
  BusinessSettings,
  Review,
  Invite,
} from './supabase/types';
import {
  initialProfile,
  demoProfile,
  initialSettings,
  initialReviews,
  initialInvites,
  DEFAULT_BUSINESS,
  DEMO_BUSINESS,
} from './data';
import { supabase, isSupabaseConfigured } from './supabase/client';
import { useAuth } from './auth-context';
import { clearLocalWorkspaceState, registerCacheResetListener } from './workspace-cleanup';

export interface ActiveBusiness {
  id: string;
  name: string;
  category: string;
  address: string;
  phone: string;
  placeId: string;
  reviewUrl: string;
  rating: number;
  reviewCount: number;
  isConnected: boolean;
  isDemoMode: boolean;
}

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
  ACTIVE_BUSINESS: 'ratingpulse_active_business_v1',
};

export interface RatingPulseStoreContextType {
  activeBusiness: ActiveBusiness;
  setActiveBusiness: (newBusiness: Partial<ActiveBusiness>) => void;
  profile: Profile;
  settings: BusinessSettings;
  reviews: Review[];
  invites: Invite[];
  isLoaded: boolean;
  isSaving: boolean;
  isDemoMode: boolean;
  toggleDemoMode: (enable?: boolean) => void;
  approveReview: (reviewId: string, customReply?: string) => Promise<void>;
  regenerateAiReply: (reviewId: string, customKeywords?: string[]) => Promise<string | null>;
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
let globalProfileCache = demoProfile;
let globalSelectedBusinessCache: Partial<ActiveBusiness> | null = null;
let globalSettingsCache = initialSettings;
let globalReviewsCache: Review[] = [];
let globalInvitesCache = initialInvites;

// Register global in-memory cache clearer with workspace-cleanup
registerCacheResetListener(() => {
  globalProfileCache = demoProfile;
  globalSelectedBusinessCache = null;
  globalSettingsCache = initialSettings;
  globalReviewsCache = [];
  globalInvitesCache = [];
  globalHasLoaded = false;
});

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const [profile, setProfile] = useState<Profile>(globalProfileCache);
  const [selectedBusiness, setSelectedBusiness] = useState<Partial<ActiveBusiness> | null>(globalSelectedBusinessCache);
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
            supabase.from('review_invites').select('*').eq('user_id', currentUserId),
          ]);

          if (settingsRes.status === 'fulfilled' && settingsRes.value.data) {
            const sett = settingsRes.value.data as BusinessSettings;
            setSettings(sett);
            globalSettingsCache = sett;
          }

          const isConnected = Boolean(
            activeProfile?.google_place_id &&
            activeProfile?.google_place_id.trim() !== '' &&
            activeProfile?.google_connected !== false
          );

          if (invitesRes.status === 'fulfilled' && invitesRes.value.data) {
            const rawInvs = (invitesRes.value.data || []) as Invite[];
            const invs = isConnected
              ? [...rawInvs]
                  .filter((inv) => {
                    if (inv.place_id && activeProfile?.google_place_id && inv.place_id !== activeProfile.google_place_id) {
                      return false;
                    }
                    if (inv.business_id && activeProfile?.id && inv.business_id !== activeProfile.id) {
                      return false;
                    }
                    return true;
                  })
                  .sort((a, b) => {
                    const tA = new Date(a.sent_at || a.created_at || 0).getTime();
                    const tB = new Date(b.sent_at || b.created_at || 0).getTime();
                    return tB - tA;
                  })
              : [];
            console.log('Fetched Urgent Feedback / Review Invites:', invs);
            setInvites(invs);
            globalInvitesCache = invs;
            if (!isConnected) {
              try {
                localStorage.removeItem(STORAGE_KEYS.INVITES);
              } catch {}
            }
          } else if (!isConnected) {
            setInvites([]);
            globalInvitesCache = [];
            try {
              localStorage.removeItem(STORAGE_KEYS.INVITES);
            } catch {}
          }

          if (isConnected && activeProfile?.google_place_id) {
            const activePlaceId = activeProfile.google_place_id;
            const { data: revsData, error: revsErr } = await supabase
              .from('reviews')
              .select('*')
              .eq('user_id', currentUserId)
              .eq('place_id', activePlaceId);

            const rawRevs = (!revsErr && revsData) ? (revsData as Review[]).filter((r) => r.place_id === activePlaceId) : [];
            const validRevs = [...rawRevs].sort((a, b) => {
              const tA = new Date(a.created_at || a.review_date || a.published_at || 0).getTime();
              const tB = new Date(b.created_at || b.review_date || b.published_at || 0).getTime();
              return tB - tA;
            });

            if (validRevs.length > 0) {
              setReviews(validRevs);
              globalReviewsCache = validRevs;
              persistState(validRevs, globalInvitesCache, globalSettingsCache, activeProfile || undefined);
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
                    const fresh = syncData.reviews
                      .map((r: Review) => ({ ...r, place_id: r.place_id || activePlaceId }))
                      .filter((r: Review) => r.place_id === activePlaceId);
                    setReviews(fresh);
                    globalReviewsCache = fresh;
                    persistState(fresh, globalInvitesCache, globalSettingsCache, activeProfile || undefined);
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
        const storedActiveBiz = localStorage.getItem(STORAGE_KEYS.ACTIVE_BUSINESS);
        if (storedActiveBiz) {
          try {
            const parsedBiz = JSON.parse(storedActiveBiz);
            if (parsedBiz && (parsedBiz.name || parsedBiz.placeId)) {
              setSelectedBusiness(parsedBiz);
              globalSelectedBusinessCache = parsedBiz;
            }
          } catch {}
        }

        const storedProfile = localStorage.getItem(STORAGE_KEYS.PROFILE);
        const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
        const storedReviews = localStorage.getItem(STORAGE_KEYS.REVIEWS);
        const storedInvites = localStorage.getItem(STORAGE_KEYS.INVITES);

        let parsedProfile: Profile | null = null;
        if (storedProfile) {
          parsedProfile = JSON.parse(storedProfile);
          if (parsedProfile) {
            if (parsedProfile.phone && parsedProfile.phone.includes('555')) parsedProfile.phone = '';
            if (parsedProfile.notification_phone && parsedProfile.notification_phone.includes('555')) parsedProfile.notification_phone = '';
            if (parsedProfile.notify_negative_phone && parsedProfile.notify_negative_phone.includes('555')) parsedProfile.notify_negative_phone = '';
            setProfile(parsedProfile);
            globalProfileCache = parsedProfile;

            if (!globalSelectedBusinessCache && parsedProfile.business_name) {
              const seededBiz: Partial<ActiveBusiness> = {
                name: parsedProfile.business_name,
                placeId: parsedProfile.google_place_id || '',
                address: parsedProfile.formatted_address || '',
                reviewUrl: parsedProfile.review_url || '',
                rating: Number(parsedProfile.google_rating) || 5.0,
                reviewCount: Number(parsedProfile.google_review_count) || 0,
                category: parsedProfile.business_category || 'Local Business',
                isConnected: Boolean(parsedProfile.google_connected),
              };
              setSelectedBusiness(seededBiz);
              globalSelectedBusinessCache = seededBiz;
            }
          }
        }
        if (storedSettings) {
          const parsed = JSON.parse(storedSettings);
          if (parsed) {
            if (parsed.notification_phone && parsed.notification_phone.includes('555')) parsed.notification_phone = '';
            if (parsed.notify_negative_phone && parsed.notify_negative_phone.includes('555')) parsed.notify_negative_phone = '';
            setSettings(parsed);
            globalSettingsCache = parsed;
          }
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
              .eq('user_id', currentUserId);

            if (data) {
              const sorted = [...(data as Invite[])].sort((a, b) => {
                const tA = new Date(a.sent_at || a.created_at || 0).getTime();
                const tB = new Date(b.sent_at || b.created_at || 0).getTime();
                return tB - tA;
              });
              setInvites(sorted);
              globalInvitesCache = sorted;
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

  const setActiveBusiness = (newBusiness: Partial<ActiveBusiness>) => {
    setSelectedBusiness((prev) => {
      const merged = { ...(prev || {}), ...newBusiness };
      globalSelectedBusinessCache = merged;
      try {
        localStorage.setItem(STORAGE_KEYS.ACTIVE_BUSINESS, JSON.stringify(merged));
      } catch (e) {
        console.error('Failed writing active business to localStorage', e);
      }
      return merged;
    });

    setProfile((prev) => {
      const updatedProfile: Profile = {
        ...prev,
        business_name: newBusiness.name !== undefined ? newBusiness.name : prev.business_name,
        formatted_address: newBusiness.address !== undefined ? newBusiness.address : prev.formatted_address,
        google_place_id: newBusiness.placeId !== undefined ? newBusiness.placeId : prev.google_place_id,
        review_url: newBusiness.reviewUrl !== undefined ? newBusiness.reviewUrl : prev.review_url,
        google_rating: newBusiness.rating !== undefined ? newBusiness.rating : prev.google_rating,
        google_review_count: newBusiness.reviewCount !== undefined ? newBusiness.reviewCount : prev.google_review_count,
        business_category: newBusiness.category !== undefined ? newBusiness.category : prev.business_category,
        google_connected: newBusiness.isConnected !== undefined ? newBusiness.isConnected : true,
      };
      globalProfileCache = updatedProfile;
      try {
        localStorage.setItem(STORAGE_KEYS.PROFILE, JSON.stringify(updatedProfile));
      } catch {}
      return updatedProfile;
    });
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
      setProfile(demoProfile);
      setSettings(initialSettings);
      persistState(initialReviews, initialInvites, initialSettings, demoProfile);
    } else {
      setReviews([]);
      setInvites([]);
      setProfile(initialProfile);
      persistState([], [], settings, initialProfile);
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
      await fetch('/api/reviews/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId,
          replyText: finalReply,
          userId: uid,
          accountId: profile.google_account_id,
          locationId: profile.google_location_id,
          googleAccessToken: profile.google_access_token,
        }),
      });
    } catch (err) {
      console.warn('[approveReview /api/reviews/approve warning]:', err);
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

  const regenerateAiReply = async (reviewId: string, customKeywords?: string[]): Promise<string | null> => {
    setIsSaving(true);
    const target = reviews.find((r) => r.id === reviewId);
    if (!target) {
      setIsSaving(false);
      return null;
    }

    let keywords = customKeywords || settings.custom_keywords || [];
    const bizNameLower = (profile.business_name || '').toLowerCase();
    const isDentalBiz = bizNameLower.includes('dental') || bizNameLower.includes('dentist') || bizNameLower.includes('orthodont');
    
    // Filter out stale dental keywords if the business is not a dental clinic
    if (!isDentalBiz && Array.isArray(keywords)) {
      keywords = keywords.filter((k) => !k.toLowerCase().includes('dental') && !k.toLowerCase().includes('dentist') && !k.toLowerCase().includes('tooth') && !k.toLowerCase().includes('teeth'));
    }

    const tone = settings.brand_voice || 'friendly_professional';

    try {
      const response = await fetch('/api/reviews/generate-reply', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          reviewId: target.id,
          reviewText: target.review_text,
          authorName: target.author_name,
          rating: target.rating,
          businessName: profile.business_name || 'our team',
          businessCategory: profile.business_category || 'Local Business',
          tone,
          keywords,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        const newReply = data.replyText || data.reply;
        if (newReply) {
          const updated = reviews.map((r) =>
            r.id === reviewId ? { ...r, ai_draft_reply: newReply } : r
          );
          setReviews(updated);
          globalReviewsCache = updated;
          persistState(updated, invites, settings, profile);
          return newReply;
        }
      }
    } catch (e) {
      console.error('Failed to regenerate AI reply:', e);
    } finally {
      setIsSaving(false);
    }
    return null;
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
        name: 'David Montgomery',
        avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
        rating: 5,
        text: 'Super efficient service, clean modern vibe, and the dairy-free passionfruit gelato exceeded all my expectations. Highly recommend Scoop \'n Twist!',
        sentiment: 'positive' as const,
        keywords: ['passionfruit gelato', "Scoop 'n Twist", 'dairy-free'],
        replies: [
          'Hi David, thank you for visiting Scoop \'n Twist! We are delighted to hear you loved the passionfruit gelato and friendly atmosphere. See you next time!',
          'Hello David! It was a pleasure having you at Scoop \'n Twist. Hearing that our dairy-free flavors and welcoming team made your visit exceptional means everything to us!',
        ],
      },
      {
        name: 'Sarah Jenkins',
        avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
        rating: 5,
        text: 'Best artisanal ice cream in town! The salted caramel twist in a fresh homemade waffle cone is out of this world. Super clean shop and friendly crew.',
        sentiment: 'positive' as const,
        keywords: ['salted caramel', 'waffle cone', "Scoop 'n Twist"],
        replies: [
          'Hi Sarah, thank you for visiting Scoop \'n Twist! We are so glad you loved our salted caramel twist and fresh waffle cones. Looking forward to scooping your favorite flavor again soon!',
          'Thank you for such a wonderful review, Sarah! Handcrafting our waffle cones fresh every morning is our passion, and we are thrilled you enjoyed them!',
        ],
      },
      {
        name: 'Carlos Gomez',
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        rating: 5,
        text: 'Brought our entire soccer team after the game. They handled 15 custom sundaes and cones in under 10 minutes without breaking a sweat. Delicious flavors!',
        sentiment: 'positive' as const,
        keywords: ['custom sundaes', 'team treat', 'fast service'],
        replies: [
          'Hi Carlos! Congratulations to the team on a great game! We loved hosting everyone and scooping up delicious sundaes for the crew. Hope to see you all again next weekend!',
          'Thank you so much Carlos! Serving groups quickly with top-notch handcrafted desserts is our pride. We appreciate your glowing 5-star review!',
        ],
      },
      {
        name: 'Emily Watson',
        avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
        rating: 4,
        text: 'The ice cream flights are fantastic and the staff was so patient letting us sample seasonal flavors. Parking was a bit crowded on Friday evening, but worth it!',
        sentiment: 'neutral' as const,
        keywords: ['ice cream flight', 'seasonal flavors', 'friendly staff'],
        replies: [
          'Hi Emily, thank you for your kind 4-star feedback and for highlighting our ice cream flights! We appreciate your note regarding Friday parking rush—we have additional customer parking spots behind the shop for your next visit!',
          'Dear Emily, thank you for sharing your experience! We are glad you loved sampling our seasonal scoops. We look forward to welcoming you back soon!',
        ],
      },
      {
        name: 'Rachel Bailey',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
        rating: 5,
        text: 'The whole staff is incredible with kids. My daughter was so excited building her custom sundae bowl, and the team was patient and sweet.',
        sentiment: 'positive' as const,
        keywords: ['custom sundae', 'friendly team', "Scoop 'n Twist"],
        replies: [
          'Thank you for your heartwarming feedback, Rachel! Helping young dessert lovers create their dream custom sundaes is a joy for our entire team. Send our warmest regards to your daughter!',
          'Hi Rachel, we are so delighted to hear your daughter had such a fun time creating her sundae bowl! Thank you for choosing Scoop \'n Twist for your family treat.',
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

    const effectiveBusinessName = activeBusiness.name;
    const effectivePlaceId = activeBusiness.placeId || undefined;
    const effectiveReviewUrl = activeBusiness.reviewUrl || (effectivePlaceId ? `https://search.google.com/local/writereview?placeid=${effectivePlaceId}` : undefined);

    const newInvite: Invite = {
      id: validUuid,
      user_id: profile.id,
      business_id: profile.id,
      place_id: effectivePlaceId,
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
    qParams.set('business', effectiveBusinessName);
    if (effectivePlaceId) qParams.set('placeId', effectivePlaceId);
    if (effectiveReviewUrl) qParams.set('reviewUrl', effectiveReviewUrl);
    if (profile.email) qParams.set('ownerEmail', profile.email);
    const reviewGateUrl = `${appUrl}/rate/${validUuid}?${qParams.toString()}`;

    const businessId = effectivePlaceId || profile.id;
    const ownerEmail = profile.email || 'notifications@ratingpulse.co';

    try {
      const resp = await fetch('/api/send-sms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toPhone: customerPhone,
          customerName,
          businessName: effectiveBusinessName,
          businessId,
          placeId: effectivePlaceId,
          reviewLink: isDemoMode ? effectiveReviewUrl : reviewGateUrl,
          reviewUrl: isDemoMode ? effectiveReviewUrl : reviewGateUrl,
          reviewGateUrl,
          inviteId: validUuid,
          ownerEmail,
          isDemoMode,
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
            payload.business_id = uid;
          }
          if (effectivePlaceId) {
            payload.place_id = effectivePlaceId;
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

    const effectiveBusinessName = activeBusiness.name;
    const effectivePlaceId = activeBusiness.placeId || undefined;
    const effectiveReviewUrl = activeBusiness.reviewUrl || (effectivePlaceId ? `https://search.google.com/local/writereview?placeid=${effectivePlaceId}` : undefined);

    const newInvite: Invite = {
      id: validUuid,
      user_id: profile.id,
      business_id: profile.id,
      place_id: effectivePlaceId,
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
    if (effectiveBusinessName) qParams.set('business', effectiveBusinessName);
    if (effectivePlaceId) qParams.set('placeId', effectivePlaceId);
    if (effectiveReviewUrl) qParams.set('reviewUrl', effectiveReviewUrl);
    if (profile.email) qParams.set('ownerEmail', profile.email);
    const reviewGateUrl = `${appUrl}/rate/${validUuid}?${qParams.toString()}`;

    const businessId = effectivePlaceId || profile.id;
    const ownerEmail = profile.email || 'notifications@ratingpulse.co';

    try {
      const resp = await fetch('/api/send-email-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customerEmail,
          customerName,
          businessName: effectiveBusinessName,
          businessId,
          placeId: effectivePlaceId,
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
            payload.business_id = uid;
          }
          if (profile.google_place_id) {
            payload.place_id = profile.google_place_id;
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
          custom_keywords: Array.isArray(updated.custom_keywords) ? updated.custom_keywords : [],
          sms_template: updated.sms_template || '',
          notification_email: updated.notification_email || null,
          notification_phone: updated.notification_phone || null,
          sms_alerts_enabled: updated.sms_alerts_enabled ?? true,
          notify_email: updated.notify_email ?? true,
          notify_sms: updated.notify_sms ?? true,
          notify_negative_enabled: updated.notify_negative_enabled ?? true,
          notify_negative_email: updated.notify_negative_email ?? true,
          notify_negative_sms: updated.notify_negative_sms ?? true,
          notify_negative_phone: updated.notify_negative_phone || null,
          notify_positive_enabled: updated.notify_positive_enabled ?? true,
          notify_positive_email: updated.notify_positive_email ?? true,
          notify_positive_sms: updated.notify_positive_sms ?? false,
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
    const isPlaceChanged =
      newProfile.google_place_id !== undefined &&
      newProfile.google_place_id !== profile.google_place_id;

    const newPlaceId = newProfile.google_place_id !== undefined ? (newProfile.google_place_id || '') : (profile.google_place_id || '');

    let updatedReviews = reviews;

    if (isPlaceChanged) {
      if (!newPlaceId || newPlaceId.trim() === '') {
        updatedReviews = [];
        setReviews([]);
        globalReviewsCache = [];
        try {
          localStorage.removeItem(STORAGE_KEYS.REVIEWS);
        } catch {}
      } else {
        // Filter out any previous reviews from old place_ids
        updatedReviews = reviews.filter((r) => r.place_id === newPlaceId);
        setReviews(updatedReviews);
        globalReviewsCache = updatedReviews;
        try {
          if (updatedReviews.length === 0) {
            localStorage.removeItem(STORAGE_KEYS.REVIEWS);
          } else {
            localStorage.setItem(STORAGE_KEYS.REVIEWS, JSON.stringify(updatedReviews));
          }
        } catch {}
      }
    }

    const updated = { ...profile, ...newProfile };
    setProfile(updated);
    globalProfileCache = updated;

    if (newProfile.business_name !== undefined || newProfile.google_place_id !== undefined || newProfile.formatted_address !== undefined) {
      setSelectedBusiness((prev) => {
        const updatedBiz: Partial<ActiveBusiness> = {
          ...(prev || {}),
          name: newProfile.business_name !== undefined ? newProfile.business_name : prev?.name,
          placeId: newProfile.google_place_id !== undefined ? (newProfile.google_place_id || '') : prev?.placeId,
          address: newProfile.formatted_address !== undefined ? (newProfile.formatted_address || '') : prev?.address,
          reviewUrl: newProfile.review_url !== undefined ? (newProfile.review_url || '') : prev?.reviewUrl,
          rating: newProfile.google_rating !== undefined ? Number(newProfile.google_rating) : prev?.rating,
          reviewCount: newProfile.google_review_count !== undefined ? Number(newProfile.google_review_count) : prev?.reviewCount,
          category: newProfile.business_category !== undefined ? newProfile.business_category : prev?.category,
          isConnected: newProfile.google_connected !== undefined ? Boolean(newProfile.google_connected) : prev?.isConnected,
        };
        globalSelectedBusinessCache = updatedBiz;
        try {
          localStorage.setItem(STORAGE_KEYS.ACTIVE_BUSINESS, JSON.stringify(updatedBiz));
        } catch {}
        return updatedBiz;
      });
    }

    persistState(updatedReviews, invites, settings, updated);

    const uid = user?.id || updated.id;
    const isUidValid = uid && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(uid);

    if (isSupabaseConfigured && supabase && isUidValid) {
      try {
        const cleanProfilePayload: Record<string, unknown> = {
          id: uid,
          email: updated.email || user?.email || '',
          full_name: updated.full_name || null,
          business_name: updated.business_name || null,
          business_category: updated.business_category || null,
          google_place_id: updated.google_place_id || '',
          formatted_address: updated.formatted_address || null,
          review_url: updated.review_url || null,
          google_rating: Number(updated.google_rating) || 0,
          google_review_count: Number(updated.google_review_count) || 0,
          google_connected: Boolean(updated.google_connected),
          phone: updated.phone || null,
          notification_email: updated.notification_email || null,
          notification_phone: updated.notification_phone || null,
          sms_alerts_enabled: updated.sms_alerts_enabled ?? true,
          notify_negative_enabled: updated.notify_negative_enabled ?? true,
          notify_negative_email: updated.notify_negative_email ?? true,
          notify_negative_sms: updated.notify_negative_sms ?? true,
          notify_negative_phone: updated.notify_negative_phone || null,
          notify_positive_enabled: updated.notify_positive_enabled ?? true,
          notify_positive_email: updated.notify_positive_email ?? true,
          notify_positive_sms: updated.notify_positive_sms ?? false,
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
          business_name: updated.business_name || null,
          place_id: updated.google_place_id || null,
          google_review_url: updated.review_url || null,
          brand_voice: settings.brand_voice || 'friendly_professional',
          auto_publish_5_star: Boolean(settings.auto_publish_5_star),
          custom_keywords: Array.isArray(settings.custom_keywords) ? settings.custom_keywords : ['artisanal waffle cone', 'salted caramel', 'gelato', 'sundae'],
          sms_template: settings.sms_template || '',
          notification_email: updated.notification_email || settings.notification_email || null,
          notification_phone: updated.notification_phone || settings.notification_phone || null,
          sms_alerts_enabled: updated.sms_alerts_enabled ?? settings.sms_alerts_enabled ?? true,
          notify_email: settings.notify_email ?? true,
          notify_sms: settings.notify_sms ?? true,
          notify_negative_enabled: updated.notify_negative_enabled ?? settings.notify_negative_enabled ?? true,
          notify_negative_email: updated.notify_negative_email ?? settings.notify_negative_email ?? true,
          notify_negative_sms: updated.notify_negative_sms ?? settings.notify_negative_sms ?? true,
          notify_negative_phone: updated.notify_negative_phone || settings.notify_negative_phone || null,
          notify_positive_enabled: updated.notify_positive_enabled ?? settings.notify_positive_enabled ?? true,
          notify_positive_email: updated.notify_positive_email ?? settings.notify_positive_email ?? true,
          notify_positive_sms: updated.notify_positive_sms ?? settings.notify_positive_sms ?? false,
          updated_at: new Date().toISOString(),
        };

        const { error: settingsError } = await supabase
          .from('business_settings')
          .upsert(cleanSettingsPayload, { onConflict: 'user_id' });

        if (settingsError) {
          console.error('Supabase save error details (business_settings):', settingsError.message, settingsError.details, settingsError.hint);
        }

        // If place ID changed and is non-empty, query existing reviews for the new place in Supabase
        if (isPlaceChanged && newPlaceId && newPlaceId.trim() !== '') {
          const { data: placeRevs } = await supabase
            .from('reviews')
            .select('*')
            .eq('user_id', uid)
            .eq('place_id', newPlaceId);

          if (placeRevs && placeRevs.length > 0) {
            const raw = (placeRevs as Review[]).filter((r) => r.place_id === newPlaceId);
            const freshRevs = [...raw].sort((a, b) => {
              const tA = new Date(a.created_at || a.review_date || a.published_at || 0).getTime();
              const tB = new Date(b.created_at || b.review_date || b.published_at || 0).getTime();
              return tB - tA;
            });
            setReviews(freshRevs);
            globalReviewsCache = freshRevs;
            persistState(freshRevs, invites, settings, updated);
          }
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
      if (data.success && Array.isArray(data.reviews)) {
        // Strictly filter to ensure ONLY reviews matching targetPlaceId are included
        const fetchedRevs: Review[] = data.reviews
          .map((r: Review) => ({ ...r, place_id: r.place_id || targetPlaceId }))
          .filter((r: Review) => r.place_id === targetPlaceId);

        setReviews(fetchedRevs);
        globalReviewsCache = fetchedRevs;

        const updatedProfile: Profile = {
          ...profile,
          google_place_id: targetPlaceId,
          business_name: (data.stats?.place_name && data.stats.place_name.trim() !== '') ? data.stats.place_name : profile.business_name,
          google_connected: true,
          google_rating: Number(data.stats?.average_rating) || profile.google_rating,
          google_review_count: Number(data.stats?.total_reviews) || fetchedRevs.length || profile.google_review_count,
        };

        if (data.stats) {
          setProfile(updatedProfile);
          globalProfileCache = updatedProfile;
        }

        persistState(fetchedRevs, invites, settings, updatedProfile);
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
          supabase.from('review_invites').select('*').eq('user_id', businessId),
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
          const rawInvs = (invitesRes.value.data || []) as Invite[];
          const invs = [...rawInvs]
            .filter((inv) => {
              if (inv.place_id && switchedProfile?.google_place_id && inv.place_id !== switchedProfile.google_place_id) {
                return false;
              }
              if (inv.business_id && businessId && inv.business_id !== businessId) {
                return false;
              }
              return true;
            })
            .sort((a, b) => {
              const tA = new Date(a.sent_at || a.created_at || 0).getTime();
              const tB = new Date(b.sent_at || b.created_at || 0).getTime();
              return tB - tA;
            });
          setInvites(invs);
          globalInvitesCache = invs;
        }

        const switchedPlaceId = switchedProfile?.google_place_id;
        if (switchedPlaceId) {
          const { data: revsData, error: revsErr } = await supabase
            .from('reviews')
            .select('*')
            .eq('place_id', switchedPlaceId);

          if (!revsErr && revsData && revsData.length > 0) {
            const rawRevs = revsData as Review[];
            const revs = [...rawRevs].sort((a, b) => {
              const tA = new Date(a.created_at || a.review_date || a.published_at || 0).getTime();
              const tB = new Date(b.created_at || b.review_date || b.published_at || 0).getTime();
              return tB - tA;
            });
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
    setSelectedBusiness(null);
    globalSelectedBusinessCache = null;
    setSettings(clearedSettings);
    globalSettingsCache = clearedSettings;
    setReviews([]);
    globalReviewsCache = [];
    setInvites([]);
    globalInvitesCache = [];
    setIsDemoMode(false);
    try {
      localStorage.removeItem(STORAGE_KEYS.INVITES);
      localStorage.removeItem(STORAGE_KEYS.REVIEWS);
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_BUSINESS);
    } catch {}

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

          // 4. Clear existing review invites for this business/user
          supabase
            .from('review_invites')
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
    setSelectedBusiness(null);
    globalSelectedBusinessCache = null;
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
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_BUSINESS);
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
    setProfile(demoProfile);
    setSettings(initialSettings);
    setReviews(initialReviews);
    setInvites(initialInvites);
    setSelectedBusiness(null);
    globalSelectedBusinessCache = null;
    setIsDemoMode(true);
    try {
      localStorage.setItem(STORAGE_KEYS.DEMO_MODE, 'true');
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_BUSINESS);
    } catch {
      // ignore
    }
    persistState(initialReviews, initialInvites, initialSettings, demoProfile);
  };

  const activeBusiness: ActiveBusiness = useMemo(() => {
    const effectiveName = selectedBusiness?.name || profile.business_name;
    const effectivePlaceId = selectedBusiness?.placeId || profile.google_place_id;
    const effectiveAddress = selectedBusiness?.address || profile.formatted_address;
    const effectiveCategory = selectedBusiness?.category || profile.business_category;
    const effectiveRating = selectedBusiness?.rating !== undefined ? selectedBusiness.rating : (Number(profile.google_rating) || 0);
    const effectiveReviewCount = selectedBusiness?.reviewCount !== undefined ? selectedBusiness.reviewCount : (Number(profile.google_review_count) || 0);
    const effectivePhone = selectedBusiness?.phone || profile.phone;
    const effectiveReviewUrl =
      selectedBusiness?.reviewUrl ||
      profile.review_url ||
      (effectivePlaceId ? `https://search.google.com/local/writereview?placeid=${effectivePlaceId}` : '');

    const hasExplicitSelection = Boolean(
      (effectiveName && effectiveName.trim() !== '' && effectiveName !== DEFAULT_BUSINESS.name) ||
      (effectivePlaceId && effectivePlaceId.trim() !== '' && effectivePlaceId !== DEFAULT_BUSINESS.placeId)
    );

    if (isDemoMode) {
      if (hasExplicitSelection || (effectiveName && effectiveName.trim() !== '')) {
        return {
          id: selectedBusiness?.id || profile.id || DEFAULT_BUSINESS.id,
          name: effectiveName || DEFAULT_BUSINESS.name,
          category: effectiveCategory || DEFAULT_BUSINESS.category,
          address: effectiveAddress || DEFAULT_BUSINESS.address,
          phone: effectivePhone || DEFAULT_BUSINESS.phone || '',
          placeId: effectivePlaceId || DEFAULT_BUSINESS.placeId,
          reviewUrl: effectiveReviewUrl || DEFAULT_BUSINESS.reviewUrl,
          rating: effectiveRating > 0 ? effectiveRating : DEFAULT_BUSINESS.rating,
          reviewCount: effectiveReviewCount > 0 ? effectiveReviewCount : (profile.google_review_count || DEFAULT_BUSINESS.totalReviews),
          isConnected: true,
          isDemoMode: true,
        };
      }

      // Default fallback in Demo Mode: DEFAULT_BUSINESS (RatingPulse)
      return {
        id: DEFAULT_BUSINESS.id,
        name: DEFAULT_BUSINESS.name,
        category: DEFAULT_BUSINESS.category,
        address: DEFAULT_BUSINESS.address,
        phone: '',
        placeId: DEFAULT_BUSINESS.placeId,
        reviewUrl: DEFAULT_BUSINESS.reviewUrl,
        rating: DEFAULT_BUSINESS.rating,
        reviewCount: DEFAULT_BUSINESS.totalReviews,
        isConnected: true,
        isDemoMode: true,
      };
    }

    const isConnected = Boolean(
      effectivePlaceId &&
      effectiveName &&
      profile.google_connected !== false
    );

    return {
      id: profile.id || user?.id || 'live-business',
      name: effectiveName || 'No Business Connected',
      category: effectiveCategory || 'Local Business',
      address: effectiveAddress || 'Address not set',
      phone: effectivePhone || '',
      placeId: effectivePlaceId || '',
      reviewUrl: effectiveReviewUrl,
      rating: effectiveRating,
      reviewCount: effectiveReviewCount,
      isConnected,
      isDemoMode: false,
    };
  }, [isDemoMode, selectedBusiness, profile, user?.id]);

  const activeProfile: Profile = isDemoMode
    ? {
        ...demoProfile,
        ...profile,
        business_name: selectedBusiness?.name || profile.business_name || demoProfile.business_name,
        google_place_id: selectedBusiness?.placeId || profile.google_place_id || demoProfile.google_place_id,
        review_url: selectedBusiness?.reviewUrl || profile.review_url || demoProfile.review_url,
        formatted_address: selectedBusiness?.address || profile.formatted_address || demoProfile.formatted_address,
        google_rating: selectedBusiness?.rating || profile.google_rating || demoProfile.google_rating,
        google_review_count: selectedBusiness?.reviewCount || profile.google_review_count || demoProfile.google_review_count,
        google_connected: true,
      }
    : profile;

  const value: RatingPulseStoreContextType = {
    activeBusiness,
    setActiveBusiness,
    profile: activeProfile,
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
  const fallbackActiveBusiness: ActiveBusiness = {
    id: DEFAULT_BUSINESS.id,
    name: DEFAULT_BUSINESS.name,
    category: DEFAULT_BUSINESS.category,
    address: DEFAULT_BUSINESS.address,
    phone: '',
    placeId: DEFAULT_BUSINESS.placeId,
    reviewUrl: DEFAULT_BUSINESS.reviewUrl,
    rating: DEFAULT_BUSINESS.rating,
    reviewCount: DEFAULT_BUSINESS.totalReviews,
    isConnected: true,
    isDemoMode: true,
  };

  return {
    activeBusiness: fallbackActiveBusiness,
    setActiveBusiness: () => {},
    profile: globalProfileCache,
    settings: globalSettingsCache,
    reviews: globalReviewsCache,
    invites: globalInvitesCache,
    isLoaded: globalHasLoaded,
    isSaving: false,
    isDemoMode: true,
    toggleDemoMode: () => {},
    approveReview: async () => {},
    regenerateAiReply: async () => null,
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

export function useActiveBusiness(): ActiveBusiness {
  const { activeBusiness } = useRatingPulseStore();
  return activeBusiness;
}