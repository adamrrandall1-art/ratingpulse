'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Layers
} from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';
import { useAuth } from '@/lib/auth-context';
import GooglePlacesAutocomplete, { SelectedPlaceData } from '@/components/google/GooglePlacesAutocomplete';
import { generateGoogleReviewUrl } from '@/lib/google-places';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export default function BusinessSetupPage() {
  const { user } = useAuth();
  const {
    profile,
    settings,
    updateProfile,
    updateSettings,
    disconnectBusiness,
    syncGoogleReviews,
    isLoaded
  } = useRatingPulseStore();

  const isConnected = Boolean(
    profile.google_place_id && profile.business_name && profile.google_connected !== false
  );

  // Business Profile Form States
  const [businessName, setBusinessName] = useState(profile.business_name || '');
  const [businessAddress, setBusinessAddress] = useState(profile.formatted_address || '');
  const [businessPhone, setBusinessPhone] = useState(profile.phone || '');
  const [businessCategory, setBusinessCategory] = useState(profile.business_category || 'Healthcare / Dental');
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

  useEffect(() => {
    if (isLoaded) {
      if (isConnected) {
        setBusinessName(profile.business_name || '');
        setBusinessAddress(profile.formatted_address || '');
        setBusinessPhone(profile.phone || '');
        setBusinessCategory(profile.business_category || 'Healthcare / Dental');
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
    }
  }, [isLoaded, profile.google_place_id, profile.business_name, profile.formatted_address, profile.phone, profile.business_category, isConnected]);

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
      await updateProfile({
        business_name: businessName,
        formatted_address: businessAddress,
        phone: businessPhone,
        business_category: businessCategory,
        review_url: reviewUrl || (selectedPlace.placeId ? generateGoogleReviewUrl(selectedPlace.placeId) : undefined),
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

      await updateProfile({
        business_name: selectedPlace.businessName,
        google_place_id: selectedPlace.placeId,
        formatted_address: selectedPlace.formattedAddress,
        google_rating: selectedPlace.rating || 5.0,
        google_review_count: selectedPlace.reviewCount || 0,
        review_url: gReviewUrl,
        google_connected: true,
      });

      setBusinessName(selectedPlace.businessName);
      setBusinessAddress(selectedPlace.formattedAddress || '');
      setReviewUrl(gReviewUrl);

      // Trigger review sync
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
      const syncedCount = await syncGoogleReviews();
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
    <div className="space-y-8 max-w-4xl">
      
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
        <div>
          {isConnected ? (
            <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Google Sync Active (🟢)
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
              <p className="text-xs text-slate-500">Authenticate with Google to enable 1-tap review replies directly on Google Maps.</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {profile.google_access_token ? (
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-3 py-1.5 rounded-full">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                GBP OAuth Authenticated 🟢
              </span>
            ) : (
              <a
                href={`/api/auth/google?userId=${user?.id || profile.id}&returnUrl=/dashboard/setup`}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5 text-blue-200" />
                Connect Google Account (OAuth)
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
              {profile.google_access_token
                ? 'Your account is authorized to post AI-drafted replies straight to Google Reviews.'
                : 'Connect via Google OAuth to publish responses without copying and pasting manually.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200/80 space-y-1.5">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              Verified Listing Ownership
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Google OAuth verifies that you have managerial permissions over this Business Profile on Google Maps.
            </p>
          </div>
        </div>
      </div>

      {/* 2. GOOGLE MAPS / PLACE ID DETECTION CARD */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
        <div className="border-b border-slate-100 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-blue-600" />
              Google Maps Location &amp; Place ID
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Search your exact listing on Google Maps to attach your verified Place ID.
            </p>
          </div>

          {profile.google_place_id && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] text-slate-500">Active Place ID:</span>
              <code className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-mono text-[11px] font-semibold border border-slate-200">
                {profile.google_place_id}
              </code>
            </div>
          )}
        </div>

        {/* Search Autocomplete */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-slate-700">
            Search Business Listing on Google Maps
          </label>
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
            Type your company name, clinic, or branch to auto-detect your Google Place ID and live rating metrics.
          </p>
        </div>

        {/* Selected Location Card */}
        {selectedPlace.placeId ? (
          <div className="p-5 rounded-xl border border-blue-100 bg-blue-50/40 space-y-3 animate-in fade-in duration-150">
            <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
              <div>
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-1.5 flex-wrap">
                  {selectedPlace.businessName}
                  {selectedPlace.rating ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 ml-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      {selectedPlace.rating.toFixed(1)} ({selectedPlace.reviewCount} reviews)
                    </span>
                  ) : null}
                </h4>
                <p className="text-xs text-slate-600 flex items-center gap-1.5 mt-1">
                  <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span>{selectedPlace.formattedAddress || 'Address on file'}</span>
                </p>
              </div>

              <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-white border border-slate-200 text-slate-600 shrink-0">
                {selectedPlace.placeId.slice(0, 14)}...
              </span>
            </div>

            <div className="pt-2 border-t border-blue-100/80 flex flex-wrap items-center justify-between text-xs text-slate-500 gap-2">
              <span className="flex items-center gap-1 text-emerald-700 font-medium">
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                Valid Google Place ID detected
              </span>

              {selectedPlace.reviewUrl && (
                <a
                  href={selectedPlace.reviewUrl}
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
            <p>No business selected yet. Use the search input above to find your Google Maps listing.</p>
          </div>
        )}

        {/* Place Actions */}
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
              placeholder="e.g. Metro Dental Clinic"
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
              placeholder="e.g. Healthcare, Legal, Restaurant..."
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
