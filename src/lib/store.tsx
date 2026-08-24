'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { Review, Invite, BusinessSettings, Profile } from './supabase/types';
import { initialProfile, initialSettings, initialReviews, initialInvites } from './data';
import { supabase, isSupabaseConfigured } from './supabase/client';
import { useAuth } from './auth-context';

const STORAGE_KEYS = {
  PROFILE: 'ratingpulse_profile_v1',
  SETTINGS: 'ratingpulse_settings_v1',
  REVIEWS: 'ratingpulse_reviews_v1',
  INVITES: 'ratingpulse_invites_v1',
  DEMO_MODE: 'ratingpulse_demo_mode_v1',
};

// Gemini AI reply generation helper
export function generateGeminiReply(
  authorName: string,
  businessName: string,
  rating: number,
  reviewText: string,
  keywords: string[] = ['gentle care', 'painless dentistry', 'friendly team']
): { reply: string; keywordsUsed: string[] } {
  const selectedKeywords = keywords.slice(0, 2);
  const keywordPhrase = selectedKeywords.length > 0 ? selectedKeywords.join(' and ') : 'high-quality care';

  if (rating === 5) {
    const templates = [
      `Thank you so much for the 5-star review, ${authorName}! We are thrilled you experienced our ${keywordPhrase} at ${businessName}. Our team looks forward to welcoming you back for your next visit!`,
      `Hi ${authorName}! We truly appreciate your glowing feedback. Delivering exceptional, ${keywordPhrase} is what drives our team at ${businessName} every day. See you next time!`,
      `Dear ${authorName}, your wonderful review made our entire team smile! Thank you for trusting ${businessName} for your ${selectedKeywords[0] || 'visit'}. We look forward to serving you again soon!`
    ];
    return {
      reply: templates[Math.floor(Math.random() * templates.length)],
      keywordsUsed: selectedKeywords
    };
  } else if (rating === 4) {
    return {
      reply: `Hi ${authorName}, thank you for your kind 4-star review and valuable feedback for ${businessName}! We are glad you enjoyed our ${keywordPhrase}. We strive for 5-star excellence every visit and look forward to seeing you again soon!`,
      keywordsUsed: selectedKeywords
    };
  } else {
    return {
      reply: `Hello ${authorName}, thank you for sharing your experience. At ${businessName}, patient satisfaction and ${keywordPhrase} are our highest priorities. We would love the opportunity to connect with you directly to ensure your next visit is nothing short of exceptional.`,
      keywordsUsed: selectedKeywords
    };
  }
}

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
  updateSettings: (newSettings: Partial<BusinessSettings>) => Promise<void>;
  updateProfile: (newProfile: Partial<Profile>) => Promise<void>;
  resetDemoData: () => void;
  pendingReviewsCount: number;
  publishedReviewsCount: number;
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
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile>(globalProfileCache);
  const [settings, setSettings] = useState<BusinessSettings>(globalSettingsCache);
  const [reviews, setReviews] = useState<Review[]>(globalReviewsCache);
  const [invites, setInvites] = useState<Invite[]>(globalInvitesCache);
  const [isDemoMode, setIsDemoMode] = useState<boolean>(true);
  const [isLoaded, setIsLoaded] = useState(globalHasLoaded);
  const [isSaving, setIsSaving] = useState(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return;
    hasFetchedRef.current = true;

    async function loadData() {
      // 1. Check Demo Mode Preference from localStorage
      try {
        const storedDemoMode = localStorage.getItem(STORAGE_KEYS.DEMO_MODE);
        if (storedDemoMode !== null) {
          setIsDemoMode(storedDemoMode === 'true');
        }
      } catch {
        // ignore
      }

      const currentUserId = user?.id || null;

      // 2. Try Supabase fetch if authenticated user exists
      if (isSupabaseConfigured && supabase && currentUserId) {
        try {
          // Standardized on 'business_settings' using maybeSingle() to safely handle empty tables without 406 errors
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
          } else {
            setProfile(initialProfile);
            globalProfileCache = initialProfile;
          }

          if (settingsRes.status === 'fulfilled' && settingsRes.value.data) {
            const sett = settingsRes.value.data as BusinessSettings;
            setSettings(sett);
            globalSettingsCache = sett;
          } else {
            setSettings(initialSettings);
            globalSettingsCache = initialSettings;
          }

          if (reviewsRes.status === 'fulfilled' && reviewsRes.value.data && reviewsRes.value.data.length > 0) {
            setReviews(reviewsRes.value.data as Review[]);
            globalReviewsCache = reviewsRes.value.data as Review[];
          }

          if (invitesRes.status === 'fulfilled' && invitesRes.value.data && invitesRes.value.data.length > 0) {
            setInvites(invitesRes.value.data as Invite[]);
            globalInvitesCache = invitesRes.value.data as Invite[];
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
          const parsed = JSON.parse(storedInvites);
          setInvites(parsed);
          globalInvitesCache = parsed;
        }
      } catch (e) {
        console.error('Failed reading localStorage:', e);
      }

      globalHasLoaded = true;
      setIsLoaded(true);
    }

    loadData();
  }, []);

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
      try {
        const rev = updatedReviews.find((r) => r.id === reviewId);
        if (rev) {
          await supabase
            .from('reviews')
            .update({
              published_reply: rev.published_reply,
              status: 'published',
              published_at: rev.published_at,
            })
            .eq('id', reviewId);
        }
      } catch (err) {
        console.error('Supabase update review error:', err);
      }
    }
    setIsSaving(false);
  };

  const regenerateAiReply = async (reviewId: string, customKeywords?: string[]) => {
    const rev = reviews.find((r) => r.id === reviewId);
    if (!rev) return;

    const gemini = generateGeminiReply(
      rev.author_name,
      profile.business_name,
      rev.rating,
      rev.review_text,
      customKeywords || settings.custom_keywords
    );

    const updatedReviews = reviews.map((r) =>
      r.id === reviewId
        ? { ...r, ai_draft_reply: gemini.reply, keywords_used: gemini.keywordsUsed }
        : r
    );
    setReviews(updatedReviews);
    globalReviewsCache = updatedReviews;
    persistState(updatedReviews, invites, settings, profile);
  };

  const updateDraftText = (reviewId: string, text: string) => {
    const updatedReviews = reviews.map((r) =>
      r.id === reviewId ? { ...r, ai_draft_reply: text } : r
    );
    setReviews(updatedReviews);
    globalReviewsCache = updatedReviews;
    persistState(updatedReviews, invites, settings, profile);
  };

  const simulateIncomingGoogleReview = () => {
    const mockReviewers = [
      {
        name: 'Emily Watson',
        avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=120&h=120&fit=crop&crop=face',
        text: 'Incredible experience at Apex Dental! From the friendly greeting at the front desk to the gentle checkup, everything was effortless and fast.',
        rating: 5,
      },
      {
        name: 'Jordan Rivera',
        avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=120&h=120&fit=crop&crop=face',
        text: 'Dr. Marcus explained every step of my procedure clearly. Very clean facility and zero pain during the procedure. Will definitely be my go-to clinic!',
        rating: 5,
      },
      {
        name: 'Claire Beauchamp',
        avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&h=120&fit=crop&crop=face',
        text: 'Top notch staff and cutting-edge equipment. Scheduled online easily and was seen right on time.',
        rating: 5,
      },
    ];

    const pick = mockReviewers[Math.floor(Math.random() * mockReviewers.length)];
    const gemini = generateGeminiReply(
      pick.name,
      profile.business_name,
      pick.rating,
      pick.text,
      settings.custom_keywords
    );

    const newReview: Review = {
      id: `rev-${Date.now()}`,
      user_id: profile.id,
      author_name: pick.name,
      author_avatar: pick.avatar,
      rating: pick.rating,
      review_text: pick.text,
      review_date: new Date().toISOString(),
      ai_draft_reply: gemini.reply,
      published_reply: null,
      status: 'pending_approval',
      sentiment: pick.rating >= 4 ? 'positive' : 'neutral',
      keywords_used: gemini.keywordsUsed,
      created_at: new Date().toISOString(),
    };

    const updatedReviews = [newReview, ...reviews];
    setReviews(updatedReviews);
    globalReviewsCache = updatedReviews;
    persistState(updatedReviews, invites, settings, profile);
    return newReview;
  };

  const sendSmsInvite = async (
    customerName: string,
    customerPhone: string,
    serviceType: string = 'General Service'
  ) => {
    setIsSaving(true);
    const newInvite: Invite = {
      id: `inv-${Date.now()}`,
      user_id: profile.id,
      customer_name: customerName,
      customer_phone: customerPhone,
      service_type: serviceType,
      status: 'sent',
      sent_at: new Date().toISOString(),
    };

    const updatedInvites = [newInvite, ...invites];
    setInvites(updatedInvites);
    globalInvitesCache = updatedInvites;
    persistState(reviews, updatedInvites, settings, profile);

    try {
      const reviewUrl =
        profile.review_url ||
        (profile.google_place_id
          ? `https://search.google.com/local/writereview?placeid=${profile.google_place_id}`
          : 'https://ratingpulse.co');

      const customMessage = settings.sms_template
        .replace(/{{customer_name}}/g, customerName)
        .replace(/{{business_name}}/g, profile.business_name)
        .replace(/{{review_link}}/g, reviewUrl);

      const resp = await fetch('/api/sms/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: customerPhone,
          customerName,
          businessName: profile.business_name,
          reviewLink: reviewUrl,
          message: customMessage,
          serviceType,
        }),
      });

      const data = await resp.json();
      if (data?.success) {
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
          const { error } = await supabase.from('review_invites').insert([newInvite]);
          if (error) console.error('Supabase insert invite error:', error.message, error.code);
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
    serviceType: string = 'General Service'
  ): Promise<Invite> => {
    setIsSaving(true);
    const newInvite: Invite = {
      id: `inv_${Date.now()}`,
      user_id: user?.id || 'demo_user',
      customer_name: customerName,
      customer_phone: customerEmail,
      service_type: serviceType,
      status: 'sent',
      sent_at: new Date().toISOString(),
      rating_received: null,
    };

    const updated = [newInvite, ...invites];
    setInvites(updated);
    globalInvitesCache = updated;
    persistState(reviews, updated, settings, profile);

    try {
      const appUrl = typeof window !== 'undefined' ? window.location.origin : 'https://ratingpulse.co';
      const reviewUrl =
        profile.review_url ||
        (profile.google_place_id
          ? `https://search.google.com/local/writereview?placeid=${profile.google_place_id}`
          : `${appUrl}/rate/demo`);

      const resp = await fetch('/api/send-email-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          toEmail: customerEmail,
          customerName,
          businessName: profile.business_name || 'Our Business',
          reviewGateUrl: reviewUrl,
          userId: user?.id,
          serviceType,
        }),
      });

      const data = await resp.json();
      if (data?.success) {
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
          const { error } = await supabase.from('review_invites').insert([newInvite]);
          if (error) console.error('Supabase insert email invite error:', error.message);
        } catch (err: unknown) {
          console.error('Supabase insert email invite exception:', err);
        }
      })();
    }

    setIsSaving(false);
    return newInvite;
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
        // Automatically ensure an initial business_settings record exists
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
    updateSettings,
    updateProfile,
    resetDemoData,
    pendingReviewsCount: reviews.filter((r) => r.status === 'pending_approval').length,
    publishedReviewsCount: reviews.filter((r) => r.status === 'published').length,
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
    updateSettings: async () => {},
    updateProfile: async () => {},
    resetDemoData: () => {},
    pendingReviewsCount: globalReviewsCache.filter((r) => r.status === 'pending_approval').length,
    publishedReviewsCount: globalReviewsCache.filter((r) => r.status === 'published').length,
    searchQuery: '',
    setSearchQuery: () => {},
  };
}
