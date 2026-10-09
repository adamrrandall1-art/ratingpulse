'use client';
import React, { useEffect, useRef } from 'react';

interface Props {
  onPlaceSelect?: (place: { name: string; address: string; placeId: string; reviewUrl: string }) => void;
  defaultValue?: string;
  placeholder?: string;
  className?: string;
}

export default function GooglePlacesAutocomplete({
  onPlaceSelect,
  defaultValue = '',
  placeholder = "Search business name (e.g., Scoop 'n Twist)...",
  className = ''
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = () => {
      if (!inputRef.current || !(window as any).google?.maps?.places) return;

      const rochesterCenter = new (window as any).google.maps.LatLng(43.1566, -77.6088);
      const defaultBounds = new (window as any).google.maps.Circle({
        center: rochesterCenter,
        radius: 35000, // ~22 miles
      }).getBounds();

      const autocomplete = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
        fields: ['place_id', 'name', 'formatted_address', 'rating', 'user_ratings_total', 'address_components', 'types', 'geometry'],
        bounds: defaultBounds || undefined,
        strictBounds: false,
        componentRestrictions: { country: 'us' },
        types: ['establishment']
      });

      if (defaultBounds) {
        autocomplete.setBounds(defaultBounds);
      }
      autocomplete.setOptions({
        strictBounds: false, // Soft bias: prioritizes Rochester without blocking other areas
        componentRestrictions: { country: 'us' },
        types: ['establishment'],
      });

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.place_id) return;
        const reviewUrl = `https://search.google.com/local/writereview?placeid=${place.place_id}`;
        if (onPlaceSelect) {
          onPlaceSelect({
            name: place.name || '',
            address: place.formatted_address || '',
            placeId: place.place_id,
            reviewUrl
          });
        }
      });
    };

    if ((window as any).google?.maps?.places) {
      init();
    } else {
      const existing = document.getElementById('google-maps-script');
      if (!existing) {
        const s = document.createElement('script');
        s.id = 'google-maps-script';
        s.src = 'https://maps.googleapis.com/maps/api/js?key=AIzaSyDdAZozLUaoBAoemqT38_bdE3QBNoFuOpY&libraries=places';
        s.async = true;
        s.onload = init;
        document.head.appendChild(s);
      } else {
        existing.addEventListener('load', init);
      }
    }
  }, [onPlaceSelect]);

  return (
    <input
      ref={inputRef}
      type="text"
      defaultValue={defaultValue}
      placeholder={placeholder}
      className={
        className ||
        'w-full px-4 py-2.5 bg-slate-900/50 border border-slate-700/80 rounded-xl text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all shadow-inner text-sm'
      }
    />
  );
}
