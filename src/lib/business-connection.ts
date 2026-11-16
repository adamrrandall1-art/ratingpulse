import { isLegacyTestPlaceId, isLegacyTestReviewUrl } from '@/lib/legacy-cleanup';

export interface BusinessConnectionCheckable {
  isGoogleConnected?: boolean | null;
  google_connected?: boolean | null;
  isConnected?: boolean | null;
  placeId?: string | null;
  google_place_id?: string | null;
  googleReviewUrl?: string | null;
  reviewUrl?: string | null;
  review_url?: string | null;
}

/**
 * Single source of truth for business connection across all pages.
 * A business is considered connected if it has a valid Google Review URL,
 * verified Google Place ID, or active Google connection.
 */
export function isBusinessConnected(
  business?: BusinessConnectionCheckable | null,
  isDemoMode?: boolean
): boolean {
  if (isDemoMode) return true;
  if (!business) return false;

  const rawReviewUrl =
    business.googleReviewUrl && business.googleReviewUrl.trim().length > 0
      ? business.googleReviewUrl.trim()
      : business.reviewUrl && business.reviewUrl.trim().length > 0
      ? business.reviewUrl.trim()
      : business.review_url && business.review_url.trim().length > 0
      ? business.review_url.trim()
      : null;

  const rawPlaceId =
    business.placeId && business.placeId.trim().length > 0
      ? business.placeId.trim()
      : business.google_place_id && business.google_place_id.trim().length > 0
      ? business.google_place_id.trim()
      : null;

  const hasValidReviewUrl = Boolean(rawReviewUrl && rawReviewUrl.startsWith('http') && !isLegacyTestReviewUrl(rawReviewUrl));
  const hasValidPlaceId = Boolean(rawPlaceId && !isLegacyTestPlaceId(rawPlaceId));

  if (hasValidReviewUrl || hasValidPlaceId) return true;

  const isGoogleConnected = Boolean(
    business.isGoogleConnected ??
    business.google_connected ??
    business.isConnected
  );

  return isGoogleConnected;
}
