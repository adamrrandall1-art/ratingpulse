/**
 * RatingPulse Google Places & Review Link Helper Library
 */

export const getGooglePlacesApiKey = (): string => {
  return (
    process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ||
    process.env.GOOGLE_PLACES_API_KEY ||
    'AIzaSyDdAZozLUaoBAoemqT38_bdE3QBNoFuOpY'
  );
};

export const generateGoogleReviewUrl = (placeId: string): string => {
  if (!placeId || !placeId.trim()) return '';
  return `https://search.google.com/local/writereview?placeid=${placeId.trim()}`;
};

export interface SelectedPlaceData {
  placeId: string;
  businessName: string;
  formattedAddress: string;
  rating?: number;
  reviewCount?: number;
  reviewUrl: string;
}

let googleScriptLoadingPromise: Promise<void> | null = null;

export const loadGoogleMapsPlacesApi = (apiKey?: string): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve();

  // If already loaded
  if ((window as any).google?.maps?.places) {
    return Promise.resolve();
  }

  if (googleScriptLoadingPromise) {
    return googleScriptLoadingPromise;
  }

  const key = apiKey || getGooglePlacesApiKey();

  googleScriptLoadingPromise = new Promise((resolve, reject) => {
    // Check if script tag is already in document
    const existingScript = document.querySelector('script[src*="maps.googleapis.com/maps/api/js"]');
    if (existingScript) {
      if ((window as any).google?.maps?.places) {
        resolve();
        return;
      }
      existingScript.addEventListener('load', () => resolve());
      existingScript.addEventListener('error', (e) => reject(e));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      resolve();
    };
    script.onerror = (err) => {
      console.warn('Google Places API Script failed to load:', err);
      reject(err);
    };

    document.head.appendChild(script);
  });

  return googleScriptLoadingPromise;
};
