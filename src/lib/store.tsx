'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
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
  DEMO_REVIEWS,
  DEMO_INVITES,
  DEMO_SETTINGS,
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

export interface RatingPulseStoreState {
  hasHydrated: boolean;
  isDemoMode: boolean;
  demoBusiness: ActiveBusiness;
  liveBusiness: ActiveBusiness | null;
  profile: Profile;
  settings: BusinessSettings;
  reviews: Review[];
  invites: Invite[];
  isLoaded: boolean;
  isSaving: boolean;
  searchQuery: string;

  // Actions
  setHasHydrated: (val: boolean) => void;
  toggleDemoMode: (enable?: boolean) => void;
  setDemoBusiness: (business: Partial<ActiveBusiness>) => void;
  setLiveBusiness: (business: Partial<ActiveBusiness> | null) => void;
  setActiveBusiness: (business: Partial<ActiveBusiness>) => void;
  setSearchQuery: (query: string) => void;
  setReviews: (reviews: Review[]) => void;
  setInvites: (invites: Invite[]) => void;
  setProfile: (profile: Profile) => void;
  setSettings: (settings: BusinessSettings) => void;
  setIsLoaded: (val: boolean) => void;
  setIsSaving: (val: boolean) => void;

  disconnectBusiness: () => Promise<void>;
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
  switchBusiness: (businessId: string) => Promise<void>;
  clearWorkspaceData: () => void;
  resetAccountAndTestData: () => Promise<void>;
  resetDemoData: () => void;
}

const defaultDemoBusiness: ActiveBusiness = {
  id: DEFAULT_BUSINESS.id || 'demo-ratingpulse',
  name: DEFAULT_BUSINESS.name || 'RatingPulse',
  category: DEFAULT_BUSINESS.category || 'Software & Reputation Management',
  address: DEFAULT_BUSINESS.address || 'Rochester, NY',
  phone: '(585) 203-1280',
  placeId: DEFAULT_BUSINESS.placeId || 'demo_ratingpulse_001',
  reviewUrl: DEFAULT_BUSINESS.reviewUrl || 'https://search.google.com/local/writereview?placeid=demo_ratingpulse_001',
  rating: DEFAULT_BUSINESS.rating || 5.0,
  reviewCount: DEFAULT_BUSINESS.totalReviews || 48,
  isConnected: true,
  isDemoMode: true,
};

