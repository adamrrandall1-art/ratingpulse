'use client';

import React, { useState } from 'react';
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
} from 'lucide-react';
import { useRatingPulseStore } from '@/lib/store';
import { toast } from 'sonner';

interface GbpIntegrationCardProps {
  onSyncComplete?: (count: number) => void;
}

export default function GbpIntegrationCard({ onSyncComplete }: GbpIntegrationCardProps) {
  const { profile, syncGoogleReviews, disconnectBusiness, isDemoMode } = useRatingPulseStore();
  const [isSyncing, setIsSyncing] = useState(false);
  const [isDisconnecting, setIsDisconnecting] = useState(false);
  const [showConfirmDisconnect, setShowConfirmDisconnect] = useState(false);

  const isConnected = Boolean(
    profile.google_connected !== false &&
    (profile.google_place_id || isDemoMode)
  );

  const businessName = profile.business_name || (isDemoMode ? "Scoop 'n Twist Ice Cream" : 'No Business Connected');
  const rating = Number(profile.google_rating) > 0 ? Number(profile.google_rating).toFixed(1) : (isDemoMode ? '4.9' : '0.0');
  const reviewCount = profile.google_review_count || (isDemoMode ? 128 : 0);
  const placeId = profile.google_place_id || (isDemoMode ? 'ChIJN1t_tDeuEmsRUsoyG83frY4 (Demo Place ID)' : 'Not configured');
  const address = profile.formatted_address || (isDemoMode ? '142 S Main Street, Cityville, NY 10001' : 'Address not set');

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
              {isDemoMode ? 'Demo / Simulation Active 🟢' : 'Connected to Google 🟢'}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-500"></span>
              Not Connected
            </span>
          )}
        </div>
      </div>

      {/* Main Connected Business Info Box */}
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
              <span>{address}</span>
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
            <span>OAuth 2.0 Business API Active</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
            <span>Auto-Sync Frequency: Every 15 min</span>
          </div>
          <div className="flex items-center gap-2 text-slate-600">
            <Sparkles className="w-4 h-4 text-purple-600 shrink-0" />
            <span>1-Tap Publish Enabled</span>
          </div>
        </div>
      </div>

      {/* Action Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={handleSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
            {isSyncing ? 'Syncing Reviews...' : 'Sync Reviews Now'}
          </button>

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
