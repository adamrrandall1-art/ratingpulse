'use server';

import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
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

export async function saveAndAttachPlaceAction(formData: FormData) {
  const rawInput = (formData.get('placeInput') || formData.get('input') || '').toString().trim();
  const explicitUserId = (formData.get('userId') || '').toString().trim();
  const clerkAuth = await auth().catch(() => null);
  const userId = explicitUserId || clerkAuth?.userId;

  if (!rawInput) {
    return { success: false, error: 'Please enter a Google Place ID or Google Review URL.' };
  }

  const isDirectUrl = rawInput.startsWith('http://') || rawInput.startsWith('https://');

  let placeId = '';
  let googleReviewUrl = '';
  let fetchedDetails: any = null;

  if (isDirectUrl) {
    googleReviewUrl = resolveReviewUrl(rawInput) || rawInput;
    placeId = '';
  } else {
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
      console.warn('[saveAndAttachPlaceAction] Google Places API lookup warning:', err);
    }
  }

  const supabase = getSupabaseAdmin();
  if (supabase && userId) {
    let profile: any = null;
    try {
      const { data: pById } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
      if (pById) profile = pById;
    } catch {}
    if (!profile) {
      try {
        const { data: pByClerk } = await supabase.from('profiles').select('*').eq('clerk_user_id', userId).maybeSingle();
        if (pByClerk) profile = pByClerk;
      } catch {}
    }
    const profileId = profile?.id || userId;

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

    if (profile?.id) {
      await supabase.from('profiles').update(profileUpdates).eq('id', profile.id);
    } else {
      await supabase.from('profiles').update(profileUpdates).or(`id.eq.${userId},clerk_user_id.eq.${userId}`);
    }

    const settingsUpdates: Record<string, unknown> = {
      user_id: profileId,
      google_review_url: googleReviewUrl,
      google_connected: true,
      updated_at: new Date().toISOString(),
    };
    if (placeId) settingsUpdates.place_id = placeId;
    if (fetchedDetails?.name) settingsUpdates.business_name = fetchedDetails.name;

    try {
      await supabase.from('business_settings').upsert(settingsUpdates, { onConflict: 'user_id' });
    } catch (settErr) {
      console.warn('[saveAndAttachPlaceAction] update settings warning:', settErr);
    }
  }

  revalidatePath('/dashboard/setup');
  revalidatePath('/dashboard/businesses');
  revalidatePath('/dashboard', 'layout');
  revalidatePath('/dashboard');
  revalidatePath('/dashboard/settings');
  redirect('/dashboard/setup?business=RatingPulse&connected=true');
}

export async function disconnectBusinessAction(formData?: FormData) {
  const explicitUserId = formData?.get('userId')?.toString()?.trim();
  const clerkAuth = await auth().catch(() => null);
  const userId = explicitUserId || clerkAuth?.userId;

  const supabase = getSupabaseAdmin();
  if (supabase && userId) {
    await Promise.allSettled([
      supabase
        .from('profiles')
        .update({
          business_name: null,
          google_place_id: null,
          formatted_address: null,
          review_url: null,
          google_rating: null,
          google_review_count: 0,
          google_connected: false,
          google_access_token: null,
          google_refresh_token: null,
          google_token_expiry: null,
          google_account_id: null,
          google_location_id: null,
          google_account_name: null,
          updated_at: new Date().toISOString(),
        })
        .or(`id.eq.${userId},clerk_user_id.eq.${userId}`),

      supabase
        .from('business_settings')
        .update({
          place_id: null,
          business_name: null,
          google_review_url: null,
          google_access_token: null,
          google_refresh_token: null,
          connected_at: null,
          updated_at: new Date().toISOString(),
        })
        .or(`user_id.eq.${userId},id.eq.${userId}`),

      supabase
        .from('reviews')
        .delete()
        .or(`user_id.eq.${userId}`),
    ]);
  }

  revalidatePath('/dashboard', 'layout');
  revalidatePath('/dashboard/setup');
  revalidatePath('/dashboard/businesses');
  return { success: true };
}
