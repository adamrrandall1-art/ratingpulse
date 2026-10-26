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
 * A business is connected IF AND ONLY IF:
 * Boolean(business.isGoogleConnected && (business.placeId || business.googleReviewUrl))
 */
export function isBusinessConnected(
  business?: BusinessConnectionCheckable | null,
  isDemoMode?: boolean
): boolean {
  if (isDemoMode) return true;
  if (!business) return false;

  const googleReviewUrl =
    business.googleReviewUrl && business.googleReviewUrl.trim().length > 0
      ? business.googleReviewUrl.trim()
      : business.reviewUrl && business.reviewUrl.trim().length > 0
      ? business.reviewUrl.trim()
      : business.review_url && business.review_url.trim().length > 0
      ? business.review_url.trim()
      : null;

  const placeId =
    business.placeId && !business.placeId.startsWith('demo_') && business.placeId.trim().length > 0
      ? business.placeId.trim()
      : business.google_place_id && !business.google_place_id.startsWith('demo_') && business.google_place_id.trim().length > 0
      ? business.google_place_id.trim()
      : null;

  // If business has googleReviewUrl or placeId, unconditionally lock to true
  if (googleReviewUrl || placeId) return true;

  const isGoogleConnected = Boolean(
    business.isGoogleConnected ??
    business.google_connected ??
    business.isConnected
  );

  return isGoogleConnected;
}
