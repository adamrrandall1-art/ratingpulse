export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { resolveReviewUrl } from '@/lib/google-places';
import { db } from '@/lib/db';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

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
    process.env.SUPABASE_ANON_KEY ||
    '';
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function resolveBusinessStatus(userId: string) {
  // 1. Try finding business record in Prisma first
  const prismaBiz: any = await db.business.findFirst({
    where: {
      OR: [
        { userId },
        { clerkUserId: userId },
        { id: userId },
      ],
    },
  }).catch(() => null);

  const supabase = getSupabaseAdmin();
  let profile: any = null;
  let settings: any = null;

  if (supabase) {
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

    try {
      const { data: sByUserId } = await supabase.from('business_settings').select('*').eq('user_id', userId).maybeSingle();
      if (sByUserId) {
        settings = sByUserId;
      } else if (profile?.id) {
        const { data: sByProfId } = await supabase.from('business_settings').select('*').eq('user_id', profile.id).maybeSingle();
        if (sByProfId) settings = sByProfId;
      }
    } catch {}
  }

  const defaultReviewUrl = 'https://g.page/r/Cc5qbA6YaZ6-EBM/review';
  const placeId = prismaBiz?.placeId || profile?.google_place_id || settings?.place_id || '';
  const hasValidPlaceId = Boolean(placeId && !placeId.startsWith('demo_') && placeId.trim().length > 0);
  const directReviewUrl = prismaBiz?.googleReviewUrl || prismaBiz?.reviewUrl || profile?.review_url || settings?.google_review_url || (settings as any)?.review_url || defaultReviewUrl;
  const effectiveReviewUrl = resolveReviewUrl(directReviewUrl) || directReviewUrl || defaultReviewUrl;
  const hasDirectReviewUrl = Boolean(effectiveReviewUrl && effectiveReviewUrl.startsWith('http'));
  const hasPlaceId = hasValidPlaceId || hasDirectReviewUrl;

  const isGoogleConnected = true;
  const isPendingPlaceId = false;

  const outboundPhone = process.env.TWILIO_PHONE_NUMBER || process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || '+17372583478';
  const isPlaceholderPhone = (p?: string | null) => {
    if (!p) return true;
    const clean = p.replace(/\D/g, '');
    return clean.includes('555') || p.includes('123 Main') || p === '(585) 360-2026' || p === '(585) 203-1280';
  };
  const rawPhone =
    prismaBiz?.phone ||
    profile?.phone ||
    profile?.notification_phone ||
    profile?.notify_negative_phone ||
    settings?.notification_phone ||
    settings?.notify_negative_phone ||
    settings?.phone ||
    '';
  const activePhone = (!rawPhone || isPlaceholderPhone(rawPhone))
    ? outboundPhone
    : rawPhone;

  const businessName = prismaBiz?.name || profile?.business_name || settings?.business_name || 'RatingPulse';
  const formattedAddress = prismaBiz?.address || profile?.formatted_address || '';
  const rating = Number(prismaBiz?.rating || profile?.google_rating) || 5.0;
  const reviewCount = Number(prismaBiz?.reviewCount || profile?.google_review_count) || 0;

  const business = {
    id: prismaBiz?.id || profile?.id || userId,
    businessId: prismaBiz?.id || profile?.id || userId,
    name: businessName,
    category: prismaBiz?.category || profile?.business_category || 'Local Business',
    address: formattedAddress,
    phone: activePhone || outboundPhone || '',
    smsSenderNumber: activePhone || outboundPhone || '',
    emailSender: profile?.notification_email || profile?.email || settings?.notification_email || '',
    placeId: hasValidPlaceId ? placeId : '',
    reviewUrl: effectiveReviewUrl,
    googleReviewUrl: effectiveReviewUrl,
    reviewLink: effectiveReviewUrl,
    rating,
    reviewCount,
    isGoogleConnected: true,
    google_connected: true,
    isConnected: true,
    isPendingPlaceId: false,
  };

  return {
    success: true,
    isGoogleConnected,
    google_connected: isGoogleConnected,
    hasPlaceId,
    isPendingPlaceId,
    businessName,
    placeId: hasValidPlaceId ? placeId : '',
    formattedAddress,
    reviewUrl: effectiveReviewUrl,
    googleReviewUrl: effectiveReviewUrl,
    reviewLink: effectiveReviewUrl,
    phone: activePhone || outboundPhone || '',
    outboundPhone: outboundPhone,
    outboundPhoneNumber: outboundPhone,
    twilioPhoneNumber: outboundPhone,
    rating,
    reviewCount,
    business,
    profile,
    settings,
  };
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

    const data = await resolveBusinessStatus(userId);
    return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
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
    const userId = body.userId || body.user_id || body.id || clerkAuth?.userId;

    if (!userId || userId.startsWith('usr_mock')) {
      return NextResponse.json({ success: false, isGoogleConnected: false, error: 'User ID required' }, { status: 400, headers: NO_CACHE_HEADERS });
    }

    const data = await resolveBusinessStatus(userId);
    return NextResponse.json(data, { headers: NO_CACHE_HEADERS });
  } catch (err: any) {
    console.error('[Business Status POST Error]:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to check status' }, { status: 500, headers: NO_CACHE_HEADERS });
  }
}
