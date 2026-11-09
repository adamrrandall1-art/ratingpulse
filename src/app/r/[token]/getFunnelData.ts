import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db';
import {
  extractPlaceId,
  constructGoogleReviewUrl,
  resolveReviewUrl,
  getCanonicalGoogleReviewUrl,
  getReviewUrl,
  isInternalFunnelUrl,
} from '@/lib/google';
import type { FunnelBusiness, FunnelInvite, FunnelData } from './types';
export { resolveReviewUrl, extractPlaceId, constructGoogleReviewUrl, getReviewUrl, isInternalFunnelUrl };
export type { FunnelBusiness, FunnelInvite, FunnelData };

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
      googleReviewUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJawEUC_oN04kRB70LP1wHuPg',
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
      let inviteData: any = null;
      try {
        inviteData = await db.reviewInvite.findFirst({
          where: {
            OR: [
              { id: token },
              { token: token },
            ],
          },
        });
      } catch {}

      if (!inviteData) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
        let inviteQuery = supabase.from('review_invites').select('*');
        if (isUuid) {
          inviteQuery = inviteQuery.eq('id', token);
        } else {
          inviteQuery = inviteQuery.or(`id.eq.${token},token.eq.${token}`);
        }
        const { data: sData } = await inviteQuery.maybeSingle();
        inviteData = sData;
      }

      // Record tap event & increment clicks in review_invites
      if (inviteData?.id) {
        try {
          const updatedInvite = await db.reviewInvite.update({
            where: { id: inviteData.id },
            data: {
              status: inviteData.status === 'reviewed' ? 'reviewed' : 'opened',
              openedAt: new Date(),
              clicks: { increment: 1 },
            },
          });
          if (updatedInvite) {
            inviteData = { ...inviteData, ...updatedInvite };
          }
        } catch (tapErr) {
          console.warn('[getFunnelData] Error updating invite tap:', tapErr);
        }
      }

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

      // If still no profile found, try Supabase businesses table
      if (!profile) {
        try {
          const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
          let bizQuery = supabase.from('businesses').select('*');
          if (isUuid) {
            bizQuery = bizQuery.or(`id.eq.${token},userId.eq.${token},user_id.eq.${token}`);
          } else {
            bizQuery = bizQuery.or(`clerkUserId.eq.${token},clerk_user_id.eq.${token}`);
          }
          const { data: bData } = await bizQuery.maybeSingle();
          if (bData) {
            profile = {
              id: bData.id,
              business_name: bData.name,
              review_url: bData.googleReviewUrl || bData.google_review_url || bData.reviewUrl || bData.review_url,
              google_place_id: bData.placeId || bData.place_id,
              formatted_address: bData.address,
              notification_email: bData.negativeAlertEmail || bData.negative_alert_email || bData.email,
              notification_phone: bData.negativeAlertPhone || bData.negative_alert_phone || bData.phone,
              email: bData.email,
              phone: bData.phone,
            };
            const bUserId = bData.userId || bData.user_id || bData.id;
            if (!settings && bUserId) {
              const { data: bSett } = await supabase
                .from('business_settings')
                .select('*')
                .or(`user_id.eq.${bUserId},id.eq.${bUserId}`)
                .maybeSingle();
              if (bSett) settings = bSett;
            }
          }
        } catch (dbErr) {
          console.warn('[getFunnelData] businesses lookup warning:', dbErr);
        }
      }

      // Check if token directly matches business_settings id or user_id
      if (!settings) {
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(token);
        if (isUuid) {
          const { data: directSettings } = await supabase
            .from('business_settings')
            .select('*')
            .or(`id.eq.${token},user_id.eq.${token}`)
            .maybeSingle();
          if (directSettings) {
            settings = directSettings;
          }
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
          if (!settings) {
            const { data: activeSettings } = await supabase
              .from('business_settings')
              .select('*')
              .eq('user_id', activeProfile.id)
              .maybeSingle();
            settings = activeSettings;
          }
        }
      }

      // If settings still null, query by profile.id or profile.user_id
      if (!settings && (profile?.id || (profile as any)?.user_id)) {
        const uid = profile.id || (profile as any).user_id;
        const { data: sByUid } = await supabase
          .from('business_settings')
          .select('*')
          .or(`user_id.eq.${uid},id.eq.${uid}`)
          .maybeSingle();
        if (sByUid) settings = sByUid;
      }

      // Resolve live business review link:
      // A direct custom review URL from business_settings (e.g. https://g.page/r/CcSqbA6YaZ6-EBM/review)
      // is the business owner's explicit configuration and takes TOP PRIORITY over generic map coordinate URLs!
      const rawSettingsUrl = settings?.google_review_url || settings?.googleReviewUrl;
      const settingsReviewUrl =
        (rawSettingsUrl && !isInternalFunnelUrl(rawSettingsUrl))
          ? resolveReviewUrl(rawSettingsUrl) || rawSettingsUrl
          : null;

      const cleanQueryReviewUrl =
        (queryReviewUrl && !isInternalFunnelUrl(queryReviewUrl))
          ? resolveReviewUrl(queryReviewUrl) || queryReviewUrl
          : null;

      const profileReviewUrl =
        (profile?.review_url && !isInternalFunnelUrl(profile.review_url))
          ? resolveReviewUrl(profile.review_url) || profile.review_url
          : null;

      let liveGoogleReviewUrl: string | null = null;
      if (settingsReviewUrl && !settingsReviewUrl.includes('/maps/place')) {
        // Direct custom review URL (e.g. g.page/r/...) is top priority
        liveGoogleReviewUrl = settingsReviewUrl;
      } else if (cleanQueryReviewUrl && !cleanQueryReviewUrl.includes('/maps/place')) {
        liveGoogleReviewUrl = cleanQueryReviewUrl;
      } else if (profileReviewUrl && !profileReviewUrl.includes('/maps/place')) {
        liveGoogleReviewUrl = profileReviewUrl;
      } else {
        liveGoogleReviewUrl = settingsReviewUrl || cleanQueryReviewUrl || profileReviewUrl;
      }

      const rawPlaceCandidate =
        queryPlaceId ||
        profile?.google_place_id?.trim() ||
        settings?.place_id?.trim() ||
        inviteData?.place_id?.trim() ||
        null;

      // Cleanly extract Google place ID
      const livePlaceId = extractPlaceId(rawPlaceCandidate);

      const liveCustomReviewUrl =
        liveGoogleReviewUrl ||
        (rawPlaceCandidate && (rawPlaceCandidate.includes('http') || rawPlaceCandidate.includes('google.com')) ? rawPlaceCandidate : null);

      const liveBusinessReviewUrl = constructGoogleReviewUrl({
        placeId: livePlaceId,
        customReviewUrl: liveCustomReviewUrl,
      });

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
        (inviteData?.review_link && !isInternalFunnelUrl(inviteData.review_link))
          ? resolveReviewUrl(inviteData.review_link) || inviteData.review_link
          : (inviteData?.place_id ? constructGoogleReviewUrl({ placeId: extractPlaceId(inviteData.place_id) }) : null);

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
    const fallbackPlaceId = extractPlaceId(queryPlaceId);
    liveBusiness = {
      id: token || 'unknown',
      name: queryBusiness || 'RatingPulse',
      placeId: fallbackPlaceId,
      googleReviewUrl: constructGoogleReviewUrl({
        placeId: fallbackPlaceId,
        customReviewUrl: queryReviewUrl,
      }),
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

  // Resolve the destination URL using live business fields with getReviewUrl:
  const destinationUrl = getReviewUrl({
    ...liveBusiness,
    placeId: liveBusiness.placeId || extractPlaceId(invite?.business?.placeId) || extractPlaceId(invite?.place_id),
    googleReviewUrl:
      liveBusiness.googleReviewUrl ||
      invite?.business?.googleReviewUrl ||
      invite?.destinationUrl,
    reviewLink: invite?.review_link || (invite?.business as any)?.reviewLink,
  });

  return {
    destinationUrl,
    business: liveBusiness,
    invite,
  };
}
