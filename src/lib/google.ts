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
 * Prioritizes direct review link (g.page format or GBP direct URL) over raw place ID.
 * If only placeId is available, uses the canonical Google Maps place URL:
 * https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(business.placeId)}
 * Falls back to business name + address search on Google Maps.
 */
export const getReviewUrl = (business: {
  googleReviewUrl?: string | null;
  reviewLink?: string | null;
  reviewUrl?: string | null;
  google_review_url?: string | null;
  placeId?: string | null;
  place_id?: string | null;
  google_place_id?: string | null;
  name?: string | null;
  business_name?: string | null;
  address?: string | null;
  formatted_address?: string | null;
  [key: string]: any;
} | null | undefined): string => {
  if (!business) return 'https://ratingpulse.co';

  // 1. Direct custom review link (g.page format, GBP custom link, etc.)
  const candidateUrl =
    business.googleReviewUrl ||
    business.reviewLink ||
    business.reviewUrl ||
    business.google_review_url;

  if (candidateUrl && typeof candidateUrl === 'string' && candidateUrl.trim() && !candidateUrl.includes('/r/')) {
    let clean = candidateUrl.trim();

    // If candidate is the deprecated search.google.com/local/writereview (which fails with 404 on Google),
    // convert it directly to the canonical Google Maps place URL instead of sending users to a 404.
    if (clean.includes('search.google.com/local/writereview')) {
      const extracted =
        extractPlaceId(clean) ||
        extractPlaceId(business.placeId || business.place_id || business.google_place_id);
      if (extracted) {
        return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(extracted)}`;
      }
    } else {
      if (clean.startsWith('//')) {
        clean = 'https:' + clean;
      } else if (!clean.startsWith('http://') && !clean.startsWith('https://')) {
        clean = 'https://' + clean;
      }
      return clean;
    }
  }

  // 2. Canonical Google Maps Place URL
  const rawPlaceId = business.placeId || business.place_id || business.google_place_id;
  const cleanPlaceId = extractPlaceId(rawPlaceId) || (rawPlaceId ? String(rawPlaceId).trim() : null);

  if (cleanPlaceId) {
    return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(cleanPlaceId)}`;
  }

  // 3. Fallback to business name + address search on Google
  const name = business.name || business.business_name || '';
  const address = business.address || business.formatted_address || '';
  const searchQuery = encodeURIComponent(`${name} ${address}`.trim());

  if (searchQuery) {
    return `https://www.google.com/maps/search/?api=1&query=${searchQuery}`;
  }

  return 'https://ratingpulse.co';
};

/**
 * Returns the canonical Google Maps place URL for a place ID:
 * https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}
 */
export function getCanonicalGoogleReviewUrl(placeId: string | null | undefined): string {
  const clean = extractPlaceId(placeId) || (placeId ? String(placeId).trim() : '');
  if (!clean) return '';
  return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(clean)}`;
}

/**
 * Fallback URL for Google Maps place page:
 * https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(placeId)}
 */
export function getMapsPlaceFallbackUrl(placeId: string | null | undefined): string {
  const clean = extractPlaceId(placeId) || (placeId ? String(placeId).trim() : '');
  if (!clean) return '';
  return `https://www.google.com/maps/place/?q=place_id:${encodeURIComponent(clean)}`;
}

/**
 * Constructs a verified Google review destination URL using the 3-tier getReviewUrl logic:
 * 1. Direct custom review link (g.page format or direct review URL)
 * 2. Canonical Google Maps Place URL (https://www.google.com/maps/place/?q=place_id:...)
 * 3. Fallback to business name + address search on Google
 */
export function constructGoogleReviewUrl({
  placeId,
  customReviewUrl,
  name,
  address,
}: {
  placeId?: string | null;
  customReviewUrl?: string | null;
  name?: string | null;
  address?: string | null;
}): string {
  return getReviewUrl({
    googleReviewUrl: customReviewUrl,
    placeId,
    name,
    address,
  });
}

/**
 * Universal resolver that accepts any target (custom URL, place ID, malformed string)
 * and guarantees a clean, absolute HTTPS URL without 404 writereview endpoints.
 */
export function resolveReviewUrl(target: string | null | undefined, fallbackPlaceId?: string | null): string | null {
  if (!target && !fallbackPlaceId) return null;
  let str = (target || '').trim();

  // If input contains a ChIJ place id or is a writereview URL, extract clean place ID and use Maps place URL
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