export const useRatingPulseZustand = create<RatingPulseStoreState>()(
  persist(
    (set, get) => ({
      hasHydrated: false,
      isDemoMode: true,
      demoBusiness: defaultDemoBusiness,
      liveBusiness: null,
      profile: initialProfile,
      settings: DEMO_SETTINGS || initialSettings,
      reviews: DEMO_REVIEWS || initialReviews,
      invites: DEMO_INVITES || initialInvites,
      isLoaded: false,
      isSaving: false,
      searchQuery: '',

      setHasHydrated: (val: boolean) => set({ hasHydrated: val }),

      toggleDemoMode: (enable?: boolean) => {
        set((state) => {
          const next = typeof enable === 'boolean' ? enable : !state.isDemoMode;
          if (next) {
            return {
              isDemoMode: true,
              reviews: DEMO_REVIEWS || initialReviews,
              invites: DEMO_INVITES || initialInvites,
              settings: DEMO_SETTINGS || initialSettings,
            };
          } else {
            return {
              isDemoMode: false,
              reviews: state.liveBusiness?.placeId ? state.reviews : [],
              invites: state.liveBusiness?.placeId ? state.invites : [],
            };
          }
        });
      },

      setDemoBusiness: (business: Partial<ActiveBusiness>) => {
        set((state) => ({
          demoBusiness: {
            ...state.demoBusiness,
            ...business,
            isConnected: true,
            isDemoMode: true,
          },
        }));
      },

      setLiveBusiness: (business: Partial<ActiveBusiness> | null) => {
        set(() => ({
          liveBusiness: business
            ? {
                id: business.id || '',
                name: business.name || '',
                category: business.category || '',
                address: business.address || '',
                phone: business.phone || '',
                placeId: business.placeId || '',
                reviewUrl: business.reviewUrl || '',
                rating: business.rating || 0,
                reviewCount: business.reviewCount || 0,
                isConnected: Boolean(business.placeId && business.placeId.trim() !== ''),
                isDemoMode: false,
              }
            : null,
        }));
      },

      setActiveBusiness: (business: Partial<ActiveBusiness>) => {
        const { isDemoMode } = get();
        if (isDemoMode) {
          get().setDemoBusiness(business);
        } else {
          get().setLiveBusiness(business);
        }
      },

      setSearchQuery: (query: string) => set({ searchQuery: query }),
      setReviews: (reviews: Review[]) => set({ reviews }),
      setInvites: (invites: Invite[]) => set({ invites }),
      setProfile: (profile: Profile) => set({ profile }),
      setSettings: (settings: BusinessSettings) => set({ settings }),
      setIsLoaded: (val: boolean) => set({ isLoaded: val }),
      setIsSaving: (val: boolean) => set({ isSaving: val }),

      disconnectBusiness: async () => {
        set({
          liveBusiness: null,
          reviews: [],
          invites: [],
        });

        const currentProfile = get().profile;
        if (isSupabaseConfigured && supabase && currentProfile?.id) {
          try {
            await supabase
              .from('profiles')
              .update({
                google_connected: false,
                google_place_id: null,
                business_name: null,
                formatted_address: null,
                review_url: null,
                google_rating: null,
                google_review_count: 0,
                updated_at: new Date().toISOString(),
              })
              .eq('id', currentProfile.id);
          } catch (err) {
            console.error('Error disconnecting business in Supabase:', err);
          }
        }
      },

      approveReview: async (reviewId: string, customReply?: string) => {
        const state = get();
        const existing = state.reviews.find((r) => r.id === reviewId);
        if (!existing) return;

        const updatedReply = customReply !== undefined ? customReply : existing.draft_reply_text;
        const now = new Date().toISOString();

        set({
          reviews: state.reviews.map((r) =>
            r.id === reviewId
              ? {
                  ...r,
                  status: 'published',
                  draft_reply_text: updatedReply,
                  ai_reply_draft: updatedReply,
                  final_reply_text: updatedReply,
                  reply_published_at: now,
                  replied_at: now,
                }
              : r
          ),
        });

        if (isSupabaseConfigured && supabase && !state.isDemoMode) {
          try {
            await supabase
              .from('reviews')
              .update({
                status: 'published',
                draft_reply_text: updatedReply,
                final_reply_text: updatedReply,
                ai_reply_draft: updatedReply,
                reply_published_at: now,
                replied_at: now,
              })
              .eq('id', reviewId);
          } catch (err) {
            console.error('Failed to update review in Supabase:', err);
          }
        }
      },

      regenerateAiReply: async (reviewId: string, customKeywords?: string[]) => {
        const state = get();
        const review = state.reviews.find((r) => r.id === reviewId);
        if (!review) return null;

        const activeBiz = state.isDemoMode ? state.demoBusiness : state.liveBusiness;
        const bizName = activeBiz?.name || 'RatingPulse';
        const keywords = customKeywords || state.settings?.seo_keywords || ['friendly service', '5-star reviews'];

        try {
          const res = await fetch('/api/reviews/generate-reply', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              author_name: review.author_name,
              rating: review.rating,
              review_text: review.review_text,
              business_name: bizName,
              keywords,
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const reply = data.reply;
            if (reply) {
              set({
                reviews: state.reviews.map((r) =>
                  r.id === reviewId ? { ...r, draft_reply_text: reply, ai_reply_draft: reply } : r
                ),
              });
              return reply;
            }
          }
        } catch (err) {
          console.error('Error generating AI reply:', err);
        }

        const fallbackReply = `Hi ${review.author_name || 'there'}, thank you for sharing your feedback with ${bizName}! We truly appreciate your support.`;
        set({
          reviews: state.reviews.map((r) =>
            r.id === reviewId ? { ...r, draft_reply_text: fallbackReply, ai_reply_draft: fallbackReply } : r
          ),
        });
        return fallbackReply;
      },

      updateDraftText: (reviewId: string, text: string) => {
        set((state) => ({
          reviews: state.reviews.map((r) =>
            r.id === reviewId ? { ...r, draft_reply_text: text, ai_reply_draft: text } : r
          ),
        }));
      },

      simulateIncomingGoogleReview: () => {
        const state = get();
        const activeBiz = state.isDemoMode ? state.demoBusiness : state.liveBusiness;
        const bizName = activeBiz?.name || 'RatingPulse';

        const sampleNames = ['Alex Morgan', 'Jordan Lee', 'Taylor Smith', 'Sam Wilson', 'Chris Evans'];
        const sampleTexts = [
          `Incredible experience with ${bizName}! The team was super communicative, professional, and delivered top-notch results.`,
          `Outstanding service from ${bizName}! Fast turnaround and wonderful customer support. Highly recommend to everyone!`,
          `Top tier quality! ${bizName} made the entire process completely seamless and stress-free.`,
        ];

        const randomIdx = Math.floor(Math.random() * sampleNames.length);
        const name = sampleNames[randomIdx];
        const text = sampleTexts[randomIdx % sampleTexts.length];
        const now = new Date().toISOString();

        const newReview: Review = {
          id: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          user_id: state.profile?.id || 'demo_user',
          place_id: activeBiz?.placeId || 'demo_ratingpulse_001',
          author_name: name,
          rating: 5,
          review_text: text,
          review_date: now,
          ai_draft_reply: `Thank you so much ${name}! We are thrilled to hear you had such a great experience with ${bizName}. We look forward to working with you again!`,
          draft_reply_text: `Thank you so much ${name}! We are thrilled to hear you had such a great experience with ${bizName}. We look forward to working with you again!`,
          ai_reply_draft: `Thank you so much ${name}! We are thrilled to hear you had such a great experience with ${bizName}. We look forward to working with you again!`,
          status: 'pending_approval',
          sentiment: 'positive',
          keywords_used: ['friendly service', 'RatingPulse'],
          published_at: now,
          created_at: now,
        };

        set({
          reviews: [newReview, ...state.reviews],
        });

        return newReview;
      },

      sendSmsInvite: async (customerName: string, customerPhone: string, serviceType?: string) => {
        const state = get();
        const activeBiz = state.isDemoMode ? state.demoBusiness : state.liveBusiness;
        const now = new Date().toISOString();

        const newInvite: Invite = {
          id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          user_id: state.profile?.id || 'demo_user',
          business_id: activeBiz?.id || 'demo_biz',
          place_id: activeBiz?.placeId || 'demo_ratingpulse_001',
          customer_name: customerName,
          customer_phone: customerPhone,
          service_type: serviceType || 'Service Visit',
          channel: 'sms',
          status: 'sent',
          sent_at: now,
          created_at: now,
        };

        set({
          invites: [newInvite, ...state.invites],
        });

        if (!state.isDemoMode) {
          try {
            await fetch('/api/invites/send', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                customerName,
                customerPhone,
                serviceType,
                channel: 'sms',
                businessName: activeBiz?.name,
                placeId: activeBiz?.placeId,
              }),
            });
          } catch (err) {
            console.error('Failed to send SMS invite API:', err);
          }
        }

        return newInvite;
      },

      sendEmailInvite: async (customerName: string, customerEmail: string, serviceType?: string) => {
        const state = get();
        const activeBiz = state.isDemoMode ? state.demoBusiness : state.liveBusiness;
        const now = new Date().toISOString();

        const newInvite: Invite = {
          id: `inv_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          user_id: state.profile?.id || 'demo_user',
          business_id: activeBiz?.id || 'demo_biz',
          place_id: activeBiz?.placeId || 'demo_ratingpulse_001',
          customer_name: customerName,
          customer_phone: '',
          customer_email: customerEmail,
          service_type: serviceType || 'Service Visit',
          channel: 'email',
          status: 'sent',
          sent_at: now,
          created_at: now,
        };

        set({
          invites: [newInvite, ...state.invites],
        });

        return newInvite;
      },

      updateInviteResolution: async (inviteId: string, resolution: 'unresolved' | 'resolved' | 'needs_follow_up') => {
        set((state) => ({
          invites: state.invites.map((inv) =>
            inv.id === inviteId ? { ...inv, resolution_status: resolution, status: resolution === 'resolved' ? 'resolved' : inv.status } : inv
          ),
        }));
      },

      updateSettings: async (newSettings: Partial<BusinessSettings>) => {
        set((state) => ({
          settings: { ...state.settings, ...newSettings },
        }));

        const currentProfile = get().profile;
        if (isSupabaseConfigured && supabase && currentProfile?.id && !get().isDemoMode) {
          try {
            await supabase
              .from('business_settings')
              .upsert({
                user_id: currentProfile.id,
                ...newSettings,
                updated_at: new Date().toISOString(),
              });
          } catch (err) {
            console.error('Failed to update settings in Supabase:', err);
          }
        }
      },

      updateProfile: async (newProfile: Partial<Profile>) => {
        set((state) => ({
          profile: { ...state.profile, ...newProfile },
        }));

        const currentProfile = get().profile;
        if (isSupabaseConfigured && supabase && currentProfile?.id && !get().isDemoMode) {
          try {
            await supabase
              .from('profiles')
              .update({
                ...newProfile,
                updated_at: new Date().toISOString(),
              })
              .eq('id', currentProfile.id);
          } catch (err) {
            console.error('Failed to update profile in Supabase:', err);
          }
        }
      },

      syncGoogleReviews: async (overridePlaceId?: string) => {
        const state = get();
        const activeBiz = state.isDemoMode ? state.demoBusiness : state.liveBusiness;
        const placeId = overridePlaceId || activeBiz?.placeId;

        if (!placeId) return 0;

        try {
          const res = await fetch('/api/sync-reviews', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              place_id: placeId,
              business_id: state.profile?.id || 'demo_user',
              user_id: state.profile?.id || 'demo_user',
            }),
          });

          if (res.ok) {
            const data = await res.json();
            return data.syncedCount || data.count || 0;
          }
        } catch (err) {
          console.error('Error syncing Google reviews:', err);
        }
        return 0;
      },

      switchBusiness: async (businessId: string) => {
        // Switch between connected businesses if multi-location
      },

      clearWorkspaceData: () => {
        clearLocalWorkspaceState();
        set({
          liveBusiness: null,
          reviews: [],
          invites: [],
        });
      },

      resetAccountAndTestData: async () => {
        get().clearWorkspaceData();
      },

      resetDemoData: () => {
        set({
          demoBusiness: defaultDemoBusiness,
          reviews: DEMO_REVIEWS || initialReviews,
          invites: DEMO_INVITES || initialInvites,
          settings: DEMO_SETTINGS || initialSettings,
        });
      },
    }),
    {
      name: 'ratingpulse-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        isDemoMode: state.isDemoMode,
        demoBusiness: state.demoBusiness,
        liveBusiness: state.liveBusiness,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state.setHasHydrated(true);
          if (state.demoBusiness && state.demoBusiness.name && /scoop|twist|apex/i.test(state.demoBusiness.name)) {
            state.setDemoBusiness(defaultDemoBusiness);
          }
          if (state.liveBusiness && (state.liveBusiness.placeId?.startsWith('demo_') || state.liveBusiness.id?.startsWith('demo_'))) {
            state.setLiveBusiness(null);
          }
        }
      },
    }
  )
);

// Register cache reset listener with workspace-cleanup
registerCacheResetListener(() => {
  const store = useRatingPulseZustand.getState();
  store.setLiveBusiness(null);
  store.setReviews([]);
  store.setInvites([]);
});

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
  hasHydrated: boolean;
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

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const { user, isLoading: authLoading } = useAuth();
  const zustandStore = useRatingPulseZustand();

  useEffect(() => {
    const store = useRatingPulseZustand.getState();
    store.setHasHydrated(true);

    // Migration guard: clean legacy localStorage entries if they contain Scoop or food data
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = localStorage.getItem('ratingpulse-storage');
        if (raw && /scoop|twist|apex|cone|sundae|flight/i.test(raw)) {
          store.resetDemoData();
        }
      }
    } catch {}
  }, []);

  // Sync Supabase live profile when authenticated
  useEffect(() => {
    if (authLoading || !user?.id) return;

    const currentUserId = user.id;

    async function loadSupabaseData() {
      if (!isSupabaseConfigured || !supabase) return;

      try {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentUserId)
          .maybeSingle();

        if (profileData) {
          const prof = profileData as Profile;
          zustandStore.setProfile(prof);

          if (prof.google_connected && prof.google_place_id && !prof.google_place_id.startsWith('demo_')) {
            zustandStore.setLiveBusiness({
              id: prof.id,
              name: prof.business_name || '',
              category: prof.business_category || '',
              address: prof.formatted_address || '',
              phone: prof.phone || '',
              placeId: prof.google_place_id,
              reviewUrl: prof.review_url || `https://search.google.com/local/writereview?placeid=${prof.google_place_id}`,
              rating: Number(prof.google_rating) || 0,
              reviewCount: prof.google_review_count || 0,
              isConnected: true,
              isDemoMode: false,
            });

            // Fetch live reviews
            const { data: revsData } = await supabase
              .from('reviews')
              .select('*')
              .eq('user_id', currentUserId)
              .eq('place_id', prof.google_place_id);

            if (revsData && revsData.length > 0) {
              zustandStore.setReviews(revsData as Review[]);
            }
          }
        }

        const { data: settingsData } = await supabase
          .from('business_settings')
          .select('*')
          .eq('user_id', currentUserId)
          .maybeSingle();

        if (settingsData) {
          zustandStore.setSettings(settingsData as BusinessSettings);
        }

        const { data: invitesData } = await supabase
          .from('review_invites')
          .select('*')
          .eq('user_id', currentUserId);

        if (invitesData) {
          zustandStore.setInvites(invitesData as Invite[]);
        }

        zustandStore.setIsLoaded(true);
      } catch (err) {
        console.error('Error fetching Supabase user data:', err);
      }
    }

    loadSupabaseData();
  }, [user?.id, authLoading]);

  return <>{children}</>;
}

