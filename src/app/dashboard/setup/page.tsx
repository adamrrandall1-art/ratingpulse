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
  Search
} from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';
import GooglePlacesAutocomplete, { SelectedPlaceData } from '@/components/google/GooglePlacesAutocomplete';
import { generateGoogleReviewUrl } from '@/lib/google-places';
import { toast } from 'sonner';
import confetti from 'canvas-confetti';

export default function BusinessSetupPage() {
  const {
    profile,
    updateProfile,
    disconnectBusiness,
    syncGoogleReviews,
    isLoaded
  } = useRatingPulseStore();

  const isConnected = Boolean(
    profile.google_place_id && profile.business_name && profile.google_connected !== false
  );

  const [selectedPlace, setSelectedPlace] = useState<SelectedPlaceData>({
    placeId: profile.google_place_id || '',
    businessName: profile.business_name || '',
    formattedAddress: profile.formatted_address || '',
    rating: profile.google_rating || 0,
    reviewCount: profile.google_review_count || 0,
    reviewUrl: profile.review_url || (profile.google_place_id ? generateGoogleReviewUrl(profile.google_place_id) : '')
  });

  const [isSaving, setIsSaving] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showDisconnectModal, setShowDisconnectModal] = useState(false);

  useEffect(() => {
    if (isLoaded) {
      if (isConnected) {
        setSelectedPlace({
          placeId: profile.google_place_id || '',
          businessName: profile.business_name || '',
          formattedAddress: profile.formatted_address || '',
          rating: profile.google_rating || 0,
          reviewCount: profile.google_review_count || 0,
          reviewUrl: profile.review_url || (profile.google_place_id ? generateGoogleReviewUrl(profile.google_place_id) : '')
        });
      } else {
        setSelectedPlace({
          placeId: '',
          businessName: '',
          formattedAddress: '',
          rating: 0,
          reviewCount: 0,
          reviewUrl: ''
        });
      }
    }
  }, [isLoaded, profile.google_place_id, profile.business_name, profile.google_connected, isConnected]);

  const handlePlaceSelect = (data: SelectedPlaceData) => {
    setSelectedPlace(data);
    toast.info('Location selected', {
      description: `Ready to connect ${data.businessName}. Click "Confirm & Connect Location" below.`,
    });
  };

  const handleConfirmAndConnect = async () => {
    if (!selectedPlace.placeId || !selectedPlace.businessName) {
      toast.error('Please search and select a Google business location first.');
      return;
    }

    setIsSaving(true);
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

      // Synchronize latest reviews
      try {
        await syncGoogleReviews();
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

      toast.success('Google Business Connected!', {
        description: `Now actively syncing ${selectedPlace.businessName}`,
      });
    } catch (err: any) {
      toast.error('Connection failed', {
        description: err?.message || 'Could not save business profile. Please try again.',
      });
    } finally {
      setIsSaving(false);
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
      setShowDisconnectModal(false);
      toast.success('Business Disconnected', {
        description: 'Google Places connection has been unlinked and cleared.',
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
    <div className="space-y-6">
      
      {/* Main Corporate Setup Card */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 sm:p-8 shadow-sm max-w-3xl mx-auto space-y-6">
        
        {/* Card Header */}
        <div className="border-b border-slate-100 pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Building2 className="w-5 h-5 text-blue-600" />
              Google Business Profile Setup
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Search for and connect your verified Google Business location to sync reviews and automate reputation growth.
            </p>
          </div>

          {/* Connection Pill */}
          <div>
            {isConnected ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Google Sync Active 🟢
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600 border border-slate-200">
                <span className="w-2 h-2 rounded-full bg-slate-400" />
                Disconnected (⚪)
              </span>
            )}
          </div>
        </div>

        {/* 1. Google Places Search Autocomplete Input */}
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
            Type your company name, clinic, or restaurant to auto-detect your Google Place ID.
          </p>
        </div>

        {/* 2. Selected Location Details Card */}
        {selectedPlace.placeId ? (
          <div className="p-5 rounded-xl border border-blue-100 bg-blue-50/40 space-y-3 animate-in fade-in duration-150">
            <div className="flex items-start justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  {selectedPlace.businessName}
                  {selectedPlace.rating ? (
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 ml-1">
                      <Star className="w-3 h-3 text-amber-500 fill-amber-500" />
                      {selectedPlace.rating.toFixed(1)} ({selectedPlace.reviewCount} reviews)
                    </span>
                  ) : null}
                </h3>
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
            <p>No business selected yet. Use the search input above to find your listing.</p>
          </div>
        )}

        {/* 3. Action Buttons */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {isConnected ? (
            <button
              type="button"
              onClick={() => setShowDisconnectModal(true)}
              disabled={isDisconnecting}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-semibold transition-colors cursor-pointer"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Disconnect / Change Location</span>
            </button>
          ) : (
            <div />
          )}

          <button
            type="button"
            onClick={handleConfirmAndConnect}
            disabled={isSaving || !selectedPlace.placeId}
            className="inline-flex items-center justify-center gap-2 px-6 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition-all transform active:scale-95 disabled:opacity-50 cursor-pointer"
          >
            {isSaving ? (
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

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl max-w-md w-full border border-rose-200 shadow-2xl p-6 space-y-4 animate-in zoom-in-95 duration-150">
            <div className="flex items-start gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
                <AlertCircle className="w-5 h-5" />
              </div>
              <div className="space-y-1">
                <h3 className="text-base font-bold text-slate-900">Disconnect Google Business?</h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Are you sure you want to disconnect <strong>{profile.business_name}</strong>? This will clear the active Place ID and review stream from the dashboard.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setShowDisconnectModal(false)}
                className="px-4 py-2 rounded-lg border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDisconnect}
                disabled={isDisconnecting}
                className="px-4 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-colors cursor-pointer"
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
