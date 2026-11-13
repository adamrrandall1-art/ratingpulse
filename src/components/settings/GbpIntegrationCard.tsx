'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  RefreshCw,
  ExternalLink,
  MapPin,
  Star,
  CheckCircle2,
  AlertTriangle,
  Unlink,
  Building2,
  ShieldCheck,
  Store,
  Link2,
  Save,
} from 'lucide-react';
import { useRatingPulseStore, isBusinessConnected } from '@/lib/store';
import { saveAllSettingsAction } from '@/app/dashboard/settings/actions';
import { toast } from 'sonner';

interface GbpIntegrationCardProps {
  onSyncComplete?: (count: number) => void;
  business?: any;
  initialBusiness?: any;
  settingsState?: any;
  setSettingsState?: React.Dispatch<React.SetStateAction<any>>;
  onSave?: (overrides?: any) => Promise<void> | void;
  isSaving?: boolean;
}

export default function GbpIntegrationCard({
  onSyncComplete,
  business,
  initialBusiness,
  settingsState,
  setSettingsState,
  onSave,
  isSaving = false,
}: GbpIntegrationCardProps) {
  const { activeBusiness, setActiveBusiness, syncGoogleReviews, disconnectBusiness, isDemoMode, toggleDemoMode } = useRatingPulseStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);
  const [isSavingReviewLinks, setIsSavingReviewLinks] = useState(false);

  // Review URL and Place ID states
  const [googleReviewUrl, setGoogleReviewUrl] = useState<string>(() => {
    return (
      settingsState?.googleReviewUrl ||
      settingsState?.google_review_url ||
      activeBusiness?.googleReviewUrl ||
      activeBusiness?.reviewUrl ||
      initialBusiness?.googleReviewUrl ||
      initialBusiness?.reviewUrl ||
      business?.googleReviewUrl ||
      business?.reviewUrl ||
      ''
    );
  });

  const [placeIdInput, setPlaceIdInput] = useState<string>(() => {
    return (
      settingsState?.placeId ||
      settingsState?.place_id ||
      activeBusiness?.placeId ||
      initialBusiness?.placeId ||
      business?.placeId ||
      ''
    );
  });

  useEffect(() => {
    if (settingsState?.googleReviewUrl !== undefined) {
      setGoogleReviewUrl(settingsState.googleReviewUrl);
    }
  }, [settingsState?.googleReviewUrl]);

  useEffect(() => {
    if (settingsState?.placeId !== undefined) {
      setPlaceIdInput(settingsState.placeId);
    }
  }, [settingsState?.placeId]);

  const handleReviewUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setGoogleReviewUrl(val);
    if (setSettingsState) {
      setSettingsState((prev: any) => ({
        ...prev,
        googleReviewUrl: val,
      }));
    }
    setActiveBusiness({
      googleReviewUrl: val,
      reviewUrl: val,
    });
  };

  const handlePlaceIdChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPlaceIdInput(val);
    if (setSettingsState) {
      setSettingsState((prev: any) => ({
        ...prev,
        placeId: val,
      }));
    }
    setActiveBusiness({
      placeId: val,
    });
  };

  const handleSaveReviewLinks = async () => {
    setIsSavingReviewLinks(true);
    try {
      if (onSave) {
        await onSave({ googleReviewUrl, placeId: placeIdInput });
      } else {
        const res = await saveAllSettingsAction({
          googleReviewUrl,
          placeId: placeIdInput,
          businessId: activeBusiness?.id || initialBusiness?.id,
        });
        if (!res || !res.success) {
          throw new Error((res as any)?.error || 'Failed to save review link settings.');
        }
      }
      toast.success('Direct Google Review Link saved successfully!', {
        description: 'Customer review invites and routing will now direct directly to this URL.',
      });
    } catch (err: any) {
      toast.error('Failed to save review link', {
        description: err?.message || 'Could not update review link settings.',
      });
    } finally {
      setIsSavingReviewLinks(false);
    }
  };

  const hasValidPlaceId = Boolean(placeIdInput && !placeIdInput.startsWith('demo_') && placeIdInput.trim().length > 0);
  const hasDirectReviewUrl = Boolean(
    (googleReviewUrl && googleReviewUrl.startsWith('http')) ||
    (activeBusiness?.googleReviewUrl && activeBusiness.googleReviewUrl.startsWith('http')) ||
    (activeBusiness?.reviewUrl && activeBusiness.reviewUrl.startsWith('http'))
  );
  const hasOAuthApi = Boolean(isDemoMode || activeBusiness?.isGoogleConnected);
  const isConnected = isDemoMode || hasOAuthApi || hasDirectReviewUrl || hasValidPlaceId;
  const businessName = activeBusiness.name || (isDemoMode ? 'RatingPulse Demo' : 'Your Business');
  const rawCount = activeBusiness.reviewCount;
  const reviewCount = (rawCount === 284 || rawCount === 128 || rawCount === 48) ? 0 : (rawCount || 0);
  const rawRating = activeBusiness.rating;
  const rating = (reviewCount === 0 || (rawRating === 4.9 && reviewCount === 0) || !rawRating || rawRating <= 0) ? '0.0' : rawRating.toFixed(1);
  const placeId = placeIdInput || activeBusiness.placeId || 'Not configured';
  const address = activeBusiness.address;

  const handleSync = async () => {
    setIsSyncing(true);
    try {
      const count = await syncGoogleReviews();
      toast.success('Google Reviews Synced!', {
        description: `Successfully refreshed live reviews and metrics from Google Business Profile (${count || reviewCount} reviews loaded).`,
      });
      if (onSyncComplete) onSyncComplete(count);
    } catch (err: any) {
      toast.error('Sync failed', {
        description: err?.message || 'Could not connect to Google Business Profile API.',
      });
    } finally {
      setIsSyncing(false);
    }
  };

  const handleDisconnect = async () => {
    setIsDisconnecting(true);
    try {
      await disconnectBusiness();
      setShowConfirmDisconnect(false);
      toast.success('Google Business Profile Disconnected', {
        description: 'Your business profile and cached reviews have been unlinked.',
      });
    } catch (err: any) {
      toast.error('Disconnect failed', {
        description: err?.message || 'Could not complete disconnection.',
      });
    } finally {
      setIsDisconnecting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-2xs space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
            <Store className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">Google Business Profile Integration</h3>
            <p className="text-xs text-slate-500">
              Connect your verified Google listing to sync live reviews and publish 1-tap AI replies.
            </p>
          </div>
        </div>

        <div>
          {isConnected ? (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              {isDemoMode ? `Demo Connected (${businessName}) 🟢` : hasOAuthApi ? 'OAuth Connected 🟢' : 'Review Link Connected 🟢'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Not Connected
            </span>
          )}
        </div>
      </div>

      {/* Main Connected Business Info Box / Unconnected State */}
      {isConnected ? (
        <div className="p-5 rounded-2xl bg-gradient-to-br from-slate-50 to-blue-50/20 border border-slate-200/80 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-slate-400" />
                <h4 className="text-base font-bold text-slate-900">{businessName}</h4>
                {isDemoMode && (
                  <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-md bg-blue-100 text-blue-800 border border-blue-200">
                    Sample Business
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-xs text-slate-500">
                <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                <span>{address || 'Address configured'}</span>
              </div>

              <div className="flex items-center gap-3 pt-1 text-xs">
                <div className="flex items-center gap-1 text-amber-600 font-bold">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span>{rating} Google Rating</span>
                </div>
                <span className="text-slate-300">•</span>
                <span className="text-slate-600 font-medium">{reviewCount} Total Verified Reviews</span>
              </div>
            </div>

            {/* Place ID Badge */}
            <div className="sm:text-right">
              <div className="text-[11px] font-semibold text-slate-500">Google Place ID</div>
              <code className="text-xs font-mono bg-white px-2 py-1 rounded-md border border-slate-200 text-slate-700 inline-block mt-1 max-w-[220px] truncate">
                {placeId}
              </code>
            </div>
          </div>

          {/* API Connection Metadata Row */}
          <div className="pt-3 border-t border-slate-200/60 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
            <div className="flex items-center gap-2 text-slate-600">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{hasOAuthApi ? 'OAuth 2.0 Business API Active' : 'Direct Review Link Active'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
              <span>{hasOAuthApi ? 'Auto-Sync Frequency: Every 15 min' : 'Manual Link Routing Active'}</span>
            </div>
            <div className="flex items-center gap-2 text-slate-600">
              <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
              <span>{hasOAuthApi ? '1-Tap Publish Enabled' : 'Smart Routing Enabled'}</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-8 rounded-2xl border border-dashed border-slate-200 bg-slate-50/50 text-center space-y-3">
          <div className="w-12 h-12 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
            <Store className="w-6 h-6" />
          </div>
          <h4 className="text-sm font-bold text-slate-900">No Business Profile Connected</h4>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Connect your Google Business Profile to verify ownership, sync authentic Google Maps reviews, and enable 1-tap AI responses.
          </p>
          <div className="pt-2">
            <Link
              href="/dashboard/setup"
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-600/20"
            >
              <ExternalLink className="w-3.5 h-3.5" />
              <span>Connect Google Profile in Setup →</span>
            </Link>
          </div>
        </div>
      )}

      {/* Direct Google Review Link & Place ID Configuration Form */}
      <div className="p-5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <Link2 className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Google Review Destination Links
              </h4>
              <p className="text-xs text-slate-500">
                Direct happy customers to your official Google review form when they rate 4 or 5 stars.
              </p>
            </div>
          </div>
          {googleReviewUrl && (
            <a
              href={googleReviewUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 font-semibold transition-colors"
            >
              <span>Test Review Link</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          )}
        </div>

        <div className="space-y-4">
          {/* 1. Direct Google Review Link (Recommended) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between">
              <label htmlFor="google_review_url" className="block text-xs font-bold text-slate-800">
                Direct Google Review Link <span className="text-blue-600 font-semibold">(Recommended)</span>
              </label>
              <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                Works for all businesses
              </span>
            </div>
            <div className="relative">
              <input
                id="google_review_url"
                name="google_review_url"
                type="url"
                placeholder="https://g.page/r/your-business-code/review"
                value={googleReviewUrl}
                onChange={handleReviewUrlChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Search &apos;my business&apos; on Google, click &apos;Ask for reviews&apos;, and paste the link here. Works for all businesses, including service-area businesses without a public street address.
            </p>
          </div>

          {/* 2. Google Place ID (Optional Fallback) */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label htmlFor="place_id" className="block text-xs font-bold text-slate-700">
                Google Place ID <span className="text-slate-400 font-normal">(Optional Fallback)</span>
              </label>
              <span className="text-[10px] text-slate-400 font-medium">
                Physical storefronts
              </span>
            </div>
            <div className="relative">
              <input
                id="place_id"
                name="place_id"
                type="text"
                placeholder="e.g. ChIJ30Y_j4pZwokRx0wHl0m6SgQ"
                value={placeIdInput}
                onChange={handlePlaceIdChange}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs text-slate-900 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 font-mono transition-all"
              />
            </div>
            <p className="text-[11px] text-slate-500 leading-relaxed">
              Used as a fallback for storefront businesses if a direct review link is not provided.
            </p>
          </div>

          {/* Save Button for Review Links */}
          <div className="flex items-center justify-end pt-2">
            <button
              type="button"
              onClick={handleSaveReviewLinks}
              disabled={isSavingReviewLinks || isSaving}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              {(isSavingReviewLinks || isSaving) ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving Review Links...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Save Review Link Settings</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-3">
          {isConnected && (
            <button
              type="button"
              onClick={handleSync}
              disabled={isSyncing}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              {isSyncing ? 'Syncing Reviews...' : 'Sync Reviews Now'}
            </button>
          )}

          <Link
            href="/dashboard/setup"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold transition-colors border border-slate-200"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            {isConnected ? 'Change Connected Business' : 'Connect Google Profile'}
          </Link>
        </div>

        {isConnected && !showConfirmDisconnect && (
          <button
            type="button"
            onClick={() => setShowConfirmDisconnect(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold transition-colors cursor-pointer border border-transparent hover:border-rose-200"
          >
            <Unlink className="w-3.5 h-3.5" />
            Disconnect
          </button>
        )}

        {showConfirmDisconnect && (
          <div className="flex items-center gap-2 p-2 rounded-xl bg-rose-50 border border-rose-200">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span className="text-xs text-rose-800 font-medium">Unlink Google account?</span>
            <button
              type="button"
              onClick={handleDisconnect}
              disabled={isDisconnecting}
              className="px-2.5 py-1 rounded-lg bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 transition-colors"
            >
              {isDisconnecting ? 'Unlinking...' : 'Confirm'}
            </button>
            <button
              type="button"
              onClick={() => setShowConfirmDisconnect(false)}
              className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 text-slate-600 text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
