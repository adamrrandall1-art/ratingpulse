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

    // Check businesses table directly if it exists across candidate IDs (Clerk ID, Profile ID, etc.)
    let businessRecord: any = null;
    const candidateUserIds = Array.from(
      new Set(
        [
          userId,
          clerkAuth?.userId,
          profile?.clerk_user_id,
          profile?.id,
        ].filter((id): id is string => Boolean(id && typeof id === 'string'))
      )
    );

    for (const candId of candidateUserIds) {
      if (businessRecord) break;
      try {
        if (UUID_REGEX.test(candId)) {
          const { data: bById } = await supabase.from('businesses').select('*').eq('id', candId).maybeSingle();
          if (bById) {
            businessRecord = bById;
            break;
          }
        }
        const { data: bByUserId } = await supabase.from('businesses').select('*').eq('userId', candId).maybeSingle();
        if (bByUserId) {
          businessRecord = bByUserId;
          break;
        }
        const { data: bByUser_id } = await supabase.from('businesses').select('*').eq('user_id', candId).maybeSingle();
        if (bByUser_id) {
          businessRecord = bByUser_id;
          break;
        }
      } catch {}
    }

    const placeId = businessRecord?.placeId || businessRecord?.place_id || profile?.google_place_id || settings?.place_id || '';
    const hasValidPlaceId = Boolean(placeId && !placeId.startsWith('demo_') && placeId.trim().length > 0);
    const directReviewUrl =
      businessRecord?.googleReviewUrl ||
      businessRecord?.google_review_url ||
      businessRecord?.reviewUrl ||
      businessRecord?.review_url ||
      profile?.review_url ||
      settings?.google_review_url ||
      (settings as any)?.review_url ||
      '';
    const effectiveReviewUrl = resolveReviewUrl(directReviewUrl) || (hasValidPlaceId ? resolveReviewUrl(placeId) : '') || '';
    const hasDirectReviewUrl = Boolean(effectiveReviewUrl && effectiveReviewUrl.startsWith('http'));

    const isGoogleConnected = Boolean(
      businessRecord?.isGoogleConnected ||
      businessRecord?.is_google_connected ||
      businessRecord?.google_connected ||
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
      businessRecord?.phone ||
      profile?.phone ||
      profile?.notification_phone ||
      settings?.notification_phone ||
      settings?.phone ||
      '';
    const activePhone = (!rawPhone || isPlaceholderPhone(rawPhone))
      ? outboundPhone
      : rawPhone;

    const negativeAlertPhone =
      (typeof businessRecord?.negativeAlertPhone === 'string' && businessRecord.negativeAlertPhone) ||
      (typeof businessRecord?.negative_alert_phone === 'string' && businessRecord.negative_alert_phone) ||
      (typeof settings?.negative_alert_phone === 'string' && settings.negative_alert_phone) ||
      (typeof settings?.notify_negative_phone === 'string' && settings.notify_negative_phone) ||
      (typeof profile?.negative_alert_phone === 'string' && profile.negative_alert_phone) ||
      (typeof profile?.notify_negative_phone === 'string' && profile.notify_negative_phone) ||
      '';

    const negativeAlertEmail =
      (typeof businessRecord?.negativeAlertEmail === 'string' && businessRecord.negativeAlertEmail) ||
      (typeof businessRecord?.negative_alert_email === 'string' && businessRecord.negative_alert_email) ||
      (typeof settings?.negative_alert_email === 'string' && settings.negative_alert_email) ||
      (typeof profile?.negative_alert_email === 'string' && profile.negative_alert_email) ||
      (typeof settings?.notification_email === 'string' && settings.notification_email) ||
      (typeof profile?.notification_email === 'string' && profile.notification_email) ||
      '';

    const positiveAlertPhone =
      (typeof businessRecord?.positiveAlertPhone === 'string' && businessRecord.positiveAlertPhone) ||
      (typeof businessRecord?.positive_alert_phone === 'string' && businessRecord.positive_alert_phone) ||
      (typeof settings?.positive_alert_phone === 'string' && settings.positive_alert_phone) ||
      (typeof settings?.notify_positive_phone === 'string' && settings.notify_positive_phone) ||
      (typeof profile?.positive_alert_phone === 'string' && profile.positive_alert_phone) ||
      (typeof profile?.notify_positive_phone === 'string' && profile.notify_positive_phone) ||
      '';

    const positiveAlertEmail =
      (typeof businessRecord?.positiveAlertEmail === 'string' && businessRecord.positiveAlertEmail) ||
      (typeof businessRecord?.positive_alert_email === 'string' && businessRecord.positive_alert_email) ||
      (typeof settings?.positive_alert_email === 'string' && settings.positive_alert_email) ||
      (typeof profile?.positive_alert_email === 'string' && profile.positive_alert_email) ||
      '';

    const negativeAlertsEnabled =
      businessRecord?.negativeAlertsEnabled ??
      businessRecord?.negative_alerts_enabled ??
      settings?.negative_alerts_enabled ??
      settings?.notify_negative_enabled ??
      profile?.negative_alerts_enabled ??
      profile?.notify_negative_enabled ??
      true;

    const negativeEmailAlertEnabled =
      businessRecord?.negativeEmailAlertEnabled ??
      businessRecord?.negative_email_alert_enabled ??
      settings?.negative_email_alert_enabled ??
      settings?.notify_negative_email ??
      profile?.negative_email_alert_enabled ??
      profile?.notify_negative_email ??
      true;

    const negativeSmsAlertEnabled =
      businessRecord?.negativeSmsAlertEnabled ??
      businessRecord?.negative_sms_alert_enabled ??
      settings?.negative_sms_alert_enabled ??
      settings?.notify_negative_sms ??
      profile?.negative_sms_alert_enabled ??
      profile?.notify_negative_sms ??
      false;

    const positiveAlertsEnabled =
      businessRecord?.positiveAlertsEnabled ??
      businessRecord?.positive_alerts_enabled ??
      settings?.positive_alerts_enabled ??
      settings?.notify_positive_enabled ??
      profile?.positive_alerts_enabled ??
      profile?.notify_positive_enabled ??
      true;

    const positiveEmailAlertEnabled =
      businessRecord?.positiveEmailAlertEnabled ??
      businessRecord?.positive_email_alert_enabled ??
      settings?.positive_email_alert_enabled ??
      settings?.notify_positive_email ??
      profile?.positive_email_alert_enabled ??
      profile?.notify_positive_email ??
      true;

    const positiveSmsAlertEnabled =
      settings?.positive_sms_alert_enabled ??
      settings?.notify_positive_sms ??
      profile?.positive_sms_alert_enabled ??
      profile?.notify_positive_sms ??
      false;

    const business = {
      id: businessRecord?.id || profile?.id || userId,
      userId: businessRecord?.userId || businessRecord?.user_id || profile?.clerk_user_id || profile?.id || userId,
      actualBusinessId: businessRecord?.id,
      name: businessRecord?.name || profile?.business_name || settings?.business_name || (isGoogleConnected ? 'RatingPulse' : 'RatingPulse'),
      category: businessRecord?.category || profile?.business_category || 'Local Business',
      address: businessRecord?.address || profile?.formatted_address || '',
      phone: businessRecord?.phone || activePhone || outboundPhone || '',
      smsSenderNumber: activePhone || outboundPhone || '',
      emailSender: profile?.notification_email || profile?.email || settings?.notification_email || '',
      email: profile?.email || '',
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
      // Notification Routing Metadata
      negativeAlertPhone,
      negativeAlertEmail,
      negativeAlertsEnabled,
      negativeEmailAlertEnabled,
      negativeSmsAlertEnabled,
      positiveAlertPhone,
      positiveAlertEmail,
      positiveAlertsEnabled,
      positiveEmailAlertEnabled,
      positiveSmsAlertEnabled,
      notify_negative_phone: negativeAlertPhone,
      notify_negative_email: negativeEmailAlertEnabled,
      notify_negative_sms: negativeSmsAlertEnabled,
      notify_negative_enabled: negativeAlertsEnabled,
      notify_positive_phone: positiveAlertPhone,
      notify_positive_email: positiveEmailAlertEnabled,
      notify_positive_sms: positiveSmsAlertEnabled,
      notify_positive_enabled: positiveAlertsEnabled,
      notification_phone: negativeAlertPhone,
      notification_email: negativeAlertEmail,
      updatedAt: profile?.updated_at || settings?.updated_at || new Date().toISOString(),
    };

    console.log('[DASHBOARD_LOAD] Loaded business for user:', business);
    return business;
  } catch (err) {
    console.error('[DASHBOARD_LOAD] Error loading business for user:', err);
    return null;
  }
}

