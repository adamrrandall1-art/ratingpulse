'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Building2,
  MapPin,
  CheckCircle2,
  Star,
  ExternalLink,
  ShieldCheck,
  Sparkles,
  Trash2,
  RefreshCw,
  AlertCircle,
  Check,
  Globe,
  Phone,
  Tag,
  Save,
  Radio,
  Zap,
  Layers,
  Lock,
  Store,
  ArrowRight
} from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import GooglePlacesAutocomplete, { SelectedPlaceData } from '@/components/google/GooglePlacesAutocomplete';
import { generateGoogleReviewUrl } from '@/lib/google-places';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

function BusinessSetupContent() {
  const { user } = useAuth();
  const searchParams = useSearchParams();
  const {
    profile,
    settings,
    updateProfile,
    updateSettings,
    disconnectBusiness,
    syncGoogleReviews,
    isLoaded,
    isDemoMode,
  } = useRatingPulseStore();

  const isConnected = Boolean(
    profile.google_place_id && profile.business_name && profile.google_connected !== false
  );

  const isOauthVerified = Boolean(
    profile.google_access_token || (profile.google_connected && !isDemoMode)
  );

  // Business Profile Form States
  const [businessName, setBusinessName] = useState(profile.business_name || '');
  const [businessAddress, setBusinessAddress] = useState(profile.formatted_address || '');
  const [businessPhone, setBusinessPhone] = useState(profile.phone || '');
  const [businessCategory, setBusinessCategory] = useState(profile.business_category || 'Local Business');
  const [reviewUrl, setReviewUrl] = useState(
    profile.review_url || (profile.google_place_id ? generateGoogleReviewUrl(profile.google_place_id) : '')
  );

  // Place Search & Location States
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlaceData>({
    placeId: profile.google_place_id || '',
    businessName: profile.business_name || '',
    formattedAddress: profile.formatted_address || '',
    rating: profile.google_rating || 0,
    reviewCount: profile.google_review_count || 0,
    reviewUrl: profile.review_url || (profile.google_place_id ? generateGoogleReviewUrl(profile.google_place_id) : '')
  });

  // Sync & Toggles
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [autoPublish5Star, setAutoPublish5Star] = useState(settings.auto_publish_5_star ?? false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isConnectingPlace, setIsConnectingPlace] = useState(false);
  const [isSyncingReviews, setIsSyncingReviews] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  // Check for OAuth Callback query parameters
  useEffect(() => {
    const oauthStatus = searchParams.get('oauth');
    const googleStatus = searchParams.get('google');
    const googleError = searchParams.get('google_error');

    if (oauthStatus === 'success' || googleStatus === 'connected') {
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
          colors: ['#3b82f6', '#10b981', '#fbbf24'],
        });
      } catch {
        // ignore
      }
      toast.success('Google Business Profile Connected! 🎉', {
        description: 'Verified listing ownership confirmed via Google OAuth. Auto-syncing live reviews...',
        duration: 5000,
      });

      if (profile.google_place_id) {
        syncGoogleReviews(profile.google_place_id).catch(() => {});
      }
    } else if (googleError) {
      toast.error('Google OAuth failed', {
        description: `Error: ${googleError}. Please try again or check permissions.`,
      });
    }
  }, [searchParams, profile.google_place_id]);

  useEffect(() => {
    if (isLoaded) {
      if (isConnected) {
        setBusinessName(profile.business_name || '');
        setBusinessAddress(profile.formatted_address || '');
        setBusinessPhone(profile.phone || '');
        setBusinessCategory(profile.business_category || 'Local Business');
        setReviewUrl(profile.review_url || (profile.google_place_id ? generateGoogleReviewUrl(profile.google_place_id) : ''));
        setSelectedPlace({
          placeId: profile.google_place_id || '',
          businessName: profile.business_name || '',
          formattedAddress: profile.formatted_address || '',
          rating: profile.google_rating || 0,
          reviewCount: profile.google_review_count || 0,
          reviewUrl: profile.review_url || (profile.google_place_id ? generateGoogleReviewUrl(profile.google_place_id) : '')
        });
      }
      if (settings) {
        setAutoPublish5Star(settings.auto_publish_5_star ?? false);
      }
    }
  }, [isLoaded, profile.google_place_id, profile.business_name, profile.formatted_address, profile.phone, profile.business_category, settings, isConnected]);

  const handlePlaceSelect = (data: SelectedPlaceData) => {
    setSelectedPlace(data);
    if (data.businessName) setBusinessName(data.businessName);
    if (data.formattedAddress) setBusinessAddress(data.formattedAddress);
    if (data.reviewUrl) setReviewUrl(data.reviewUrl);
    toast.info('Google Maps location selected', {
      description: `Selected ${data.businessName}. Click "Confirm & Connect Location" to link.`,
    });
  };

  const handleSaveProfileDetails = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingProfile(true);
    try {
      const chosenBusinessName = businessName.trim() || selectedPlace.businessName || profile.business_name;
      const chosenPlaceId = selectedPlace.placeId || profile.google_place_id || undefined;
      const chosenAddress = businessAddress.trim() || selectedPlace.formattedAddress || profile.formatted_address;
      const gReviewUrl = reviewUrl || (chosenPlaceId ? generateGoogleReviewUrl(chosenPlaceId) : undefined);

      await updateProfile({
        business_name: chosenBusinessName,
        formatted_address: chosenAddress,
        phone: businessPhone,
        business_category: businessCategory,
        google_place_id: chosenPlaceId,
        review_url: gReviewUrl,
      });

      await updateSettings({
        auto_publish_5_star: autoPublish5Star,
      });
      toast.success('Business profile updated', {
        description: 'Your business details and sync preferences have been saved.',
      });
    } catch (err: any) {
      toast.error('Failed to save profile', {
        description: err?.message || 'Please check your connection and try again.',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleConfirmAndConnectPlace = async () => {
    if (!selectedPlace.placeId || !selectedPlace.businessName) {
      toast.error('Please search and select a Google business location first.');
      return;
    }

    setIsConnectingPlace(true);
    try {
      const gReviewUrl = selectedPlace.reviewUrl || generateGoogleReviewUrl(selectedPlace.placeId);

      const nameLower = (selectedPlace.businessName || '').toLowerCase();
      let inferredCategory = 'Local Business';
      if (
        nameLower.includes('pizza') || nameLower.includes('pizzeria') || nameLower.includes('restaurant') ||
        nameLower.includes('cafe') || nameLower.includes('coffee') || nameLower.includes('bistro') ||
        nameLower.includes('burger') || nameLower.includes('bakery') || nameLower.includes('bar') ||
        nameLower.includes('kitchen') || nameLower.includes('taco') || nameLower.includes('deli') ||
        nameLower.includes('food') || nameLower.includes('ice cream')
      ) {
        inferredCategory = 'Restaurant & Food Service';
      } else if (nameLower.includes('dental') || nameLower.includes('dentist') || nameLower.includes('orthodont')) {
        inferredCategory = 'Healthcare / Dental';
      } else if (nameLower.includes('salon') || nameLower.includes('barber') || nameLower.includes('spa') || nameLower.includes('hair') || nameLower.includes('nails') || nameLower.includes('beauty')) {
        inferredCategory = 'Beauty & Wellness';
      } else if (nameLower.includes('auto') || nameLower.includes('tire') || nameLower.includes('car') || nameLower.includes('mechanic') || nameLower.includes('motors')) {
        inferredCategory = 'Automotive';
      } else if (nameLower.includes('plumb') || nameLower.includes('electric') || nameLower.includes('hvac') || nameLower.includes('roof') || nameLower.includes('clean') || nameLower.includes('contractor')) {
        inferredCategory = 'Home Services';
      } else if (nameLower.includes('law') || nameLower.includes('attorney') || nameLower.includes('legal')) {
        inferredCategory = 'Legal Services';
      }

      await updateProfile({
        business_name: selectedPlace.businessName,
        business_category: inferredCategory,
        google_place_id: selectedPlace.placeId,
        formatted_address: selectedPlace.formattedAddress,
        google_rating: selectedPlace.rating || 5.0,
        google_review_count: selectedPlace.reviewCount || 0,
        review_url: gReviewUrl,
        google_connected: true,
      });

      await updateSettings({
        custom_keywords: [],
      });

      setBusinessName(selectedPlace.businessName);
      setBusinessAddress(selectedPlace.formattedAddress || '');
      setBusinessCategory(inferredCategory);
      setReviewUrl(gReviewUrl);

      try {
        await syncGoogleReviews(selectedPlace.placeId);
      } catch {
        // sync error handled internally
      }

      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#2563eb', '#10b981', '#fbbf24'],
        });
      } catch {
        // ignore
      }

      toast.success('Google Business Location Connected!', {
        description: `Now actively syncing ${selectedPlace.businessName}`,
      });
    } catch (err: any) {
      toast.error('Connection failed', {
        description: err?.message || 'Could not save business profile. Please try again.',
      });
    } finally {
      setIsConnectingPlace(false);
    }
  };

  const handleForceSync = async () => {
    if (!profile.google_place_id) {
      toast.error('Connect a Google Place ID first before syncing.');
      return;
    }

    setIsSyncingReviews(true);
    try {
      const syncedCount = await syncGoogleReviews(profile.google_place_id);
      toast.success('Google Reviews Synced! 🔄', {
        description: `Fetched latest reviews from Google. (${syncedCount} reviews updated).`,
      });
    } catch (err: any) {
      toast.error('Sync failed', {
        description: err?.message || 'Could not pull latest Google reviews.',
      });
    } finally {
      setIsSyncingReviews(false);
    }
  };

  const handleClearLocation = async () => {
    try {
      await updateProfile({
        google_place_id: '',
        business_name: '',
        formatted_address: null,
        review_url: null,
        google_connected: false,
        google_rating: 0,
        google_review_count: 0,
      });

      setSelectedPlace({
        placeId: '',
        businessName: '',
        formattedAddress: '',
        rating: 0,
        reviewCount: 0,
        reviewUrl: '',
      });
      setBusinessName('');
      setBusinessAddress('');
      setReviewUrl('');

      toast.success('Location Cleared', {
        description: 'Google Place ID and location have been removed. You can attach a new listing now.',
      });
    } catch (err: any) {
      toast.error('Failed to clear location', {
        description: err?.message || 'Please try again.',
      });
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectBusiness();
      setSelectedPlace({
        placeId: '',
        businessName: '',
        formattedAddress: '',
        rating: 0,
        reviewCount: 0,
        reviewUrl: ''
      });
      setBusinessName('');
      setBusinessAddress('');
      setReviewUrl('');
      setShowDisconnectModal(false);
      toast.success('Business Disconnected', {
        description: 'Google Places connection and OAuth tokens have been cleared.',
      });
    } catch (err: any) {
      toast.error('Disconnect failed', {
        description: err?.message || 'Please try again.',
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="space-y-8 max-w-4xl pb-16">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-600" />
            Business Profiles &amp; Google Integration
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manage your connected business details, Google Business Profile OAuth, and live review ingestion.
          </p>
        </div>

        {/* Live Status Pill */}
        <div className="flex items-center gap-2">
          {isOauthVerified ? (
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Verified Owner via Google OAuth 🟢
            </span>
          ) : isConnected ? (
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              {isDemoMode ? 'Demo Simulation Active 🟢' : 'Place ID Attached (Pending OAuth)'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-slate-400" />
              Disconnected (⚪)
            </span>
          )}
        </div>
      </div>

      {/* 1. GOOGLE BUSINESS PROFILE & OAUTH INTEGRATION CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base shadow-2xs">
              G
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">Google Business Profile (GBP) OAuth Integration</h3>
              <p className="text-xs text-slate-500">Authenticate with Google to verify listing ownership and enable 1-tap review replies.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {isOauthVerified ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3.5 py-1.5 rounded-full shadow-2xs">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Verified Owner via Google OAuth 🟢
              </span>
            ) : (
              <a
                href={`/api/auth/google?userId=${user?.id || profile.id}&returnUrl=/dashboard/setup?oauth=success`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md shadow-blue-600/20 transition-all cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-blue-200" />
                <span>Connect Google Account (OAuth)</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-blue-600" />
              1-Tap Live Review Publishing
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              {isOauthVerified
                ? 'Your account is authorized to post AI-drafted replies straight to Google Maps reviews.'
                : 'Connect via Google OAuth to publish responses directly to Google Business Profile without copying manually.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified Listing Ownership
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Google OAuth verifies that your email address has managerial rights over this Business Profile on Google Maps.
            </p>
          </div>
        </div>
      </div>

      {/* 2. GOOGLE MAPS / PLACE ID DETECTION CARD (LOCKED IN LIVE MODE, OPEN IN DEMO MODE) */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
        <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Google Maps Location &amp; Place ID
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {isDemoMode
                ? 'Interactive Demo Sandbox: Search any Google Maps listing or use sample data.'
                : 'Verified Google Business listing attached to your account.'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">Active Place ID:</span>
            {profile.google_place_id ? (
              <div className="flex items-center gap-1.5">
                <code className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px] font-semibold border border-slate-200">
                  {profile.google_place_id}
                </code>
                {isDemoMode && (
                  <button
                    type="button"
                    onClick={handleClearLocation}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium text-rose-600 hover:text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-colors cursor-pointer"
                    title="Remove location and clear Place ID"
                  >
                    <Trash2 className="w-3 h-3" />
                    Clear
                  </button>
                )}
              </div>
            ) : (
              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-400 font-mono text-[11px] border border-slate-200">
                None attached
              </span>
            )}
          </div>
        </div>

        {/* LIVE MODE OWNERSHIP GUARD */}
        {!isDemoMode && !isOauthVerified ? (
          <div className="p-6 rounded-2xl bg-amber-50/60 border border-amber-200 space-y-4 text-left">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                <Lock className="w-5 h-5 text-amber-700" />
              </div>
              <div className="space-y-1">
                <h4 className="text-sm font-bold text-slate-900">
                  Google OAuth Verification Required in Live Production
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  To protect listing integrity and prevent unauthorized claiming of Google listings, manual Place ID search is locked in Live Production. Please authenticate with Google OAuth to automatically import your verified Google Business Profile.
                </p>
              </div>
            </div>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <a
                href={`/api/auth/google?userId=${user?.id || profile.id}&returnUrl=/dashboard/setup?oauth=success`}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-blue-200" />
                <span>Authenticate via Google OAuth →</span>
              </a>

              <Link
                href="/dashboard/settings"
                className="text-xs font-semibold text-slate-600 hover:text-slate-900 px-3 py-2"
              >
                Switch to Demo Sandbox in Settings
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Search Autocomplete (Enabled in Demo Mode) */}
            {isDemoMode && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-semibold text-slate-700">
                    Search Business Listing on Google Maps (Sandbox Mode)
                  </label>
                  <span className="text-[10px] uppercase font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-200">
                    Demo Sandbox
                  </span>
                </div>
                <GooglePlacesAutocomplete
                  initialBusinessName={selectedPlace.businessName}
                  initialPlaceId={selectedPlace.placeId}
                  initialAddress={selectedPlace.formattedAddress}
                  initialRating={selectedPlace.rating}
                  initialReviewCount={selectedPlace.reviewCount}
                  onPlaceSelect={handlePlaceSelect}
                  showPreviewCard={false}
                />
                <p className="text-[11px] text-slate-400">
                  Type any business name to test Place ID auto-detection and review sync simulation.
                </p>
              </div>
            )}

            {/* Selected Location Card */}
            {selectedPlace.placeId || profile.google_place_id ? (
              <div className="p-5 rounded-xl border border-blue-100 bg-blue-50/40 space-y-3 animate-in fade-in duration-150">
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                      {selectedPlace.businessName || profile.business_name}
                      {(selectedPlace.rating || profile.google_rating) ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 ml-1">
                          <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                          {(selectedPlace.rating || profile.google_rating || 5.0).toFixed(1)} ({selectedPlace.reviewCount || profile.google_review_count || 128} reviews)
                        </span>
                      ) : null}
                    </h4>
                    <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                      <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                      <span>{selectedPlace.formattedAddress || profile.formatted_address || 'Address on file'}</span>
                    </p>
                  </div>

                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 shrink-0">
                    {(selectedPlace.placeId || profile.google_place_id || '').slice(0, 14)}...
                  </span>
                </div>

                <div className="pt-2 border-t border-blue-100/80 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
                  <span className="flex items-center gap-1 text-emerald-700 font-medium">
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    {isOauthVerified ? 'Verified Owner via Google OAuth' : 'Valid Google Place ID detected'}
                  </span>

                  {(selectedPlace.reviewUrl || profile.review_url) && (
                    <a
                      href={selectedPlace.reviewUrl || profile.review_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline flex items-center gap-1 text-xs font-semibold"
                    >
                      <span>Test Google Review Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-8 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 text-center text-slate-400 text-xs">
                <p>No business selected yet. Use Google OAuth or search above to link your listing.</p>
              </div>
            )}

            {/* Place Actions */}
            {isDemoMode && (
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                {isConnected ? (
                  <button
                    type="button"
                    onClick={() => setShowDisconnectModal(true)}
                    disabled={isDisconnecting}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Disconnect Business</span>
                  </button>
                ) : (
                  <div />
                )}

                <button
                  type="button"
                  onClick={handleConfirmAndConnectPlace}
                  disabled={isConnectingPlace || !selectedPlace.placeId}
                  className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
                >
                  {isConnectingPlace ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Connecting & Syncing...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Confirm & Connect Location</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* 3. BUSINESS PROFILE DETAILS FORM CARD */}
      <form onSubmit={handleSaveProfileDetails} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
        <div className="border-b border-slate-100 pb-4">
          <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-blue-600" />
            Business Profile Details
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            These parameters are inserted into outbound review requests and SMS invite messages.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
          {/* Business Name */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Business / Organization Name
            </label>
            <input
              type="text"
              placeholder="e.g. Scoop 'n Twist Ice Cream"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Business Category */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-slate-400" />
              Industry / Category
            </label>
            <input
              type="text"
              placeholder="e.g. Healthcare, Food & Beverage, Legal..."
              value={businessCategory}
              onChange={(e) => setBusinessCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Physical Address */}
          <div className="sm:col-span-2">
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <MapPin className="w-3.5 h-3.5 text-slate-400" />
              Physical Address
            </label>
            <input
              type="text"
              placeholder="123 Main St, Suite 400, New York, NY 10001"
              value={businessAddress}
              onChange={(e) => setBusinessAddress(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Business Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Phone className="w-3.5 h-3.5 text-slate-400" />
              Business Phone Number
            </label>
            <input
              type="tel"
              placeholder="(555) 123-4567"
              value={businessPhone}
              onChange={(e) => setBusinessPhone(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600"
            />
          </div>

          {/* Review Destination URL */}
          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5 text-slate-400" />
              Direct Review / Website URL
            </label>
            <input
              type="url"
              placeholder="https://search.google.com/local/writereview?placeid=..."
              value={reviewUrl}
              onChange={(e) => setReviewUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono text-[11px]"
            />
          </div>
        </div>

        {/* Save Button */}
        <div className="pt-2 flex justify-end">
          <button
            type="submit"
            disabled={isSavingProfile}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSavingProfile ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Saving Profile...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Save Business Profile</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* 4. LIVE REVIEW INGESTION & SYNC CONTROLS CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-5">
        <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <Radio className="w-4 h-4 text-blue-600" />
              Live Review Ingestion &amp; Sync Controls
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Control automated background sync and trigger manual review imports.
            </p>
          </div>

          <button
            type="button"
            onClick={handleForceSync}
            disabled={isSyncingReviews || !profile.google_place_id}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 text-blue-600 ${isSyncingReviews ? 'animate-spin' : ''}`} />
            <span>{isSyncingReviews ? 'Fetching Reviews...' : 'Force Sync Google Reviews'}</span>
          </button>
        </div>

        <div className="space-y-3">
          {/* Live Ingestion Toggle */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-900">Automatic Real-Time Review Ingestion</div>
              <div className="text-[11px] text-slate-500">
                Poll Google Places API and Webhooks to ingest new ratings and reviews automatically.
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoSyncEnabled}
              onChange={(e) => setAutoSyncEnabled(e.target.checked)}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>

          {/* Auto-Publish 5-Star AI Replies */}
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-slate-900">Auto-Publish 5-Star AI Responses</div>
              <div className="text-[11px] text-slate-500">
                Automatically publish generated 5-star review responses directly to Google via OAuth.
              </div>
            </div>
            <input
              type="checkbox"
              checked={autoPublish5Star}
              onChange={async (e) => {
                const val = e.target.checked;
                setAutoPublish5Star(val);
                await updateSettings({ auto_publish_5_star: val });
                toast.success(val ? 'Auto-publish enabled for 5-star reviews' : 'Auto-publish disabled');
              }}
              className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
            />
          </div>
        </div>
      </div>

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-rose-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Disconnect Business Profile?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to disconnect <strong>{profile.business_name}</strong>? This will clear the active Place ID, Google OAuth credentials, and review stream from the dashboard.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDisconnectModal(false)}
                className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
              >
                {isDisconnecting ? 'Disconnecting...' : 'Yes, Disconnect'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default function BusinessSetupPage() {
  return (
    <Suspense fallback={<div className="p-6 text-xs text-slate-500">Loading business setup...</div>}>
      <BusinessSetupContent />
    </Suspense>
  );
}
