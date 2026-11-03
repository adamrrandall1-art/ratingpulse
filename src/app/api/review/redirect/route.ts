export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';
import { getReviewUrl, extractPlaceId } from '@/lib/google';

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

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id') || url.searchParams.get('businessId') || '';
    const queryReviewUrl = url.searchParams.get('reviewUrl') || url.searchParams.get('googleReviewUrl') || url.searchParams.get('reviewLink');
    const queryPlaceId = url.searchParams.get('placeId') || url.searchParams.get('google_place_id');
    const queryBusiness = url.searchParams.get('business') || url.searchParams.get('name');
    const queryAddress = url.searchParams.get('address');

    const business: {
      id?: string;
      name?: string | null;
      placeId?: string | null;
      googleReviewUrl?: string | null;
      reviewLink?: string | null;
      address?: string | null;
    } = {
      id: id || undefined,
      name: queryBusiness || null,
      placeId: queryPlaceId ? extractPlaceId(queryPlaceId) || queryPlaceId : null,
      googleReviewUrl: queryReviewUrl || null,
      reviewLink: queryReviewUrl || null,
      address: queryAddress || null,
    };

    if (id) {
      // 0. Check business_settings first (canonical store for google_review_url and place_id)
      try {
        const settings = await (db.businessSettings as any)?.findFirst({
          where: {
            OR: [{ id }, { userId: id }],
          },
        });
        if (settings) {
          if (settings.businessName && !business.name) business.name = settings.businessName;
          if (settings.placeId && !business.placeId) business.placeId = settings.placeId;
          if (settings.googleReviewUrl) {
            business.googleReviewUrl = settings.googleReviewUrl;
            business.reviewLink = settings.googleReviewUrl;
          }
        }
      } catch (settErr) {
        console.warn('[review/redirect] businessSettings db lookup warning:', settErr);
      }

      if (!business.googleReviewUrl || business.googleReviewUrl.includes('/maps/place')) {
        const supabase = getSupabaseAdmin();
        if (supabase) {
          const { data: bSettings } = await supabase
            .from('business_settings')
            .select('business_name, place_id, google_review_url')
            .or(`id.eq.${id},user_id.eq.${id}`)
            .maybeSingle();
          if (bSettings) {
            if (bSettings.business_name && !business.name) business.name = bSettings.business_name;
            if (bSettings.place_id && !business.placeId) business.placeId = bSettings.place_id;
            if (bSettings.google_review_url) {
              business.googleReviewUrl = bSettings.google_review_url;
              business.reviewLink = bSettings.google_review_url;
            }
          }
        }
      }

      if (!business.googleReviewUrl || !business.placeId) {
        try {
          const dbBiz = await db.business.findFirst({
            where: {
              OR: [{ id }, { userId: id }, { clerkUserId: id }],
            },
          });
          if (dbBiz) {
            if (dbBiz.name && !business.name) business.name = dbBiz.name;
            if (dbBiz.placeId && !business.placeId) business.placeId = dbBiz.placeId;
            if ((dbBiz.googleReviewUrl || dbBiz.reviewUrl) && !business.googleReviewUrl) {
              business.googleReviewUrl = dbBiz.googleReviewUrl || dbBiz.reviewUrl;
            }
            if (dbBiz.address && !business.address) business.address = dbBiz.address;
          }
        } catch (err) {
          console.warn('[review/redirect] db lookup warning:', err);
        }
      }

      if (!business.googleReviewUrl || !business.placeId) {
        const supabase = getSupabaseAdmin();
        if (supabase) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('id, business_name, google_place_id, review_url, formatted_address')
            .or(`id.eq.${id},clerk_user_id.eq.${id}`)
            .maybeSingle();
          if (profile) {
            if (profile.business_name && !business.name) business.name = profile.business_name;
            if (profile.google_place_id && !business.placeId) business.placeId = profile.google_place_id;
            if (profile.review_url && !business.googleReviewUrl) business.googleReviewUrl = profile.review_url;
            if (profile.formatted_address && !business.address) business.address = profile.formatted_address;
          }
        }
      }
    }

    const targetUrl = getReviewUrl(business);

    const wantsJson =
      req.headers.get('accept')?.includes('application/json') ||
      url.searchParams.get('format') === 'json';

    if (wantsJson) {
      return NextResponse.json({ success: true, targetUrl, business });
    }

    return NextResponse.redirect(targetUrl, 307);
  } catch (error) {
    console.error('[review/redirect] error:', error);
    return NextResponse.redirect(new URL('/', req.url));
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const targetUrl = getReviewUrl(body);
    return NextResponse.json({ success: true, targetUrl });
  } catch (error) {
    console.error('[review/redirect POST] error:', error);
    return NextResponse.json({ success: false, error: 'Redirect resolution failed' }, { status: 500 });
  }
}