export async function getInitialServerSettings(explicitUserId?: string | null) {
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

    // Check businesses table directly
    let businessRecord: any = null;
    const lookupId = profile?.id || userId;
    try {
      if (UUID_REGEX.test(lookupId)) {
        const { data: bById } = await supabase.from('businesses').select('*').eq('id', lookupId).maybeSingle();
        if (bById) businessRecord = bById;
      }
      if (!businessRecord) {
        const { data: bByUserId } = await supabase.from('businesses').select('*').eq('userId', lookupId).maybeSingle();
        if (bByUserId) businessRecord = bByUserId;
      }
      if (!businessRecord) {
        const { data: bByUser_id } = await supabase.from('businesses').select('*').eq('user_id', lookupId).maybeSingle();
        if (bByUser_id) businessRecord = bByUser_id;
      }
    } catch {}

    const negativeAlertPhone =
      (typeof businessRecord?.negativeAlertPhone === 'string' && businessRecord.negativeAlertPhone) ||
      (typeof businessRecord?.negative_alert_phone === 'string' && businessRecord.negative_alert_phone) ||
      (typeof settings?.negative_alert_phone === 'string' && settings.negative_alert_phone) ||
      (typeof settings?.notify_negative_phone === 'string' && settings.notify_negative_phone) ||
      (typeof profile?.negative_alert_phone === 'string' && profile.negative_alert_phone) ||
      (typeof profile?.notify_negative_phone === 'string' && profile.notify_negative_phone) ||
      '';

    const negativeAlertEmail =
      (typeof businessRecord?.negativeAlertEmail === 'string' && businessRecord.negativeAlertEmail) ||
      (typeof businessRecord?.negative_alert_email === 'string' && businessRecord.negative_alert_email) ||
      (typeof settings?.negative_alert_email === 'string' && settings.negative_alert_email) ||
      (typeof profile?.negative_alert_email === 'string' && profile.negative_alert_email) ||
      (typeof settings?.notification_email === 'string' && settings.notification_email) ||
      (typeof profile?.notification_email === 'string' && profile.notification_email) ||
      '';

    const positiveAlertPhone =
      (typeof businessRecord?.positiveAlertPhone === 'string' && businessRecord.positiveAlertPhone) ||
      (typeof businessRecord?.positive_alert_phone === 'string' && businessRecord.positive_alert_phone) ||
      (typeof settings?.positive_alert_phone === 'string' && settings.positive_alert_phone) ||
      (typeof settings?.notify_positive_phone === 'string' && settings.notify_positive_phone) ||
      (typeof profile?.positive_alert_phone === 'string' && profile.positive_alert_phone) ||
      (typeof profile?.notify_positive_phone === 'string' && profile.notify_positive_phone) ||
      '';

    const positiveAlertEmail =
      (typeof businessRecord?.positiveAlertEmail === 'string' && businessRecord.positiveAlertEmail) ||
      (typeof businessRecord?.positive_alert_email === 'string' && businessRecord.positive_alert_email) ||
      (typeof settings?.positive_alert_email === 'string' && settings.positive_alert_email) ||
      (typeof profile?.positive_alert_email === 'string' && profile.positive_alert_email) ||
      '';

    const negativeAlertsEnabled =
      businessRecord?.negativeAlertsEnabled ??
      businessRecord?.negative_alerts_enabled ??
      settings?.negative_alerts_enabled ??
      settings?.notify_negative_enabled ??
      profile?.negative_alerts_enabled ??
      profile?.notify_negative_enabled ??
      true;

    const negativeEmailAlertEnabled =
      businessRecord?.negativeEmailAlertEnabled ??
      businessRecord?.negative_email_alert_enabled ??
      settings?.negative_email_alert_enabled ??
      settings?.notify_negative_email ??
      profile?.negative_email_alert_enabled ??
      profile?.notify_negative_email ??
      true;

    const negativeSmsAlertEnabled =
      businessRecord?.negativeSmsAlertEnabled ??
      businessRecord?.negative_sms_alert_enabled ??
      settings?.negative_sms_alert_enabled ??
      settings?.notify_negative_sms ??
      profile?.negative_sms_alert_enabled ??
      profile?.notify_negative_sms ??
      false;

    const positiveAlertsEnabled =
      businessRecord?.positiveAlertsEnabled ??
      businessRecord?.positive_alerts_enabled ??
      settings?.positive_alerts_enabled ??
      settings?.notify_positive_enabled ??
      profile?.positive_alerts_enabled ??
      profile?.notify_positive_enabled ??
      true;

    const positiveEmailAlertEnabled =
      businessRecord?.positiveEmailAlertEnabled ??
      businessRecord?.positive_email_alert_enabled ??
      settings?.positive_email_alert_enabled ??
      settings?.notify_positive_email ??
      profile?.positive_email_alert_enabled ??
      profile?.notify_positive_email ??
      true;

    const positiveSmsAlertEnabled =
      businessRecord?.positiveSmsAlertEnabled ??
      businessRecord?.positive_sms_alert_enabled ??
      settings?.positive_sms_alert_enabled ??
      settings?.notify_positive_sms ??
      profile?.positive_sms_alert_enabled ??
      profile?.notify_positive_sms ??
      false;

    const notificationSettings = {
      negativeAlertPhone,
      negativeAlertEmail,
      negativeAlertsEnabled,
      negativeEmailAlertEnabled,
      negativeSmsAlertEnabled,
      positiveAlertPhone,
      positiveAlertEmail,
      positiveAlertsEnabled,
      positiveEmailAlertEnabled,
      positiveSmsAlertEnabled,
      notify_negative_phone: negativeAlertPhone,
      notify_negative_email: negativeEmailAlertEnabled,
      notify_negative_sms: negativeSmsAlertEnabled,
      notify_negative_enabled: negativeAlertsEnabled,
      notify_positive_phone: positiveAlertPhone,
      notify_positive_email: positiveEmailAlertEnabled,
      notify_positive_sms: positiveSmsAlertEnabled,
      notify_positive_enabled: positiveAlertsEnabled,
      notification_phone: negativeAlertPhone,
      notification_email: negativeAlertEmail,
    };

    return {
      profile,
      settings,
      notificationSettings,
    };
  } catch (err) {
    console.error('[getInitialServerSettings Error]:', err);
    return null;
  }
}
