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
      placeholder="Search business name..."
      className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  );
}
