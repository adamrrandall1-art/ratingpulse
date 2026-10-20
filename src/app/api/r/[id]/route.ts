export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { resolveReviewUrl } from '@/lib/google-places';

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
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET(
  req: NextRequest,
  props: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const params = await Promise.resolve(props.params);
    const id = params?.id || '';

    const business: {
      id: string;
      name?: string | null;
      placeId?: string | null;
      googleReviewUrl?: string | null;
    } = {
      id: id || 'unknown',
      name: null,
      placeId: null,
      googleReviewUrl: null,
    };

    const url = new URL(req.url);
    const queryReviewUrl = url.searchParams.get('reviewUrl') || url.searchParams.get('url');
    const queryPlaceId = url.searchParams.get('placeId');

    if (queryReviewUrl && queryReviewUrl.startsWith('http')) {
      business.googleReviewUrl = queryReviewUrl;
    }
    if (queryPlaceId) {
      business.placeId = queryPlaceId;
    }

    let resolvedInvite: any = null;

    if (id === 'demo' || id === 'demo_ratingpulse_001') {
      business.name = 'RatingPulse';
      business.placeId = 'ChIJawEUC_oN04kRB70LP1wHuPg';
      business.googleReviewUrl = 'https://search.google.com/local/writereview?placeid=ChIJawEUC_oN04kRB70LP1wHuPg';
    } else if (id) {
      const supabase = getSupabaseAdmin();
      if (supabase) {
        // 1. Try finding in review_invites
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
        let inviteQuery = supabase
          .from('review_invites')
          .select('id, user_id, place_id, review_link, business_name, customer_name, customer_phone, customer_email, service_type');
        
        if (isUuid) {
          inviteQuery = inviteQuery.eq('id', id);
        } else {
          inviteQuery = inviteQuery.or(`id.eq.${id},token.eq.${id}`);
        }

        const { data: invite } = await inviteQuery.maybeSingle();

        if (invite) {
          resolvedInvite = invite;
          business.id = invite.user_id || invite.id;
          business.name = invite.business_name || null;
          business.placeId = invite.place_id || null;
          business.googleReviewUrl =
            invite.review_link && invite.review_link.startsWith('http') && !invite.review_link.includes('/r/')
              ? invite.review_link
              : null;

          if (invite.user_id) {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, google_place_id, review_url, business_name, formatted_address, email, notification_email, phone, notification_phone')
              .eq('id', invite.user_id)
              .maybeSingle();

            if (profile) {
              if (profile.review_url) business.googleReviewUrl = profile.review_url;
              if (profile.google_place_id && !business.placeId) business.placeId = profile.google_place_id;
              if (profile.business_name && !business.name) business.name = profile.business_name;
              (business as any).address = profile.formatted_address || null;
              (business as any).ownerEmail = profile.notification_email || profile.email || null;
              (business as any).ownerPhone = profile.notification_phone || profile.phone || null;
            }
          }
        } else {
          // 2. Try profiles table by id or clerk_user_id
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, google_place_id, review_url, business_name, formatted_address, email, notification_email, phone, notification_phone')
            .or(`id.eq.${id},clerk_user_id.eq.${id}`)
            .maybeSingle();

          if (profile) {
            business.id = profile.id;
            business.name = profile.business_name || null;
            business.googleReviewUrl = profile.review_url || null;
            business.placeId = profile.google_place_id || null;
            (business as any).address = profile.formatted_address || null;
            (business as any).ownerEmail = profile.notification_email || profile.email || null;
            (business as any).ownerPhone = profile.notification_phone || profile.phone || null;
          }
        }
      }
    }

    const destinationUrl = 
      resolveReviewUrl(business.googleReviewUrl) || 
      resolveReviewUrl(business.placeId);
    const targetUrl = destinationUrl;

    if (resolvedInvite) {
      resolvedInvite.business = {
        ...business,
        googleReviewUrl: destinationUrl,
        placeId: business.placeId,
      };
    }

    const wantsJson =
      req.headers.get('accept')?.includes('application/json') ||
      req.headers.get('content-type')?.includes('application/json') ||
      url.searchParams.get('format') === 'json' ||
      url.pathname.startsWith('/api/r');

    if (wantsJson) {
      return NextResponse.json({
        success: true,
        destinationUrl,
        targetUrl: destinationUrl,
        business: {
          ...business,
          googleReviewUrl: destinationUrl,
          placeId: business.placeId,
        },
        invite: resolvedInvite,
      });
    }

    if (!targetUrl) {
      console.error("Missing valid review destination for business:", business.id);
      return NextResponse.redirect(new URL('/', req.url));
    }

    return NextResponse.redirect(targetUrl);
  } catch (error) {
    console.error("Error redirecting review shortlink:", error);
    return NextResponse.json({ success: false, error: 'Failed to resolve review shortlink' }, { status: 500 });
  }
}