export function useRatingPulseStore(): RatingPulseStoreContextType {
  const store = useRatingPulseZustand();

  const activeBusiness: ActiveBusiness = useMemo(() => {
    if (store.isDemoMode) {
      return {
        ...store.demoBusiness,
        isConnected: true,
        isDemoMode: true,
      };
    }

    if (store.liveBusiness && store.liveBusiness.placeId && !store.liveBusiness.placeId.startsWith('demo_')) {
      return {
        ...store.liveBusiness,
        isConnected: true,
        isDemoMode: false,
      };
    }

    return {
      id: '',
      name: '',
      category: '',
      address: '',
      phone: '',
      placeId: '',
      reviewUrl: '',
      rating: 0,
      reviewCount: 0,
      isConnected: false,
      isDemoMode: false,
    };
  }, [store.isDemoMode, store.demoBusiness, store.liveBusiness]);

  const activeReviews = useMemo(() => {
    if (store.isDemoMode) {
      return store.reviews && store.reviews.length > 0 ? store.reviews : (DEMO_REVIEWS || initialReviews);
    }
    if (store.liveBusiness && store.liveBusiness.isConnected) {
      return store.reviews;
    }
    return [];
  }, [store.isDemoMode, store.reviews, store.liveBusiness]);

  const activeInvites = useMemo(() => {
    if (store.isDemoMode) {
      return store.invites && store.invites.length > 0 ? store.invites : (DEMO_INVITES || initialInvites);
    }
    if (store.liveBusiness && store.liveBusiness.isConnected) {
      return store.invites;
    }
    return [];
  }, [store.isDemoMode, store.invites, store.liveBusiness]);

  const activeProfile: Profile = useMemo(() => {
    if (store.isDemoMode) {
      return {
        ...demoProfile,
        ...store.profile,
        business_name: store.demoBusiness.name,
        google_place_id: store.demoBusiness.placeId,
        review_url: store.demoBusiness.reviewUrl,
        formatted_address: store.demoBusiness.address,
        google_rating: store.demoBusiness.rating,
        google_review_count: store.demoBusiness.reviewCount,
        google_connected: true,
      };
    }
    if (store.liveBusiness && store.liveBusiness.isConnected && !store.liveBusiness.placeId?.startsWith('demo_')) {
      return {
        ...store.profile,
        business_name: store.liveBusiness.name,
        google_place_id: store.liveBusiness.placeId,
        review_url: store.liveBusiness.reviewUrl,
        formatted_address: store.liveBusiness.address,
        google_rating: store.liveBusiness.rating,
        google_review_count: store.liveBusiness.reviewCount,
        google_connected: true,
      };
    }
    return {
      ...initialProfile,
      ...store.profile,
      google_connected: Boolean(store.profile.google_connected && store.profile.google_place_id && !store.profile.google_place_id.startsWith('demo_')),
      google_place_id: store.profile.google_place_id?.startsWith('demo_') ? '' : (store.profile.google_place_id || ''),
    };
  }, [store.isDemoMode, store.profile, store.demoBusiness, store.liveBusiness]);

  return {
    activeBusiness,
    setActiveBusiness: store.setActiveBusiness,
    profile: activeProfile,
    settings: store.settings,
    reviews: activeReviews,
    invites: activeInvites,
    isLoaded: store.isLoaded,
    isSaving: store.isSaving,
    isDemoMode: store.isDemoMode,
    hasHydrated: store.hasHydrated,
    toggleDemoMode: store.toggleDemoMode,
    approveReview: store.approveReview,
    regenerateAiReply: store.regenerateAiReply,
    updateDraftText: store.updateDraftText,
    simulateIncomingGoogleReview: store.simulateIncomingGoogleReview,
    sendSmsInvite: store.sendSmsInvite,
    sendEmailInvite: store.sendEmailInvite,
    updateInviteResolution: store.updateInviteResolution,
    updateSettings: store.updateSettings,
    updateProfile: store.updateProfile,
    syncGoogleReviews: store.syncGoogleReviews,
    disconnectBusiness: store.disconnectBusiness,
    switchBusiness: store.switchBusiness,
    clearWorkspaceData: store.clearWorkspaceData,
    resetAccountAndTestData: store.resetAccountAndTestData,
    resetDemoData: store.resetDemoData,
    pendingReviewsCount: activeReviews.filter((r) => r.status === 'pending_approval').length,
    publishedReviewsCount: activeReviews.filter((r) => r.status === 'published').length,
    privateFeedbackCount: activeInvites.filter((inv) => isLowStarOrFeedback(inv)).length,
    unresolvedFeedbackCount: activeInvites.filter((inv) => isLowStarOrFeedback(inv) && inv.resolution_status !== 'resolved').length,
    searchQuery: store.searchQuery,
    setSearchQuery: store.setSearchQuery,
  };
}

export function useActiveBusiness(): ActiveBusiness {
  const { activeBusiness } = useRatingPulseStore();
  return activeBusiness;
}
