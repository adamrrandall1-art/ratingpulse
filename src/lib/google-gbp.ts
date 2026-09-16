import { Profile, Review } from './supabase/types';

export const GOOGLE_OAUTH_SCOPES = [
  'https://www.googleapis.com/auth/business.manage',
  'https://www.googleapis.com/auth/userinfo.email',
  'https://www.googleapis.com/auth/userinfo.profile',
].join(' ');

export interface GoogleTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
  token_type: string;
  id_token?: string;
}

export interface GBPAccount {
  name: string; // e.g., "accounts/1122334455"
  accountName?: string;
  type?: string;
  role?: string;
}

export interface GBPLocation {
  name: string; // e.g., "locations/9988776655" or "accounts/1122334455/locations/9988776655"
  title?: string;
  storefrontAddress?: {
    addressLines?: string[];
    locality?: string;
    administrativeArea?: string;
    postalCode?: string;
  };
  metadata?: {
    placeId?: string;
    mapsUri?: string;
    newReviewUri?: string;
  };
  websiteUri?: string;
}

export interface GBPReviewItem {
  reviewId: string;
  reviewer: {
    displayName?: string;
    profilePhotoUrl?: string;
    isAnonymous?: boolean;
  };
  starRating: 'STAR_RATING_UNSPECIFIED' | 'ONE' | 'TWO' | 'THREE' | 'FOUR' | 'FIVE' | string;
  comment?: string;
  createTime?: string;
  updateTime?: string;
  reviewReply?: {
    comment?: string;
    updateTime?: string;
  };
}

export function getGoogleOAuthConfig() {
  const clientId = process.env.GOOGLE_CLIENT_ID || '';
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET || '';
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ratingpulse.co';
  const redirectUri = `${appUrl.replace(/\/$/, '')}/api/auth/google/callback`;

  return {
    clientId,
    clientSecret,
    redirectUri,
    isConfigured: Boolean(clientId && clientSecret),
  };
}

export function generateGoogleAuthUrl(stateData: { userId?: string; returnUrl?: string } = {}) {
  const { clientId, redirectUri } = getGoogleOAuthConfig();
  if (!clientId) {
    throw new Error('GOOGLE_CLIENT_ID is not configured');
  }

  const encodedState = Buffer.from(JSON.stringify(stateData)).toString('base64url');

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: GOOGLE_OAUTH_SCOPES,
    access_type: 'offline',
    prompt: 'consent',
    include_granted_scopes: 'true',
    state: encodedState,
  });

  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

export async function exchangeCodeForTokens(code: string): Promise<GoogleTokenResponse> {
  const { clientId, clientSecret, redirectUri } = getGoogleOAuthConfig();
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials are missing from environment');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error_description || data.error || 'Failed to exchange authorization code for Google tokens');
  }

  return data as GoogleTokenResponse;
}

export async function refreshGoogleAccessToken(refreshToken: string): Promise<{ access_token: string; expires_in: number }> {
  const { clientId, clientSecret } = getGoogleOAuthConfig();
  if (!clientId || !clientSecret) {
    throw new Error('Google OAuth credentials missing');
  }

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      refresh_token: refreshToken,
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'refresh_token',
    }),
  });

  const data = await res.json();
  if (!res.ok || data.error) {
    throw new Error(data.error_description || data.error || 'Failed to refresh Google access token');
  }

  return {
    access_token: data.access_token,
    expires_in: data.expires_in || 3600,
  };
}

export async function getValidAccessTokenForProfile(
  profile: Partial<Profile>,
  updateProfileCallback?: (updates: Partial<Profile>) => Promise<void>
): Promise<string | null> {
  if (!profile.google_access_token && !profile.google_refresh_token) {
    return null;
  }

  const expiry = profile.google_token_expiry ? Number(new Date(profile.google_token_expiry).getTime()) : 0;
  const isExpired = !expiry || Date.now() > expiry - 5 * 60 * 1000; // 5 min buffer

  if (!isExpired && profile.google_access_token) {
    return profile.google_access_token;
  }

  if (!profile.google_refresh_token) {
    return profile.google_access_token || null;
  }

  try {
    const refreshed = await refreshGoogleAccessToken(profile.google_refresh_token);
    const newExpiry = new Date(Date.now() + refreshed.expires_in * 1000).toISOString();

    if (updateProfileCallback) {
      await updateProfileCallback({
        google_access_token: refreshed.access_token,
        google_token_expiry: newExpiry,
      });
    }

    return refreshed.access_token;
  } catch (err) {
    console.error('[Google Token Refresh Error]:', err);
    return profile.google_access_token || null;
  }
}

