import { auth } from '@clerk/nextjs/server';
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

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function getInitialServerBusiness(explicitUserId?: string | null) {
  try {
    const clerkAuth = await auth().catch(() => null);
    const userId = explicitUserId || clerkAuth?.userId;

    if (!userId || userId.startsWith('usr_mock')) {
      return null;
    }

    const supabase = getSupabaseAdmin();
    if (!supabase) return null;

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
    const directReviewUrl = profile?.review_url || settings?.google_review_url || (settings as any)?.review_url || '';
    const effectiveReviewUrl = resolveReviewUrl(directReviewUrl) || (hasValidPlaceId ? resolveReviewUrl(placeId) : '') || '';
    const hasDirectReviewUrl = Boolean(effectiveReviewUrl && effectiveReviewUrl.startsWith('http'));

    const isGoogleConnected = Boolean(
      profile?.google_connected ||
      profile?.google_access_token ||
      settings?.google_access_token ||
      settings?.google_connected ||
      hasDirectReviewUrl
    );

    const outboundPhone = process.env.TWILIO_PHONE_NUMBER || process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || '+17372583478';
    const isPlaceholderPhone = (p?: string | null) => {
      if (!p) return true;
      const clean = p.replace(/\D/g, '');
      return clean.includes('555') || p.includes('123 Main') || p === '(585) 360-2026' || p === '(585) 203-1280';
    };
    const rawPhone =
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

    const business = {
      id: profile?.id || userId,
      userId: profile?.id || userId,
      name: profile?.business_name || settings?.business_name || (isGoogleConnected ? 'RatingPulse' : 'RatingPulse'),
      category: profile?.business_category || 'Local Business',
      address: profile?.formatted_address || '',
      phone: activePhone || outboundPhone || '',
      smsSenderNumber: activePhone || outboundPhone || '',
      emailSender: profile?.notification_email || profile?.email || settings?.notification_email || '',
      placeId: hasValidPlaceId ? placeId : '',
      reviewUrl: effectiveReviewUrl,
      googleReviewUrl: effectiveReviewUrl,
      reviewLink: effectiveReviewUrl,
      rating: Number(profile?.google_rating) || 0,
      reviewCount: Number(profile?.google_review_count) || 0,
      isGoogleConnected,
      google_connected: isGoogleConnected,
      isConnected: isGoogleConnected,
      isPendingPlaceId: Boolean(isGoogleConnected && !hasValidPlaceId && !hasDirectReviewUrl),
      placeIdStatus: effectiveReviewUrl ? 'OVERRIDDEN' : (hasValidPlaceId ? 'CONNECTED' : 'DISCONNECTED'),
      updatedAt: profile?.updated_at || settings?.updated_at || new Date().toISOString(),
    };

    console.log("[DASHBOARD_LOAD] Loaded business for user:", business);
    return business;
  } catch (err) {
    console.error('[DASHBOARD_LOAD] Error loading business for user:', err);
    return null;
  }
}
