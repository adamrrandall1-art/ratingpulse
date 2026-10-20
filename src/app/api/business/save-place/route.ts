export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
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

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const clerkAuth = await auth().catch(() => null);
    const userId = body.userId || body.user_id || clerkAuth?.userId;

    const rawInput = (
      body.input ||
      body.placeId ||
      body.place_id ||
      body.googleReviewUrl ||
      body.reviewUrl ||
      body.reviewLink ||
      ''
    ).trim();

    if (!rawInput) {
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
      // IF it starts with http:// or https://:
      // - Save directly to the business record as googleReviewUrl (and/or reviewLink)
      // - Set isGoogleConnected = true and hasPlaceId = true (or remove pending_place_id)
      // - Do NOT execute a Google Places API lookup on this string
      googleReviewUrl = resolveReviewUrl(rawInput) || rawInput;
      placeId = '';
    } else {
      // ELSE (if it is a raw Place ID like ChIJ...):
      // - Save placeId, query Places API if needed, and set googleReviewUrl to direct URL
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
        console.warn('[save-place] Google Places API lookup warning:', err);
      }
    }

    const supabase = getSupabaseAdmin();
    if (supabase && userId) {
      const profileUpdates: Record<string, unknown> = {
        review_url: googleReviewUrl,
        google_connected: true,
        updated_at: new Date().toISOString(),
      };

      if (!isDirectUrl && placeId) {
        profileUpdates.google_place_id = placeId;
      }
      if (fetchedDetails) {
        if (fetchedDetails.name) profileUpdates.business_name = fetchedDetails.name;
        if (fetchedDetails.formatted_address) profileUpdates.formatted_address = fetchedDetails.formatted_address;
        if (fetchedDetails.rating) profileUpdates.google_rating = fetchedDetails.rating;
        if (fetchedDetails.user_ratings_total) profileUpdates.google_review_count = fetchedDetails.user_ratings_total;
      }

      await supabase.from('profiles').update(profileUpdates).eq('id', userId);

      const settingsUpdates: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (placeId) {
        settingsUpdates.place_id = placeId;
      }
      if (fetchedDetails?.name) {
        settingsUpdates.business_name = fetchedDetails.name;
      }
      try {
        await supabase.from('business_settings').update(settingsUpdates).eq('user_id', userId);
      } catch (settErr) {
        console.warn('[save-place] update business_settings warning:', settErr);
      }
    }

    try {
      revalidatePath('/dashboard', 'layout');
      revalidatePath('/dashboard/setup');
      revalidatePath('/dashboard/businesses');
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/reviews');
      revalidatePath('/dashboard/invites');
      revalidatePath('/dashboard/settings');
    } catch (revErr) {
      console.warn('[save-place] Cache revalidation note:', revErr);
    }

    return NextResponse.json({
      success: true,
      isDirectUrl,
      placeId,
      googleReviewUrl,
      reviewUrl: googleReviewUrl,
      reviewLink: googleReviewUrl,
      isGoogleConnected: true,
      hasPlaceId: true,
      isPendingPlaceId: false,
      details: fetchedDetails,
    });
  } catch (err: any) {
    console.error('[save-place error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to save place information' },
      { status: 500 }
    );
  }
}
