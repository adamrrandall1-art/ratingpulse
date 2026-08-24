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
  placeholder = 'Search your business name on Google...',
  className = ''
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const init = () => {
      if (!inputRef.current || !(window as any).google?.maps?.places) return;
      const autocomplete = new (window as any).google.maps.places.Autocomplete(inputRef.current, {
        types: ['establishment'],
        fields: ['place_id', 'name', 'formatted_address']
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
