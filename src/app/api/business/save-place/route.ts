export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function handleSavePlace(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const clerkAuth = await auth().catch(() => null);
    const userId = body.userId || body.user_id || body.activeBusinessId || clerkAuth?.userId;

    console.log("[SETUP_SAVE] Incoming payload:", body);
    console.log("[SETUP_SAVE] Authenticated User ID:", userId);

    const rawInput = (
      body.input ||
      body.googleReviewUrl ||
      body.reviewUrl ||
      body.reviewLink ||
      body.placeId ||
      body.place_id ||
      ''
    ).trim();

    if (!rawInput && !body.name) {
      return NextResponse.json(
        { success: false, error: 'Please enter a Google Place ID or direct Google Review URL.' },
        { status: 400 }
      );
    }

    const isDirectUrl = rawInput.startsWith('http://') || rawInput.startsWith('https://');

    let placeId = '';
    let googleReviewUrl = '';
    let fetchedDetails: any = null;

    if (isDirectUrl) {
      googleReviewUrl = resolveReviewUrl(rawInput) || rawInput;
      placeId = '';
    } else if (rawInput) {
      placeId = rawInput;
      googleReviewUrl = resolveReviewUrl(placeId) || `https://search.google.com/local/writereview?placeid=${encodeURIComponent(placeId)}`;

      const apiKey =
        process.env.GOOGLE_PLACES_API_KEY ||
        process.env.NEXT_PUBLIC_GOOGLE_PLACES_API_KEY ||
        'AIzaSyDdAZozLUaoBAoemqT38_bdE3QBNoFuOpY';

      try {
        const detailsUrl = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${encodeURIComponent(
          placeId
        )}&fields=place_id,name,formatted_address,rating,user_ratings_total,url&key=${apiKey}`;
        const res = await fetch(detailsUrl);
        const data = await res.json();
        if (data.status === 'OK' && data.result) {
          fetchedDetails = data.result;
        }
      } catch (err) {
        console.warn('[SETUP_SAVE] Google Places API lookup warning:', err);
      }
    }

    const supabase = getSupabaseAdmin();
    let profileId = userId;
    let businessRecord: any = null;

    if (supabase && userId) {
      let profile: any = null;
      if (UUID_REGEX.test(userId)) {
        try {
          const { data: pById } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
          if (pById) profile = pById;
        } catch {}
      }
      if (!profile) {
        try {
          const { data: pByClerk } = await supabase.from('profiles').select('*').eq('clerk_user_id', userId).maybeSingle();
          if (pByClerk) profile = pByClerk;
        } catch {}
      }

      profileId = profile?.id || (UUID_REGEX.test(userId) ? userId : crypto.randomUUID());

      const businessName = body.name || body.business_name || fetchedDetails?.name || profile?.business_name || 'RatingPulse';

      const profileUpdates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
        isGoogleConnected: true,
        google_connected: true,
      };

      if (googleReviewUrl) {
        profileUpdates.review_url = googleReviewUrl;
        profileUpdates.googleReviewUrl = googleReviewUrl;
      }
      if (!isDirectUrl && placeId) {
        profileUpdates.google_place_id = placeId;
      }
      if (businessName) {
        profileUpdates.business_name = businessName;
      }
      if (fetchedDetails) {
        if (fetchedDetails.formatted_address) profileUpdates.formatted_address = fetchedDetails.formatted_address;
        if (fetchedDetails.rating) profileUpdates.google_rating = fetchedDetails.rating;
        if (fetchedDetails.user_ratings_total) profileUpdates.google_review_count = fetchedDetails.user_ratings_total;
      }

      if (profile?.id) {
        await supabase.from('profiles').update(profileUpdates).eq('id', profile.id);
      } else {
        await supabase.from('profiles').upsert({
          id: profileId,
          clerk_user_id: userId,
          ...profileUpdates,
        }, { onConflict: 'id' });
      }

      const settingsUpdates: Record<string, unknown> = {
        user_id: profileId,
        updated_at: new Date().toISOString(),
        google_connected: true,
        isGoogleConnected: true,
      };
      if (googleReviewUrl) {
        settingsUpdates.google_review_url = googleReviewUrl;
      }
      if (placeId) {
        settingsUpdates.place_id = placeId;
      }
      if (businessName) {
        settingsUpdates.business_name = businessName;
      }

      try {
        await supabase.from('business_settings').upsert(settingsUpdates, { onConflict: 'user_id' });
      } catch (settErr) {
        console.warn('[SETUP_SAVE] upsert business_settings warning:', settErr);
      }

      businessRecord = {
        id: profileId,
        userId: profileId,
        name: businessName,
        googleReviewUrl,
        reviewUrl: googleReviewUrl,
        reviewLink: googleReviewUrl,
        placeId: placeId || profile?.google_place_id || '',
        isGoogleConnected: true,
        isConnected: true,
        placeIdStatus: 'OVERRIDDEN',
        phone: profile?.phone || profile?.notification_phone || '',
        updatedAt: new Date().toISOString(),
      };

      console.log("[SETUP_SAVE] Successfully persisted business record:", businessRecord);
    }

    try {
      revalidatePath('/dashboard/setup');
      revalidatePath('/dashboard/businesses');
      revalidatePath('/dashboard', 'layout');
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/reviews');
      revalidatePath('/dashboard/invites');
      revalidatePath('/dashboard/settings');
    } catch (revErr) {
      console.warn('[SETUP_SAVE] Cache revalidation note:', revErr);
    }

    return NextResponse.json({
      success: true,
      isDirectUrl,
      placeId,
      googleReviewUrl,
      reviewUrl: googleReviewUrl,
      reviewLink: googleReviewUrl,
      isGoogleConnected: true,
      isConnected: true,
      hasPlaceId: true,
      isPendingPlaceId: false,
      business: businessRecord,
      details: fetchedDetails,
    });
  } catch (err: any) {
    console.error('[SETUP_SAVE error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to save place information' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return handleSavePlace(req);
}

export async function PUT(req: NextRequest) {
  return handleSavePlace(req);
}
