export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { resolveReviewUrl } from '@/lib/google-places';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

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
    const { searchParams } = new URL(req.url);
    const clerkAuth = await auth().catch(() => null);
    const userId = searchParams.get('userId') || searchParams.get('id') || searchParams.get('user_id') || clerkAuth?.userId;

    if (!userId || userId.startsWith('usr_mock')) {
      return NextResponse.json({
        success: false,
        isGoogleConnected: false,
        google_connected: false,
        error: 'User ID required or unauthenticated',
      }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({
        success: false,
        isGoogleConnected: false,
        google_connected: false,
        error: 'Database unconfigured',
      }, { status: 500, headers: NO_CACHE_HEADERS });
    }

    // Try finding profile by id or clerk_user_id
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

    // Try finding settings by user_id
    let settings: any = null;
    try {
      const { data: sByUserId } = await supabase.from('business_settings').select('*').eq('user_id', userId).maybeSingle();
      if (sByUserId) {
        settings = sByUserId;
      } else if (profile?.id) {
        const { data: sByProfId } = await supabase.from('business_settings').select('*').eq('user_id', profile.id).maybeSingle();
        if (sByProfId) settings = sByProfId;
      }
    } catch {}

    const placeId = profile?.google_place_id || settings?.place_id || '';
    const hasValidPlaceId = Boolean(placeId && !placeId.startsWith('demo_') && placeId.trim().length > 0);
    const directReviewUrl = profile?.review_url || (settings as any)?.review_url || '';
    const hasDirectReviewUrl = Boolean(directReviewUrl && directReviewUrl.startsWith('http'));
    const hasPlaceId = hasValidPlaceId || hasDirectReviewUrl;

    const isGoogleConnected = Boolean(
      profile?.google_connected ||
      profile?.google_access_token ||
      settings?.google_access_token ||
      hasDirectReviewUrl
    );

    const isPendingPlaceId = Boolean(isGoogleConnected && !hasPlaceId);
    const effectiveReviewUrl = resolveReviewUrl(directReviewUrl) || (hasValidPlaceId ? resolveReviewUrl(placeId) : '') || '';

    const outboundPhone = process.env.TWILIO_PHONE_NUMBER || process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || '+17372583478';
    const isPlaceholderPhone = (p?: string | null) => {
      if (!p) return true;
      const clean = p.replace(/\D/g, '');
      return clean.includes('555') || p.includes('123 Main') || p === '(585) 360-2026' || p === '(585) 203-1280';
    };
    const rawPhone = profile?.phone || settings?.phone || '';
    const activePhone = (!rawPhone || isPlaceholderPhone(rawPhone))
      ? outboundPhone
      : rawPhone;

    const statusString = isGoogleConnected ? 'connected' : 'disconnected';
    console.log(`[Business Status] User connection status: ${statusString}`);

    return NextResponse.json({
      success: true,
      isGoogleConnected,
      google_connected: isGoogleConnected,
      hasPlaceId,
      isPendingPlaceId,
      businessName: profile?.business_name || settings?.business_name || (isGoogleConnected ? 'RatingPulse' : null),
      placeId: hasValidPlaceId ? placeId : '',
      formattedAddress: profile?.formatted_address || '',
      reviewUrl: effectiveReviewUrl,
      googleReviewUrl: effectiveReviewUrl,
      reviewLink: effectiveReviewUrl,
      phone: activePhone || outboundPhone || '',
      outboundPhone: outboundPhone,
      outboundPhoneNumber: outboundPhone,
      twilioPhoneNumber: outboundPhone,
      rating: Number(profile?.google_rating) || 0,
      reviewCount: Number(profile?.google_review_count) || 0,
      profile,
      settings,
    }, { headers: NO_CACHE_HEADERS });
  } catch (err: any) {
    console.error('[Business Status GET Error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch business status' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const clerkAuth = await auth().catch(() => null);
    const userId = body.userId || body.user_id || clerkAuth?.userId;

    if (!userId) {
      return NextResponse.json({ success: false, isGoogleConnected: false, error: 'User ID required' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ success: false, isGoogleConnected: false, error: 'Database unconfigured' }, { status: 500, headers: NO_CACHE_HEADERS });
    }

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

    const directReviewUrl = profile?.review_url || '';
    const hasDirectReviewUrl = Boolean(directReviewUrl && directReviewUrl.startsWith('http'));
    const isGoogleConnected = Boolean(profile?.google_connected || profile?.google_access_token || hasDirectReviewUrl);
    const placeId = profile?.google_place_id || '';
    const hasValidPlaceId = Boolean(placeId && !placeId.startsWith('demo_') && placeId.trim().length > 0);
    const hasPlaceId = hasValidPlaceId || hasDirectReviewUrl;
    const isPendingPlaceId = Boolean(isGoogleConnected && !hasPlaceId);
    const effectiveReviewUrl = resolveReviewUrl(directReviewUrl) || (hasValidPlaceId ? resolveReviewUrl(placeId) : '') || '';

    const outboundPhone = process.env.TWILIO_PHONE_NUMBER || process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || '+17372583478';
    const isPlaceholderPhone = (p?: string | null) => {
      if (!p) return true;
      const clean = p.replace(/\D/g, '');
      return clean.includes('555') || p.includes('123 Main') || p === '(585) 360-2026' || p === '(585) 203-1280';
    };
    const rawPhone = profile?.phone || '';
    const activePhone = (!rawPhone || isPlaceholderPhone(rawPhone))
      ? outboundPhone
      : rawPhone;

    const statusString = isGoogleConnected ? 'connected' : 'disconnected';
    console.log(`[Business Status] User connection status: ${statusString}`);

    return NextResponse.json({
      success: true,
      isGoogleConnected,
      google_connected: isGoogleConnected,
      hasPlaceId,
      isPendingPlaceId,
      businessName: profile?.business_name || (isGoogleConnected ? 'RatingPulse' : null),
      placeId: hasValidPlaceId ? placeId : '',
      formattedAddress: profile?.formatted_address || '',
      reviewUrl: effectiveReviewUrl,
      googleReviewUrl: effectiveReviewUrl,
      reviewLink: effectiveReviewUrl,
      phone: activePhone || outboundPhone || '',
      outboundPhone: outboundPhone,
      outboundPhoneNumber: outboundPhone,
      twilioPhoneNumber: outboundPhone,
      profile,
    }, { headers: NO_CACHE_HEADERS });
  } catch (err: any) {
    console.error('[Business Status POST Error]:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to check status' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
