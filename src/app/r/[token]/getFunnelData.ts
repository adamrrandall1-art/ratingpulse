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

export function resolveReviewUrl(target: string | null | undefined): string | null {
  if (!target) return null;
  let trimmed = target.trim();
  if (!trimmed) return null;

  // Unwrap any accidentally malformed nested redirect URLs (e.g. placeid=https://...)
  if (trimmed.includes('search.google.com/local/writereview?placeid=')) {
    const parts = trimmed.split('search.google.com/local/writereview?placeid=');
    const candidate = parts[1];
    if (candidate) {
      const decoded = decodeURIComponent(candidate).trim();
      if (decoded.startsWith('http://') || decoded.startsWith('https://')) {
        trimmed = decoded;
      }
    }
  }

  // If it is already a full URL (e.g. https://g.page/r/... or https://maps.google.com/...)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }
  // If it is a raw Place ID (e.g. ChIJ...)
  return `https://search.google.com/local/writereview?placeid=${trimmed}`;
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
  destinationUrl?: string | null;
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
  const queryReviewUrl = (typeof searchParams?.reviewUrl === 'string' ? searchParams.reviewUrl : '') || 
                         (typeof searchParams?.url === 'string' ? searchParams.url : '');
  const queryPlaceId = typeof searchParams?.placeId === 'string' ? searchParams.placeId : '';
  const queryBusiness = typeof searchParams?.business === 'string' ? searchParams.business : '';

  let invite: FunnelInvite | null = null;
  let liveBusiness: FunnelBusiness | null = null;

  if (token === 'demo' || token === 'demo_ratingpulse_001') {
    liveBusiness = {
      id: 'demo',
      name: 'RatingPulse',
      placeId: 'ChIJawEUC_oN04kRB70LP1wHuPg',
      googleReviewUrl: 'https://search.google.com/local/writereview?placeid=ChIJawEUC_oN04kRB70LP1wHuPg',
      address: null,
      ownerEmail: null,
      ownerPhone: null,
    };
    invite = {
      id: 'demo',
      token: 'demo',
      business: liveBusiness,
      destinationUrl: liveBusiness.googleReviewUrl,
    };
  } else {
    const supabase = getSupabaseAdmin();
    if (supabase) {
      // 1. Fetch invite record
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
      let inviteQuery = supabase.from('review_invites').select('*');
      if (isUuid) {
        inviteQuery = inviteQuery.eq('id', token);
      } else {
        inviteQuery = inviteQuery.or(`id.eq.${token},token.eq.${token}`);
      }
      const { data: inviteData } = await inviteQuery.maybeSingle();

      // 2. In the database query, always fetch the live associated business record
      const targetUserId = inviteData?.user_id || inviteData?.business_id;
      let profile: any = null;
      let settings: any = null;

      if (targetUserId) {
        const [profRes, settRes] = await Promise.allSettled([
          supabase.from('profiles').select('*').eq('id', targetUserId).maybeSingle(),
          supabase.from('business_settings').select('*').eq('user_id', targetUserId).maybeSingle(),
        ]);
        profile = profRes.status === 'fulfilled' ? profRes.value.data : null;
        settings = settRes.status === 'fulfilled' ? settRes.value.data : null;
      }

      // If invite had no user_id or profile not found by id, try matching by business_name
      if (!profile && inviteData?.business_name) {
        const { data: profByName } = await supabase
          .from('profiles')
          .select('*')
          .eq('business_name', inviteData.business_name)
          .maybeSingle();
        if (profByName) {
          profile = profByName;
          const { data: settByName } = await supabase
            .from('business_settings')
            .select('*')
            .eq('user_id', profByName.id)
            .maybeSingle();
          settings = settByName;
        }
      }

      // If token itself matches a profile (direct business link / slug)
      if (!profile) {
        const { data: profByToken } = await supabase
          .from('profiles')
          .select('*')
          .or(`id.eq.${token},clerk_user_id.eq.${token}`)
          .maybeSingle();
        if (profByToken) {
          profile = profByToken;
          const { data: settByToken } = await supabase
            .from('business_settings')
            .select('*')
            .eq('user_id', profByToken.id)
            .maybeSingle();
          settings = settByToken;
        }
      }

      // Fallback: If still no profile found, load the latest active business profile
      if (!profile) {
        const { data: activeProfile } = await supabase
          .from('profiles')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();
        if (activeProfile) {
          profile = activeProfile;
          const { data: activeSettings } = await supabase
            .from('business_settings')
            .select('*')
            .eq('user_id', activeProfile.id)
            .maybeSingle();
          settings = activeSettings;
        }
      }

      // Resolve live business fields - dynamically prioritizing live manual review URL overrides
      const liveGoogleReviewUrl =
        (queryReviewUrl && !queryReviewUrl.includes('/r/'))
          ? resolveReviewUrl(queryReviewUrl)
          : (profile?.review_url && !profile.review_url.includes('/r/'))
            ? resolveReviewUrl(profile.review_url)
            : (settings?.google_review_url && !settings.google_review_url.includes('/r/'))
              ? resolveReviewUrl(settings.google_review_url)
              : null;

      const rawPlaceCandidate =
        queryPlaceId ||
        profile?.google_place_id?.trim() ||
        settings?.place_id?.trim() ||
        inviteData?.place_id?.trim() ||
        null;

      // If the candidate string starts with http, it is a review URL, not a Place ID
      const livePlaceId = (rawPlaceCandidate && !rawPlaceCandidate.startsWith('http'))
        ? rawPlaceCandidate
        : null;

      const liveBusinessReviewUrl = liveGoogleReviewUrl || resolveReviewUrl(rawPlaceCandidate);

      const liveBusinessName =
        queryBusiness ||
        profile?.business_name ||
        settings?.business_name ||
        inviteData?.business_name ||
        'RatingPulse';

      liveBusiness = {
        id: profile?.id || targetUserId || token,
        name: liveBusinessName,
        placeId: livePlaceId,
        googleReviewUrl: liveBusinessReviewUrl,
        address: profile?.formatted_address || null,
        ownerEmail: profile?.notification_email || profile?.email || null,
        ownerPhone: profile?.notification_phone || profile?.phone || null,
      };

      const inviteDestUrl =
        (inviteData?.review_link && !inviteData.review_link.includes('/r/'))
          ? resolveReviewUrl(inviteData.review_link)
          : resolveReviewUrl(inviteData?.place_id);

      invite = {
        ...(inviteData || {}),
        id: inviteData?.id || token,
        token: inviteData?.token || token,
        destinationUrl: inviteDestUrl,
        business: liveBusiness,
      };
    }
  }

  if (!liveBusiness) {
    liveBusiness = {
      id: token || 'unknown',
      name: queryBusiness || 'RatingPulse',
      placeId: queryPlaceId || null,
      googleReviewUrl: resolveReviewUrl(queryReviewUrl) || resolveReviewUrl(queryPlaceId) || null,
      address: null,
      ownerEmail: null,
      ownerPhone: null,
    };
  }

  if (!invite) {
    invite = {
      id: token,
      token,
      business: liveBusiness,
      destinationUrl: null,
    };
  }

  // Resolve the destination URL using live business fields with normalized resolver:
  const destinationUrl = 
    resolveReviewUrl(invite?.business?.googleReviewUrl) || 
    resolveReviewUrl(invite?.business?.placeId) || 
    resolveReviewUrl(invite?.destinationUrl) ||
    resolveReviewUrl(liveBusiness.googleReviewUrl) ||
    resolveReviewUrl(liveBusiness.placeId);

  return {
    destinationUrl,
    business: liveBusiness,
    invite,
  };
}
