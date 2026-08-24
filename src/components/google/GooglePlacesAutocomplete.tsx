'use client';

import React, { useEffect, useRef, useState } from 'react';
import {
  MapPin,
  Search,
  ExternalLink,
  CheckCircle2,
  Star,
  Copy,
  Check,
  Edit3,
  RefreshCw,
  Sparkles,
  Building,
  ShieldCheck
} from 'lucide-react';

export interface SelectedPlaceData {
  placeId: string;
  businessName: string;
  formattedAddress: string;
  rating?: number;
  reviewCount?: number;
  reviewUrl: string;
}

interface GooglePlacesSearchProps {
  initialPlaceId?: string;
  initialBusinessName?: string;
  initialAddress?: string;
  initialRating?: number;
  initialReviewCount?: number;
  initialReviewUrl?: string;
  onPlaceSelect: (data: SelectedPlaceData) => void;
  showPreviewCard?: boolean;
  className?: string;
}

export default function GooglePlacesSearch({
  initialPlaceId = 'ChIJN1t_tDeuEmsRUsoyG83frY4',
  initialBusinessName = 'Apex Dental & Aesthetics',
  initialAddress = '1400 Broadway, New York, NY 10018',
  initialRating = 4.9,
  initialReviewCount = 284,
  initialReviewUrl = '',
  onPlaceSelect,
  showPreviewCard = true,
  className = '',
}: GooglePlacesSearchProps) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const autocompleteRef = useRef<any>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlace, setSelectedPlace] = useState<SelectedPlaceData>({
    placeId: initialPlaceId,
    businessName: initialBusinessName,
    formattedAddress: initialAddress,
    rating: initialRating,
    reviewCount: initialReviewCount,
    reviewUrl:
      initialReviewUrl ||
      (initialPlaceId ? `https://search.google.com/local/writereview?placeid=${initialPlaceId}` : ''),
  });

  const [isLoaded, setIsLoaded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isManualOverride, setIsManualOverride] = useState(false);
  const [customReviewUrl, setCustomReviewUrl] = useState(
    initialReviewUrl ||
      (initialPlaceId ? `https://search.google.com/local/writereview?placeid=${initialPlaceId}` : '')
  );

  useEffect(() => {
    let isMounted = true;

    function setupAutocomplete() {
      if (!inputRef.current) return;
      if (!(window as any).google?.maps?.places) return;
      if (autocompleteRef.current) return;

      try {
        const autocomplete = new (window as any).google.maps.places.Autocomplete(
          inputRef.current,
          {
            types: ['establishment'],
            fields: ['place_id', 'name', 'formatted_address'],
          }
        );

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (!place || !place.place_id) return;

          const directReviewUrl = `https://search.google.com/local/writereview?placeid=${place.place_id}`;
          const placeData: SelectedPlaceData = {
            placeId: place.place_id,
            businessName: place.name || searchQuery,
            formattedAddress: place.formatted_address || '',
            rating: place.rating || 5.0,
            reviewCount: place.user_ratings_total || 0,
            reviewUrl: directReviewUrl,
          };

          setSelectedPlace(placeData);
          setCustomReviewUrl(directReviewUrl);
          setSearchQuery(place.name || '');
          onPlaceSelect(placeData);
        });

        autocompleteRef.current = autocomplete;
        console.log('Google Places Autocomplete Initialized');
        if (isMounted) {
          setIsLoaded(true);
        }
      } catch (err) {
        console.warn('Autocomplete setup warning:', err);
      }
    }

    if ((window as any).google?.maps?.places) {
      setupAutocomplete();
    } else {
      const s = document.createElement('script');
      s.src =
        'https://maps.googleapis.com/maps/api/js?key=AIzaSyDdAZozLUaoBAoemqT38_bdE3QBNoFuOpY&libraries=places';
      s.async = true;
      s.onload = () => setupAutocomplete();
      document.head.appendChild(s);
    }

    return () => {
      isMounted = false;
    };
  }, [onPlaceSelect]);

  const handleCopyLink = () => {
    const urlToCopy = isManualOverride ? customReviewUrl : selectedPlace.reviewUrl;
    if (urlToCopy && typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(urlToCopy);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCustomUrlChange = (url: string) => {
    setCustomReviewUrl(url);
    const updated = {
      ...selectedPlace,
      reviewUrl: url,
    };
    setSelectedPlace(updated);
    onPlaceSelect(updated);
  };

  const activeReviewUrl = isManualOverride
    ? customReviewUrl
    : selectedPlace.reviewUrl || `https://search.google.com/local/writereview?placeid=${selectedPlace.placeId}`;

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Search Input Box */}
      <div className="relative">
        <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center justify-between">
          <span className="flex items-center gap-1.5">
            <Building className="w-3.5 h-3.5 text-blue-600" />
            Search Your Business on Google Places *
          </span>
          <span className="text-[11px] font-normal text-slate-500">
            {isLoaded ? '⚡ Live Google Autocomplete' : 'Connecting to Google Places...'}
          </span>
        </label>

        <div className="relative flex items-center">
          <div className="absolute left-3.5 flex items-center pointer-events-none text-slate-400">
            <Search className="w-4 h-4" />
          </div>

          <input
            ref={inputRef}
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type your business name or address (e.g. Apex Dental)..."
            className="w-full pl-10 pr-10 py-3 rounded-xl border border-slate-300 text-xs text-slate-900 font-medium placeholder:text-slate-400 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600 focus:outline-none bg-white shadow-2xs"
          />

          {!isLoaded && (
            <div className="absolute right-3.5 text-slate-400">
              <RefreshCw className="w-4 h-4 animate-spin" />
            </div>
          )}
        </div>
      </div>

      {/* UI Preview Card */}
      {showPreviewCard && selectedPlace.placeId && (
        <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-slate-950 text-white p-5 border border-slate-800 shadow-xl space-y-4">
          {/* Top row: Business info & Verified badge */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <h4 className="font-bold text-sm text-white">
                  {selectedPlace.businessName || 'Connected Business'}
                </h4>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 flex items-center gap-1">
                <MapPin className="w-3 h-3 text-slate-500 shrink-0" />
                <span>{selectedPlace.formattedAddress || 'Address on file'}</span>
              </p>
            </div>

            {/* Google Rating Pill */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 border border-slate-700 text-xs font-bold text-amber-400">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>{selectedPlace.rating || 5.0}</span>
                <span className="text-[10px] text-slate-400 font-normal">
                  ({selectedPlace.reviewCount || 0})
                </span>
              </div>

              <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950/80 px-2 py-1 rounded-lg border border-emerald-800/80 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                Verified
              </span>
            </div>
          </div>

          {/* Direct Review Link box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-300 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                Direct 5-Star Google Review Link:
              </span>
              <button
                type="button"
                onClick={() => setIsManualOverride(!isManualOverride)}
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1 cursor-pointer"
              >
                <Edit3 className="w-3 h-3" />
                {isManualOverride ? 'Use Generated Link' : 'Customize Link'}
              </button>
            </div>

            {isManualOverride ? (
              <input
                type="url"
                value={customReviewUrl}
                onChange={(e) => handleCustomUrlChange(e.target.value)}
                placeholder="https://search.google.com/local/writereview?placeid=..."
                className="w-full px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-emerald-300 font-mono focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 focus:outline-none"
              />
            ) : (
              <div className="p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/80 font-mono text-[11px] text-emerald-400 break-all select-all flex items-center justify-between gap-2">
                <span className="truncate">{activeReviewUrl}</span>
                <span className="text-[10px] text-slate-400 shrink-0 font-sans">
                  Place ID: {selectedPlace.placeId.slice(0, 8)}...
                </span>
              </div>
            )}
          </div>

          {/* Actions: Test link & Copy link */}
          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex items-center gap-2">
              <a
                href={activeReviewUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-600/20 transition-all cursor-pointer"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                Test Review Link
              </a>

              <button
                type="button"
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400 font-bold">Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Link</span>
                  </>
                )}
              </button>
            </div>

            <div className="text-[11px] text-slate-400 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Opens Google write-review dialog directly</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
