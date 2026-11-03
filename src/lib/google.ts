/**
 * RatingPulse Google Places & Review URL Canonical Utilities
 */

/**
 * Cleanly extracts a Google Place ID from various input patterns:
 * - Raw Place ID: ChIJ...
 * - URLs containing placeid=ChIJ...
 * - URLs containing place_id:ChIJ... or place_id=ChIJ...
 * - Nested malformed search.google.com URLs
 */
export function extractPlaceId(str: string | null | undefined): string | null {
  if (!str) return null;
  const s = String(str).trim();
  if (!s) return null;

  // Check for standard ChIJ place ID pattern
  const chijMatch = s.match(/ChIJ[a-zA-Z0-9_-]+/);
  if (chijMatch) return chijMatch[0];

  // Check for placeid= or place_id= or place_id:
  const pidMatch = s.match(/(?:placeid|place_id)[=:]\s*([a-zA-Z0-9_-]+)/i);
  if (pidMatch && pidMatch[1]) {
    const val = decodeURIComponent(pidMatch[1]).trim();
    if (val.startsWith('http') || val.includes('google.com')) {
      return extractPlaceId(val);
    }
    return val;
  }

  // If raw string looks like a standard Google Place ID (alphanumeric with hyphens/underscores, 20+ chars)
  if (/^[a-zA-Z0-9_-]{20,}$/.test(s) && !s.includes('/') && !s.includes('.')) {
    return s;
  }

  return null;
}

/**
 * Returns the canonical Google review dialog URL for a place ID:
 * https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}
 */
export function getCanonicalGoogleReviewUrl(placeId: string | null | undefined): string {
  const clean = extractPlaceId(placeId) || (placeId ? String(placeId).trim() : '');
  if (!clean) return '';
  return `https://search.google.com/local/writereview?placeid=${encodeURIComponent(clean)}`;
}

/**
 * Fallback URL if direct writereview fails or maps place page is preferred:
 * https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}
 */
export function getMapsPlaceFallbackUrl(placeId: string | null | undefined): string {
  const clean = extractPlaceId(placeId) || (placeId ? String(placeId).trim() : '');
  if (!clean) return '';
  return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(clean)}`;
}

/**
 * Constructs a verified Google review destination URL:
 * 1. Prefers explicit custom googleReviewUrl (e.g. https://g.page/r/.../review or direct GBP URL)
 * 2. Uses canonical writereview?placeid=... if placeId is present
 * 3. Fallback to maps place page if raw placeId fails
 */
export function constructGoogleReviewUrl({
  placeId,
  customReviewUrl,
}: {
  placeId?: string | null;
  customReviewUrl?: string | null;
}): string {
  if (customReviewUrl) {
    const resolvedCustom = resolveReviewUrl(customReviewUrl);
    if (resolvedCustom) return resolvedCustom;
  }

  if (placeId) {
    const canonical = getCanonicalGoogleReviewUrl(placeId);
    if (canonical) return canonical;
    const fallback = getMapsPlaceFallbackUrl(placeId);
    if (fallback) return fallback;
  }

  return 'https://ratingpulse.co';
}

/**
 * Universal resolver that accepts any target (custom URL, place ID, malformed nested string)
 * and guarantees a clean, absolute HTTPS URL.
 */
export function resolveReviewUrl(target: string | null | undefined, fallbackPlaceId?: string | null): string | null {
  if (!target && !fallbackPlaceId) return null;
  let str = (target || '').trim();

  // If input contains a ChIJ place id or is a writereview URL, extract clean place ID
  const chijInTarget = extractPlaceId(str);
  if (
    str.includes('search.google.com/local/writereview') ||
    (chijInTarget && !str.includes('g.page') && !str.includes('maps.app.goo.gl') && !str.includes('/maps/place'))
  ) {
    if (chijInTarget) {
      return getCanonicalGoogleReviewUrl(chijInTarget);
    }
  }

  // Ensure protocol if missing
  if (str.startsWith('//')) {
    str = 'https:' + str;
  } else if (/^(search\.google\.com|g\.page|maps\.app\.goo\.gl|www\.google\.com|maps\.google\.com)/i.test(str)) {
    str = 'https://' + str;
  }

  // If already a valid absolute URL (e.g. g.page/r/... or maps.google.com)
  if (str.startsWith('http://') || str.startsWith('https://')) {
    // If it's a search.google.com URL, make sure it has clean placeId
    if (str.includes('search.google.com/local/writereview')) {
      const pid = extractPlaceId(str);
      if (pid) return getCanonicalGoogleReviewUrl(pid);
    }
    return str;
  }

  // Fallback to place ID
  const pid = chijInTarget || extractPlaceId(fallbackPlaceId);
  if (pid) {
    return getCanonicalGoogleReviewUrl(pid);
  }

  return null;
}

export const generateGoogleReviewUrl = (placeId: string): string => {
  return getCanonicalGoogleReviewUrl(placeId) || resolveReviewUrl(placeId) || '';
};
