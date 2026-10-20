import { createClient } from '@supabase/supabase-js';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ADMIN_KEY ||
    process.env.SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export interface FunnelBusiness {
  id: string;
  name: string;
  placeId: string | null;
  googleReviewUrl: string | null;
  address: string | null;
  ownerEmail: string | null;
  ownerPhone: string | null;
}

export interface FunnelInvite {
  id?: string;
  token?: string;
  customer_name?: string | null;
  customer_phone?: string | null;
  customer_email?: string | null;
  service_type?: string | null;
  business?: FunnelBusiness;
  [key: string]: any;
}

export interface FunnelData {
  destinationUrl: string | null;
  business: FunnelBusiness;
  invite: FunnelInvite | null;
}

export async function getFunnelData(
  token: string,
  searchParams?: Record<string, string | string[] | undefined>
): Promise<FunnelData> {
  const queryReviewUrl = (typeof searchParams?.reviewUrl === 'string' ? searchParams.reviewUrl : '') || (typeof searchParams?.url === 'string' ? searchParams.url : '');
  const queryPlaceId = typeof searchParams?.placeId === 'string' ? searchParams.placeId : '';
  const queryBusiness = typeof searchParams?.business === 'string' ? searchParams.business : '';

  const business: FunnelBusiness = {
    id: token || 'unknown',
    name: queryBusiness || 'RatingPulse',
    placeId: queryPlaceId || null,
    googleReviewUrl: queryReviewUrl || null,
    address: null,
    ownerEmail: null,
    ownerPhone: null,
  };

  let invite: FunnelInvite | null = null;

  if (token === 'demo' || token === 'demo_ratingpulse_001') {
    business.name = 'RatingPulse';
    business.placeId = 'ChIJawEUC_oN04kRB70LP1wHuPg';
    business.googleReviewUrl = 'https://search.google.com/local/writereview?placeid=ChIJawEUC_oN04kRB70LP1wHuPg';
  } else if (token) {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      // 1. Try finding in review_invites by id or token
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
      let inviteQuery = supabase.from('review_invites').select('*');

      if (isUuid) {
        inviteQuery = inviteQuery.eq('id', token);
      } else {
        inviteQuery = inviteQuery.or(`id.eq.${token},token.eq.${token}`);
      }

      const { data: inviteData } = await inviteQuery.maybeSingle();

      if (inviteData) {
        invite = inviteData;
        business.id = inviteData.user_id || inviteData.business_id || inviteData.id;
        if (inviteData.business_name && (!business.name || business.name === 'RatingPulse')) {
          business.name = inviteData.business_name;
        }
        if (inviteData.place_id && !business.placeId) {
          business.placeId = inviteData.place_id;
        }
        if (inviteData.review_link && inviteData.review_link.startsWith('http') && !inviteData.review_link.includes('/r/')) {
          business.googleReviewUrl = inviteData.review_link;
        }

        const targetUserId = inviteData.user_id || inviteData.business_id;
        if (targetUserId) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', targetUserId)
            .maybeSingle();

          if (profile) {
            if (profile.review_url && !business.googleReviewUrl) business.googleReviewUrl = profile.review_url;
            if (profile.google_place_id && !business.placeId) business.placeId = profile.google_place_id;
            if (profile.business_name && (!business.name || business.name === 'RatingPulse')) business.name = profile.business_name;
            business.address = profile.formatted_address || business.address;
            business.ownerEmail = profile.notification_email || profile.email;
            business.ownerPhone = profile.notification_phone || profile.phone;
          }

          const { data: bSettings } = await supabase
            .from('business_settings')
            .select('*')
            .eq('user_id', targetUserId)
            .maybeSingle();

          if (bSettings) {
            if (bSettings.google_review_url && !business.googleReviewUrl) business.googleReviewUrl = bSettings.google_review_url;
            if (bSettings.place_id && !business.placeId) business.placeId = bSettings.place_id;
            if (bSettings.business_name && (!business.name || business.name === 'RatingPulse')) business.name = bSettings.business_name;
          }
        }
      } else {
        // 2. Try profiles table directly (e.g. business slug/id)
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .or(`id.eq.${token},clerk_user_id.eq.${token}`)
          .maybeSingle();

        if (profile) {
          business.id = profile.id;
          if (profile.business_name) business.name = profile.business_name;
          if (profile.review_url) business.googleReviewUrl = profile.review_url;
          if (profile.google_place_id) business.placeId = profile.google_place_id;
          business.address = profile.formatted_address || null;
          business.ownerEmail = profile.notification_email || profile.email;
          business.ownerPhone = profile.notification_phone || profile.phone;
        }
      }
    }
  }

  // Explicit calculation per requirement 1:
  // const destinationUrl = business.googleReviewUrl || 
  //   (business.placeId ? `https://search.google.com/local/writereview?placeid=${business.placeId}` : null);
  const destinationUrl =
    (business.googleReviewUrl && business.googleReviewUrl.startsWith('http') && !business.googleReviewUrl.includes('/r/'))
      ? business.googleReviewUrl
      : (business.placeId ? `https://search.google.com/local/writereview?placeid=${business.placeId}` : null);

  if (invite) {
    invite.business = business;
  }

  return {
    destinationUrl,
    business,
    invite,
  };
}