export async function fetchGBPAccounts(accessToken: string): Promise<GBPAccount[]> {
  try {
    const res = await fetch('https://mybusinessaccountmanagement.googleapis.com/v1/accounts', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    return data.accounts || [];
  } catch (err) {
    console.error('[fetchGBPAccounts Exception]:', err);
    return [];
  }
}

export async function fetchGBPLocations(accountName: string, accessToken: string): Promise<GBPLocation[]> {
  try {
    const cleanAccount = accountName.startsWith('accounts/') ? accountName : `accounts/${accountName}`;
    const url = `https://mybusinessbusinessinformation.googleapis.com/v1/${cleanAccount}/locations?readMask=name,title,storefrontAddress,metadata,websiteUri`;
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    const data = await res.json();
    return data.locations || [];
  } catch (err) {
    console.error('[fetchGBPLocations Exception]:', err);
    return [];
  }
}

function parseStarRating(starRating: string): number {
  switch (starRating) {
    case 'FIVE':
      return 5;
    case 'FOUR':
      return 4;
    case 'THREE':
      return 3;
    case 'TWO':
      return 2;
    case 'ONE':
      return 1;
    default:
      return 5;
  }
}

export async function fetchGBPReviews(
  accountName: string,
  locationName: string,
  accessToken: string
): Promise<{ reviews: Review[]; averageRating?: number; totalReviewCount?: number }> {
  try {
    const cleanAccount = accountName.startsWith('accounts/') ? accountName : `accounts/${accountName}`;
    const cleanLocation = locationName.includes('/') ? locationName.split('/').pop()! : locationName;
    const url = `https://mybusiness.googleapis.com/v4/${cleanAccount}/locations/${cleanLocation}/reviews`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      console.warn('[fetchGBPReviews API Response warning]:', data.error || data);
      return { reviews: [] };
    }

    const gbpReviews: GBPReviewItem[] = data.reviews || [];
    const mappedReviews: Review[] = gbpReviews.map((rev) => {
      const author = rev.reviewer?.displayName || 'Google Customer';
      const firstName = author.split(' ')[0] || 'there';
      const rating = parseStarRating(rev.starRating);
      const text = rev.comment || '';
      const reviewDate = rev.createTime || new Date().toISOString();
      const publishedReply = rev.reviewReply?.comment || null;
      const repliedAt = rev.reviewReply?.updateTime || null;

      let aiDraft = '';
      if (rating >= 4) {
        aiDraft = `Thank you so much for the 5-star review, ${firstName}! We are thrilled to hear you had such a wonderful experience with our team. We look forward to seeing you again soon! #friendlyservice #5star`;
      } else if (rating === 3) {
        aiDraft = `Thank you for taking the time to share your feedback, ${firstName}. We appreciate your business and are always working to improve. Please feel free to reach out to us directly so we can ensure your next visit is exceptional.`;
      } else {
        aiDraft = `Hi ${firstName}, thank you for your feedback. We take all feedback seriously and would love the opportunity to make things right. Please reach out to us directly so we can assist you.`;
      }

      return {
        id: `rev_gbp_${rev.reviewId}`,
        user_id: '',
        review_id: rev.reviewId,
        author_name: author,
        author_avatar: rev.reviewer?.profilePhotoUrl || null,
        rating,
        review_text: text,
        review_date: reviewDate,
        ai_draft_reply: aiDraft,
        review_reply: publishedReply,
        published_reply: publishedReply,
        replied_at: repliedAt,
        published_at: repliedAt,
        status: publishedReply ? 'published' : 'pending_approval',
        sentiment: rating >= 4 ? 'positive' : rating === 3 ? 'neutral' : 'negative',
        keywords_used: ['#friendly_service', '#5star_experience'],
        created_at: reviewDate,
      };
    });

    return {
      reviews: mappedReviews,
      averageRating: data.averageRating,
      totalReviewCount: data.totalReviewCount,
    };
  } catch (err) {
    console.error('[fetchGBPReviews Exception]:', err);
    return { reviews: [] };
  }
}

export async function replyToGBPReview(
  accountName: string,
  locationName: string,
  reviewId: string,
  comment: string,
  accessToken: string
): Promise<{ success: boolean; reply?: { comment: string; updateTime: string }; error?: string }> {
  try {
    const cleanAccount = accountName.startsWith('accounts/') ? accountName : `accounts/${accountName}`;
    const cleanLocation = locationName.includes('/') ? locationName.split('/').pop()! : locationName;
    const url = `https://mybusiness.googleapis.com/v4/${cleanAccount}/locations/${cleanLocation}/reviews/${reviewId}/reply`;

    const res = await fetch(url, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ comment }),
    });

    const data = await res.json();
    if (!res.ok || data.error) {
      const errMsg = data.error?.message || data.error || 'Failed to publish reply to Google Business Profile';
      console.error('[replyToGBPReview Error]:', errMsg);
      return { success: false, error: errMsg };
    }

    return {
      success: true,
      reply: {
        comment: data.comment,
        updateTime: data.updateTime || new Date().toISOString(),
      },
    };
  } catch (err: any) {
    console.error('[replyToGBPReview Exception]:', err);
    return { success: false, error: err?.message || 'Network exception replying to Google review' };
  }
}
