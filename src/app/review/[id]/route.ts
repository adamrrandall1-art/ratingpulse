export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { db } from '@/lib/db';
import {
  resolveReviewUrl,
  extractPlaceId,
  constructGoogleReviewUrl,
  getReviewUrl,
} from '@/lib/google';

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
    const queryBusiness = url.searchParams.get('business') || url.searchParams.get('name');

    if (queryReviewUrl) {
      business.googleReviewUrl = resolveReviewUrl(queryReviewUrl);
    }
    if (queryPlaceId) {
      business.placeId = extractPlaceId(queryPlaceId) || queryPlaceId;
    }
    if (queryBusiness) {
      business.name = queryBusiness;
    }

    if (id === 'demo' || id === 'demo_ratingpulse_001') {
      business.name = business.name || 'RatingPulse';
      business.placeId = business.placeId || 'ChIJawEUC_oN04kRB70LP1wHuPg';
      business.googleReviewUrl = business.googleReviewUrl || 'https://www.google.com/maps/place/?q=place_id:ChIJawEUC_oN04kRB70LP1wHuPg';
    } else if (id) {
      // 1. Try finding in DB business table first
      try {
        const dbBiz = await db.business.findFirst({
          where: {
            OR: [{ id }, { userId: id }, { clerkUserId: id }],
          },
        });
        if (dbBiz) {
          business.id = dbBiz.id;
          if (dbBiz.name && !business.name) business.name = dbBiz.name;
          if (dbBiz.placeId && !business.placeId) business.placeId = dbBiz.placeId;
          if ((dbBiz.googleReviewUrl || dbBiz.reviewUrl) && !business.googleReviewUrl) {
            business.googleReviewUrl = dbBiz.googleReviewUrl || dbBiz.reviewUrl;
          }
        }
      } catch (dbErr) {
        console.warn('[review/id] db.business lookup warning:', dbErr);
      }

      // 2. Try Supabase lookup if details still missing
      if (!business.googleReviewUrl || !business.placeId || !business.name) {
        const supabase = getSupabaseAdmin();
        if (supabase) {
          // 2a. Try finding in review_invites
          const { data: invite } = await supabase
            .from('review_invites')
            .select('id, user_id, place_id, review_link, business_name')
            .eq('id', id)
            .maybeSingle();

          if (invite) {
            business.id = invite.user_id || invite.id;
            if (invite.business_name && !business.name) business.name = invite.business_name;
            if (invite.place_id && !business.placeId) business.placeId = invite.place_id;
            if (invite.review_link && invite.review_link.startsWith('http') && !invite.review_link.includes('/r/') && !business.googleReviewUrl) {
              business.googleReviewUrl = invite.review_link;
            }

            if (invite.user_id) {
              const { data: profile } = await supabase
                .from('profiles')
                .select('id, google_place_id, review_url, business_name')
                .eq('id', invite.user_id)
                .maybeSingle();

              if (profile) {
                if (profile.review_url && !business.googleReviewUrl) business.googleReviewUrl = profile.review_url;
                if (profile.google_place_id && !business.placeId) business.placeId = profile.google_place_id;
                if (profile.business_name && !business.name) business.name = profile.business_name;
              }
            }
          } else {
            // 2b. Try profiles table by id or clerk_user_id
            const { data: profile } = await supabase
              .from('profiles')
              .select('id, google_place_id, review_url, business_name')
              .or(`id.eq.${id},clerk_user_id.eq.${id}`)
              .maybeSingle();

            if (profile) {
              business.id = profile.id;
              if (profile.business_name && !business.name) business.name = profile.business_name;
              if (profile.review_url && !business.googleReviewUrl) business.googleReviewUrl = profile.review_url;
              if (profile.google_place_id && !business.placeId) business.placeId = profile.google_place_id;
            }
          }
        }
      }
    }

    // Ensure canonical placeId and reviewUrl formats using getReviewUrl
    const cleanPlaceId = extractPlaceId(business.placeId);
    if (cleanPlaceId) {
      business.placeId = cleanPlaceId;
    }
    business.googleReviewUrl = getReviewUrl(business);

    // Route visitor to the RatingPulse 5-star review funnel page
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ratingpulse.co';
    const redirectUrl = new URL(`/r/${id}`, appUrl);

    // Forward incoming query parameters
    req.nextUrl.searchParams.forEach((val, key) => {
      redirectUrl.searchParams.set(key, val);
    });

    if (business.googleReviewUrl && !redirectUrl.searchParams.has('reviewUrl')) {
      redirectUrl.searchParams.set('reviewUrl', business.googleReviewUrl);
    }
    if (business.placeId && !redirectUrl.searchParams.has('placeId')) {
      redirectUrl.searchParams.set('placeId', business.placeId);
    }
    if (business.name && !redirectUrl.searchParams.has('business')) {
      redirectUrl.searchParams.set('business', business.name);
    }

    return NextResponse.redirect(redirectUrl);
  } catch (error) {
    console.error("Error routing review request:", error);
    return NextResponse.redirect(new URL('/', req.url));
  }
}
