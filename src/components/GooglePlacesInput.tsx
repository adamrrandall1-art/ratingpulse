'use client';
import { useEffect, useRef } from 'react';

interface GooglePlacesInputProps {
  onPlaceSelect?: (place: { name: string; address: string; placeId: string; reviewUrl: string }) => void;
  apiKey: string;
}

export default function GooglePlacesInput({ onPlaceSelect, apiKey }: GooglePlacesInputProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const initAutocomplete = () => {
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
        types: ['establishment'],
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
      initAutocomplete();
    } else {
      const scriptId = 'google-maps-places-script';
      let script = document.getElementById(scriptId) as HTMLScriptElement;

      if (!script) {
        script = document.createElement('script');
        script.id = scriptId;
        script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
        script.async = true;
        script.onload = initAutocomplete;
        document.head.appendChild(script);
      } else {
        script.addEventListener('load', initAutocomplete);
      }
    }
  }, [apiKey, onPlaceSelect]);

  return (
    <input
      ref={inputRef}
      type="text"
      placeholder="Search business name (e.g., RatingPulse)..."
      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}
