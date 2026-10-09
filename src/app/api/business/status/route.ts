export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
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
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clerkAuth = await auth().catch(() => null);
    const userId = searchParams.get('userId') || searchParams.get('id') || clerkAuth?.userId;

    if (!userId || userId.startsWith('usr_mock')) {
      return NextResponse.json({
        success: false,
        isGoogleConnected: false,
        google_connected: false,
        error: 'User ID required or unauthenticated',
      }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({
        success: false,
        isGoogleConnected: false,
        google_connected: false,
        error: 'Database unconfigured',
      }, { status: 500 });
    }

    const [profRes, settRes] = await Promise.allSettled([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('business_settings').select('*').eq('user_id', userId).maybeSingle(),
    ]);

    const profile = profRes.status === 'fulfilled' ? profRes.value.data : null;
    const settings = settRes.status === 'fulfilled' ? settRes.value.data : null;

    const isGoogleConnected = Boolean(
      profile?.google_connected ||
      profile?.google_access_token ||
      settings?.google_access_token
    );

    const placeId = profile?.google_place_id || settings?.place_id || '';
    const hasValidPlaceId = Boolean(placeId && !placeId.startsWith('demo_') && placeId.trim().length > 0);
    const isPendingPlaceId = Boolean(isGoogleConnected && !hasValidPlaceId);

    const statusString = isGoogleConnected ? 'connected' : 'disconnected';
    console.log(`[Business Status] User connection status: ${statusString}`);

    return NextResponse.json({
      success: true,
      isGoogleConnected,
      google_connected: isGoogleConnected,
      isPendingPlaceId,
      businessName: profile?.business_name || settings?.business_name || (isGoogleConnected ? 'RatingPulse' : null),
      placeId: hasValidPlaceId ? placeId : '',
      formattedAddress: profile?.formatted_address || '',
      reviewUrl: profile?.review_url || (hasValidPlaceId ? `https://search.google.com/local/writereview?placeid=${placeId}` : ''),
      phone: profile?.phone || '',
      rating: Number(profile?.google_rating) || 0,
      reviewCount: Number(profile?.google_review_count) || 0,
      profile,
      settings,
    });
  } catch (err: any) {
    console.error('[Business Status GET Error]:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch business status' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const clerkAuth = await auth().catch(() => null);
    const userId = body.userId || body.user_id || clerkAuth?.userId;

    if (!userId) {
      return NextResponse.json({ success: false, isGoogleConnected: false, error: 'User ID required' }, { status: 400 });
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) {
      return NextResponse.json({ success: false, isGoogleConnected: false, error: 'Database unconfigured' }, { status: 500 });
    }

    const { data: profile } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle();
    const isGoogleConnected = Boolean(profile?.google_connected || profile?.google_access_token);
    const placeId = profile?.google_place_id || '';
    const hasValidPlaceId = Boolean(placeId && !placeId.startsWith('demo_') && placeId.trim().length > 0);
    const isPendingPlaceId = Boolean(isGoogleConnected && !hasValidPlaceId);

    const statusString = isGoogleConnected ? 'connected' : 'disconnected';
    console.log(`[Business Status] User connection status: ${statusString}`);

    return NextResponse.json({
      success: true,
      isGoogleConnected,
      google_connected: isGoogleConnected,
      isPendingPlaceId,
      businessName: profile?.business_name || (isGoogleConnected ? 'RatingPulse' : null),
      placeId: hasValidPlaceId ? placeId : '',
      formattedAddress: profile?.formatted_address || '',
      reviewUrl: profile?.review_url || '',
      profile,
    });
  } catch (err: any) {
    console.error('[Business Status POST Error]:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to check status' }, { status: 500 });
  }
}
