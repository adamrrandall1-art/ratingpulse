export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { resolveReviewUrl } from '@/lib/google-places';
import { getInitialServerBusiness } from '@/lib/server-business';

function getAdminClient() {
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

  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveProfileAndSettings(supabase: ReturnType<typeof getAdminClient>, rawUserId?: string | null) {
  let profile: any = null;
  let settings: any = null;

  if (rawUserId) {
    if (UUID_REGEX.test(rawUserId)) {
      try {
        const { data: pById } = await supabase.from('profiles').select('*').eq('id', rawUserId).maybeSingle();
        if (pById) profile = pById;
      } catch (err) {
        console.warn('[Settings API] Profile lookup by id warning:', err);
      }
    }

    if (!profile) {
      try {
        const { data: pByClerk } = await supabase.from('profiles').select('*').eq('clerk_user_id', rawUserId).maybeSingle();
        if (pByClerk) profile = pByClerk;
      } catch (err) {
        console.warn('[Settings API] Profile lookup by clerk_user_id warning:', err);
      }
    }
  }

  if (!profile) {
    try {
      const clerkAuth = await auth().catch(() => null);
      if (clerkAuth?.userId) {
        const { data: pByAuth } = await supabase.from('profiles').select('*').eq('clerk_user_id', clerkAuth.userId).maybeSingle();
        if (pByAuth) {
          profile = pByAuth;
        } else if (UUID_REGEX.test(clerkAuth.userId)) {
          const { data: pById } = await supabase.from('profiles').select('*').eq('id', clerkAuth.userId).maybeSingle();
          if (pById) profile = pById;
        }
      }
    } catch {}
  }

  const profileId = profile?.id;
  if (profileId) {
    try {
      const { data: sByProfId } = await supabase.from('business_settings').select('*').eq('user_id', profileId).maybeSingle();
      if (sByProfId) settings = sByProfId;
    } catch (err) {
      console.warn('[Settings API] Settings lookup by profile id warning:', err);
    }
  }

  if (!settings && rawUserId && UUID_REGEX.test(rawUserId)) {
    try {
      const { data: sByRawId } = await supabase.from('business_settings').select('*').eq('user_id', rawUserId).maybeSingle();
      if (sByRawId) settings = sByRawId;
    } catch {}
  }

  return { profile, settings, profileId };
}

function buildBusinessObject(profile: any, settings: any, fallbackId?: string) {
  const rawReviewUrl =
    profile?.review_url ||
    settings?.google_review_url ||
    (settings as any)?.review_url ||
    '';
  const placeId = profile?.google_place_id || settings?.place_id || '';
  const hasValidPlaceId = Boolean(placeId && !placeId.startsWith('demo_') && placeId.trim().length > 0);
  const effectiveReviewUrl =
    resolveReviewUrl(rawReviewUrl) ||
    (hasValidPlaceId ? resolveReviewUrl(placeId) : '') ||
    '';
  const hasReviewUrl = Boolean(effectiveReviewUrl && effectiveReviewUrl.startsWith('http'));

  const isGoogleConnected = Boolean(
    profile?.google_connected ||
    profile?.google_access_token ||
    settings?.google_access_token ||
    settings?.google_connected ||
    hasReviewUrl
  );

  const resolvedPhone =
    profile?.phone ||
    profile?.notification_phone ||
    profile?.notify_negative_phone ||
    settings?.notification_phone ||
    settings?.notify_negative_phone ||
    (settings as any)?.phone ||
    '';

  const resolvedEmail =
    profile?.notification_email ||
    profile?.email ||
    settings?.notification_email ||
    '';

  return {
    id: profile?.id || fallbackId || '',
    businessId: profile?.id || fallbackId || '',
    name: profile?.business_name || settings?.business_name || (isGoogleConnected ? 'RatingPulse' : 'RatingPulse'),
    category: profile?.business_category || 'Local Business',
    address: profile?.formatted_address || '',
    phone: resolvedPhone,
    smsSenderNumber: resolvedPhone,
    emailSender: resolvedEmail,
    notification_email: resolvedEmail,
    notification_phone: resolvedPhone,
    placeId: hasValidPlaceId ? placeId : '',
    reviewUrl: effectiveReviewUrl,
    googleReviewUrl: effectiveReviewUrl,
    reviewLink: effectiveReviewUrl,
    rating: Number(profile?.google_rating) || 0,
    reviewCount: Number(profile?.google_review_count) || 0,
    isGoogleConnected,
    google_connected: isGoogleConnected,
    isConnected: isGoogleConnected,
    isPendingPlaceId: Boolean(isGoogleConnected && !hasValidPlaceId && !hasReviewUrl),
    updatedAt: profile?.updated_at || settings?.updated_at || new Date().toISOString(),
  };
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const rawUserId =
      searchParams.get('userId') ||
      searchParams.get('id') ||
      searchParams.get('user_id') ||
      searchParams.get('activeBusinessId') ||
      searchParams.get('businessId');

    const clerkAuth = await auth().catch(() => null);
    const targetUserId = rawUserId || clerkAuth?.userId;

    if (!targetUserId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const business = await getInitialServerBusiness(targetUserId);
    const supabase = getAdminClient();
    const { profile, settings, profileId } = await resolveProfileAndSettings(supabase, targetUserId);

    const notificationSettings = {
      negativeAlertPhone: typeof business?.negativeAlertPhone === 'string' ? business.negativeAlertPhone : '',
      negativeAlertEmail: typeof business?.negativeAlertEmail === 'string' ? business.negativeAlertEmail : '',
      negativeAlertsEnabled: Boolean(business?.negativeAlertsEnabled ?? true),
      negativeEmailAlertEnabled: Boolean(business?.negativeEmailAlertEnabled ?? true),
      negativeSmsAlertEnabled: Boolean(business?.negativeSmsAlertEnabled ?? false),
      positiveAlertPhone: typeof business?.positiveAlertPhone === 'string' ? business.positiveAlertPhone : '',
      positiveAlertEmail: typeof business?.positiveAlertEmail === 'string' ? business.positiveAlertEmail : '',
      positiveAlertsEnabled: Boolean(business?.positiveAlertsEnabled ?? true),
      positiveEmailAlertEnabled: Boolean(business?.positiveEmailAlertEnabled ?? true),
      positiveSmsAlertEnabled: Boolean(business?.positiveSmsAlertEnabled ?? false),
    };

    return NextResponse.json({
      success: true,
      business,
      profile,
      settings,
      notificationSettings,
      resolvedPhone: business?.phone || profile?.phone || '',
      resolvedEmail: business?.emailSender || profile?.notification_email || profile?.email || '',
    });
  } catch (err: any) {
    console.error('[Settings API GET Error]:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

async function handleSaveSettings(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const clerkAuth = await auth().catch(() => null);
    const {
      userId,
      user_id,
      id,
      activeBusinessId,
      businessId,
      full_name,
      notification_email,
      notification_phone,
      notify_negative_phone,
      notify_positive_phone,
      alert_phone,
      phone,
      smsSenderNumber,
      emailSender,
      sms_alerts_enabled,
      notify_negative_enabled,
      notify_negative_email,
      notify_negative_sms,
      notify_positive_enabled,
      notify_positive_email,
      notify_positive_sms,
      negativeAlertEmail,
      negativeAlertPhone,
      positiveAlertEmail,
      positiveAlertPhone,
      negativeAlertsEnabled,
      negativeEmailAlertEnabled,
      negativeSmsAlertEnabled,
      positiveAlertsEnabled,
      positiveEmailAlertEnabled,
      positiveSmsAlertEnabled,
      brand_voice,
      sms_template,
      custom_keywords,
      auto_publish_5_star,
      business_name,
      business_category,
      formatted_address,
      google_place_id,
      place_id,
      review_url,
      googleReviewUrl,
      reviewLink,
      google_connected,
    } = body;

    const targetUserId = activeBusinessId || businessId || userId || user_id || id || clerkAuth?.userId;

    console.log('[SETTINGS_SAVE] Incoming payload:', body);
    console.log('[SETTINGS_SAVE] Authenticated User ID:', targetUserId);

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Business or User ID is required to update settings' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    let { profile, settings, profileId } = await resolveProfileAndSettings(supabase, targetUserId);
    const existingBusiness = await getInitialServerBusiness(profileId || targetUserId);

    if (!profile) {
      const isUuid = UUID_REGEX.test(targetUserId);
      const newId = isUuid ? targetUserId : crypto.randomUUID();
      const insertObj: Record<string, unknown> = {
        id: newId,
        updated_at: new Date().toISOString(),
      };
      if (!isUuid) {
        insertObj.clerk_user_id = targetUserId;
      }
      if (full_name) insertObj.full_name = full_name;

      const { data: created, error: createErr } = await supabase
        .from('profiles')
        .insert(insertObj)
        .select('*')
        .maybeSingle();

      if (createErr) {
        console.warn('[Settings API] Profile insert fallback warning:', createErr.message);
      }
      profile = created || insertObj;
      profileId = created?.id || newId;
    }

    const effectivePhoneInput =
      phone !== undefined
        ? phone
        : smsSenderNumber !== undefined
        ? smsSenderNumber
        : notify_negative_phone !== undefined
        ? notify_negative_phone
        : notification_phone !== undefined
        ? notification_phone
        : alert_phone !== undefined
        ? alert_phone
        : notify_positive_phone;

    const effectiveEmailInput =
      emailSender !== undefined
        ? emailSender
        : notification_email !== undefined
        ? notification_email
        : body.email;

    const effectiveReviewInput = googleReviewUrl || review_url || reviewLink;
    const resolvedReview = effectiveReviewInput ? (resolveReviewUrl(effectiveReviewInput) || effectiveReviewInput) : undefined;
    const effectivePlaceId = google_place_id || place_id;

    // Profile payload
    const profilePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (full_name !== undefined) profilePayload.full_name = full_name;
    if (business_name !== undefined) profilePayload.business_name = business_name;
    if (business_category !== undefined) profilePayload.business_category = business_category;
    if (formatted_address !== undefined) profilePayload.formatted_address = formatted_address;

    // Protect Google review URL and Place ID from being wiped by partial updates
    if (effectivePlaceId !== undefined && effectivePlaceId) {
      profilePayload.google_place_id = effectivePlaceId;
    } else if (profile?.google_place_id || existingBusiness?.placeId) {
      profilePayload.google_place_id = profile?.google_place_id || existingBusiness?.placeId;
    }

    if (resolvedReview !== undefined && resolvedReview) {
      profilePayload.review_url = resolvedReview;
      profilePayload.google_connected = true;
    } else if (profile?.review_url || existingBusiness?.googleReviewUrl) {
      profilePayload.review_url = profile?.review_url || existingBusiness?.googleReviewUrl;
      profilePayload.google_connected = true;
    }

    if (google_connected === true || profile?.google_connected || profilePayload.review_url || existingBusiness?.isGoogleConnected) {
      profilePayload.google_connected = true;
    }

    if (body.google_rating !== undefined) profilePayload.google_rating = body.google_rating;
    if (body.google_review_count !== undefined) profilePayload.google_review_count = body.google_review_count;

    if (effectivePhoneInput !== undefined) {
      const cleanPhone = effectivePhoneInput ? effectivePhoneInput.trim() : null;
      profilePayload.phone = cleanPhone;
      profilePayload.notification_phone = cleanPhone;
      profilePayload.notify_negative_phone = cleanPhone;
      profilePayload.notify_positive_phone = cleanPhone;
    }

    if (effectiveEmailInput !== undefined) {
      profilePayload.notification_email = effectiveEmailInput ? effectiveEmailInput.trim() : null;
    }

    // Discrete notification routing fields
    const cleanNegEmail =
      negativeAlertEmail !== undefined
        ? (negativeAlertEmail ? String(negativeAlertEmail).trim() : null)
        : (body.negative_alert_email !== undefined ? (body.negative_alert_email ? String(body.negative_alert_email).trim() : null) : undefined);

    const cleanNegPhone =
      negativeAlertPhone !== undefined
        ? (negativeAlertPhone ? String(negativeAlertPhone).trim() : null)
        : (body.negative_alert_phone !== undefined ? (body.negative_alert_phone ? String(body.negative_alert_phone).trim() : null) : undefined);

    const cleanPosEmail =
      positiveAlertEmail !== undefined
        ? (positiveAlertEmail ? String(positiveAlertEmail).trim() : null)
        : (body.positive_alert_email !== undefined ? (body.positive_alert_email ? String(body.positive_alert_email).trim() : null) : undefined);

    const cleanPosPhone =
      positiveAlertPhone !== undefined
        ? (positiveAlertPhone ? String(positiveAlertPhone).trim() : null)
        : (body.positive_alert_phone !== undefined ? (body.positive_alert_phone ? String(body.positive_alert_phone).trim() : null) : undefined);

    const effNegAlertsEnabled = negativeAlertsEnabled !== undefined ? Boolean(negativeAlertsEnabled) : (body.negative_alerts_enabled !== undefined ? Boolean(body.negative_alerts_enabled) : notify_negative_enabled);
    const effNegEmailEnabled = negativeEmailAlertEnabled !== undefined ? Boolean(negativeEmailAlertEnabled) : (body.negative_email_alert_enabled !== undefined ? Boolean(body.negative_email_alert_enabled) : notify_negative_email);
    const effNegSmsEnabled = negativeSmsAlertEnabled !== undefined ? Boolean(negativeSmsAlertEnabled) : (body.negative_sms_alert_enabled !== undefined ? Boolean(body.negative_sms_alert_enabled) : notify_negative_sms);
    const effPosAlertsEnabled = positiveAlertsEnabled !== undefined ? Boolean(positiveAlertsEnabled) : (body.positive_alerts_enabled !== undefined ? Boolean(body.positive_alerts_enabled) : notify_positive_enabled);
    const effPosEmailEnabled = positiveEmailAlertEnabled !== undefined ? Boolean(positiveEmailAlertEnabled) : (body.positive_email_alert_enabled !== undefined ? Boolean(body.positive_email_alert_enabled) : notify_positive_email);
    const effPosSmsEnabled = positiveSmsAlertEnabled !== undefined ? Boolean(positiveSmsAlertEnabled) : (body.positive_sms_alert_enabled !== undefined ? Boolean(body.positive_sms_alert_enabled) : notify_positive_sms);

    if (cleanNegEmail !== undefined) {
      profilePayload.negative_alert_email = cleanNegEmail;
      profilePayload.notification_email = cleanNegEmail;
    }
    if (cleanNegPhone !== undefined) {
      profilePayload.negative_alert_phone = cleanNegPhone;
      profilePayload.notify_negative_phone = cleanNegPhone;
      profilePayload.notification_phone = cleanNegPhone;
    }
    if (cleanPosEmail !== undefined) {
      profilePayload.positive_alert_email = cleanPosEmail;
    }
    if (cleanPosPhone !== undefined) {
      profilePayload.positive_alert_phone = cleanPosPhone;
      profilePayload.notify_positive_phone = cleanPosPhone;
    }

    if (effNegAlertsEnabled !== undefined) {
      profilePayload.negative_alerts_enabled = effNegAlertsEnabled;
      profilePayload.notify_negative_enabled = effNegAlertsEnabled;
    }
    if (effNegEmailEnabled !== undefined) {
      profilePayload.negative_email_alert_enabled = effNegEmailEnabled;
      profilePayload.notify_negative_email = effNegEmailEnabled;
    }
    if (effNegSmsEnabled !== undefined) {
      profilePayload.negative_sms_alert_enabled = effNegSmsEnabled;
      profilePayload.notify_negative_sms = effNegSmsEnabled;
    }
    if (effPosAlertsEnabled !== undefined) {
      profilePayload.positive_alerts_enabled = effPosAlertsEnabled;
      profilePayload.notify_positive_enabled = effPosAlertsEnabled;
    }
    if (effPosEmailEnabled !== undefined) {
      profilePayload.positive_email_alert_enabled = effPosEmailEnabled;
      profilePayload.notify_positive_email = effPosEmailEnabled;
    }
    if (effPosSmsEnabled !== undefined) {
      profilePayload.positive_sms_alert_enabled = effPosSmsEnabled;
      profilePayload.notify_positive_sms = effPosSmsEnabled;
    }

    // Settings payload
    const settingsPayload: Record<string, unknown> = {
      user_id: profileId,
      updated_at: new Date().toISOString(),
    };
    if (effectivePhoneInput !== undefined) {
      const cleanPhone = effectivePhoneInput ? effectivePhoneInput.trim() : null;
      settingsPayload.notification_phone = cleanPhone;
      settingsPayload.notify_negative_phone = cleanPhone;
    }
    if (effectiveEmailInput !== undefined) {
      settingsPayload.notification_email = effectiveEmailInput ? effectiveEmailInput.trim() : null;
    }

    if (cleanNegEmail !== undefined) {
      settingsPayload.negative_alert_email = cleanNegEmail;
      settingsPayload.notification_email = cleanNegEmail;
    }
    if (cleanNegPhone !== undefined) {
      settingsPayload.negative_alert_phone = cleanNegPhone;
      settingsPayload.notify_negative_phone = cleanNegPhone;
      settingsPayload.notification_phone = cleanNegPhone;
    }
    if (cleanPosEmail !== undefined) {
      settingsPayload.positive_alert_email = cleanPosEmail;
    }
    if (cleanPosPhone !== undefined) {
      settingsPayload.positive_alert_phone = cleanPosPhone;
      settingsPayload.notify_positive_phone = cleanPosPhone;
    }

    if (effNegAlertsEnabled !== undefined) {
      settingsPayload.negative_alerts_enabled = effNegAlertsEnabled;
      settingsPayload.notify_negative_enabled = effNegAlertsEnabled;
    }
    if (effNegEmailEnabled !== undefined) {
      settingsPayload.negative_email_alert_enabled = effNegEmailEnabled;
      settingsPayload.notify_negative_email = effNegEmailEnabled;
    }
    if (effNegSmsEnabled !== undefined) {
      settingsPayload.negative_sms_alert_enabled = effNegSmsEnabled;
      settingsPayload.notify_negative_sms = effNegSmsEnabled;
    }
    if (effPosAlertsEnabled !== undefined) {
      settingsPayload.positive_alerts_enabled = effPosAlertsEnabled;
      settingsPayload.notify_positive_enabled = effPosAlertsEnabled;
    }
    if (effPosEmailEnabled !== undefined) {
      settingsPayload.positive_email_alert_enabled = effPosEmailEnabled;
      settingsPayload.notify_positive_email = effPosEmailEnabled;
    }
    if (effPosSmsEnabled !== undefined) {
      settingsPayload.positive_sms_alert_enabled = effPosSmsEnabled;
      settingsPayload.notify_positive_sms = effPosSmsEnabled;
    }

    // Protect Google review URL and Place ID in settings
    if (resolvedReview !== undefined && resolvedReview) {
      settingsPayload.google_review_url = resolvedReview;
      settingsPayload.google_connected = true;
    } else if (settings?.google_review_url || profilePayload.review_url) {
      settingsPayload.google_review_url = settings?.google_review_url || profilePayload.review_url;
      settingsPayload.google_connected = true;
    }

    if (effectivePlaceId !== undefined && effectivePlaceId) {
      settingsPayload.place_id = effectivePlaceId;
    } else if (settings?.place_id || profilePayload.google_place_id) {
      settingsPayload.place_id = settings?.place_id || profilePayload.google_place_id;
    }

    if (settingsPayload.google_review_url || settingsPayload.place_id || settings?.google_connected || profilePayload.google_connected) {
      settingsPayload.google_connected = true;
    }

    if (business_name !== undefined) {
      settingsPayload.business_name = business_name;
    }
    if (sms_alerts_enabled !== undefined) settingsPayload.sms_alerts_enabled = sms_alerts_enabled;
    if (notify_negative_enabled !== undefined) settingsPayload.notify_negative_enabled = notify_negative_enabled;
    if (notify_negative_email !== undefined) settingsPayload.notify_negative_email = notify_negative_email;
    if (notify_negative_sms !== undefined) settingsPayload.notify_negative_sms = notify_negative_sms;
    if (notify_positive_enabled !== undefined) settingsPayload.notify_positive_enabled = notify_positive_enabled;
    if (notify_positive_email !== undefined) settingsPayload.notify_positive_email = notify_positive_email;
    if (notify_positive_sms !== undefined) settingsPayload.notify_positive_sms = notify_positive_sms;
    if (auto_publish_5_star !== undefined) settingsPayload.auto_publish_5_star = auto_publish_5_star;
    if (brand_voice !== undefined) settingsPayload.brand_voice = brand_voice;
    if (sms_template !== undefined) settingsPayload.sms_template = sms_template;
    if (custom_keywords !== undefined) settingsPayload.custom_keywords = custom_keywords;

    // Execute updates
    const [profileRes, settingsRes] = await Promise.allSettled([
      supabase.from('profiles').update(profilePayload).eq('id', profileId),
      supabase.from('business_settings').upsert(settingsPayload, { onConflict: 'user_id' }),
    ]);

    // Database / Prisma partial update pattern for business:
    // Ensure isGoogleConnected is NEVER included unless explicitly changing connection status.
    // Ensure googleReviewUrl is NEVER set to null or undefined.
    const businessPartialUpdate: Record<string, unknown> = {
      ...(cleanNegEmail !== undefined && { negativeAlertEmail: cleanNegEmail, negative_alert_email: cleanNegEmail }),
      ...(cleanNegPhone !== undefined && { negativeAlertPhone: cleanNegPhone, negative_alert_phone: cleanNegPhone }),
      ...(cleanPosEmail !== undefined && { positiveAlertEmail: cleanPosEmail, positive_alert_email: cleanPosEmail }),
      ...(cleanPosPhone !== undefined && { positiveAlertPhone: cleanPosPhone, positive_alert_phone: cleanPosPhone }),
      ...(effNegAlertsEnabled !== undefined && { negativeAlertsEnabled: effNegAlertsEnabled, negative_alerts_enabled: effNegAlertsEnabled }),
      ...(effPosAlertsEnabled !== undefined && { positiveAlertsEnabled: effPosAlertsEnabled, positive_alerts_enabled: effPosAlertsEnabled }),
      ...(effNegEmailEnabled !== undefined && { negativeEmailAlertEnabled: effNegEmailEnabled, negative_email_alert_enabled: effNegEmailEnabled }),
      ...(effNegSmsEnabled !== undefined && { negativeSmsAlertEnabled: effNegSmsEnabled, negative_sms_alert_enabled: effNegSmsEnabled }),
      ...(effPosEmailEnabled !== undefined && { positiveEmailAlertEnabled: effPosEmailEnabled, positive_email_alert_enabled: effPosEmailEnabled }),
      ...(effPosSmsEnabled !== undefined && { positiveSmsAlertEnabled: effPosSmsEnabled, positive_sms_alert_enabled: effPosSmsEnabled }),
      updatedAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    try {
      await supabase.from('businesses').update(businessPartialUpdate).eq('id', profileId);
    } catch {}
    try {
      await supabase.from('businesses').update(businessPartialUpdate).eq('userId', profileId);
    } catch {}
    try {
      await supabase.from('businesses').update(businessPartialUpdate).eq('user_id', profileId);
    } catch {}

    if (profileRes.status === 'fulfilled' && profileRes.value.error) {
      console.error('[Settings API] Profile update error:', profileRes.value.error);
    }
    if (settingsRes.status === 'fulfilled' && settingsRes.value.error) {
      console.warn('[Settings API] Business settings upsert warning:', settingsRes.value.error);
    }

    // Refresh updated data via unified resolver
    const { profile: updatedProfile, settings: updatedSettings } = await resolveProfileAndSettings(supabase, profileId);
    const resolvedBusiness = (await getInitialServerBusiness(profileId)) || buildBusinessObject(updatedProfile, updatedSettings, profileId);

    // NEVER touch or reset isGoogleConnected, googleReviewUrl, or placeId
    const shouldBeConnected = Boolean(
      existingBusiness?.isGoogleConnected ||
      existingBusiness?.googleReviewUrl ||
      existingBusiness?.reviewUrl ||
      existingBusiness?.placeId ||
      resolvedBusiness?.isGoogleConnected ||
      updatedProfile?.google_connected ||
      updatedSettings?.google_connected
    );

    const preservedReviewUrl =
      resolvedBusiness?.googleReviewUrl ||
      resolvedBusiness?.reviewUrl ||
      existingBusiness?.googleReviewUrl ||
      existingBusiness?.reviewUrl ||
      '';

    const preservedPlaceId =
      resolvedBusiness?.placeId ||
      existingBusiness?.placeId ||
      '';

    const resBiz = resolvedBusiness as any;
    const exBiz = existingBusiness as any;

    const updatedBusiness = {
      ...(existingBusiness || {}),
      ...(resolvedBusiness || {}),
      isGoogleConnected: shouldBeConnected,
      google_connected: shouldBeConnected,
      isConnected: shouldBeConnected,
      googleReviewUrl: preservedReviewUrl,
      reviewUrl: preservedReviewUrl,
      reviewLink: preservedReviewUrl,
      placeId: preservedPlaceId,
      placeIdStatus: preservedReviewUrl ? 'OVERRIDDEN' : (preservedPlaceId ? 'CONNECTED' : (exBiz?.placeIdStatus || 'DISCONNECTED')),
      negativeAlertEmail: cleanNegEmail !== undefined ? cleanNegEmail : (resBiz?.negativeAlertEmail ?? exBiz?.negativeAlertEmail ?? ''),
      negativeAlertPhone: cleanNegPhone !== undefined ? cleanNegPhone : (resBiz?.negativeAlertPhone ?? exBiz?.negativeAlertPhone ?? ''),
      positiveAlertEmail: cleanPosEmail !== undefined ? cleanPosEmail : (resBiz?.positiveAlertEmail ?? exBiz?.positiveAlertEmail ?? ''),
      positiveAlertPhone: cleanPosPhone !== undefined ? cleanPosPhone : (resBiz?.positiveAlertPhone ?? exBiz?.positiveAlertPhone ?? ''),
      negativeAlertsEnabled: effNegAlertsEnabled !== undefined ? Boolean(effNegAlertsEnabled) : (resBiz?.negativeAlertsEnabled ?? exBiz?.negativeAlertsEnabled ?? true),
      negativeEmailAlertEnabled: effNegEmailEnabled !== undefined ? Boolean(effNegEmailEnabled) : (resBiz?.negativeEmailAlertEnabled ?? exBiz?.negativeEmailAlertEnabled ?? true),
      negativeSmsAlertEnabled: effNegSmsEnabled !== undefined ? Boolean(effNegSmsEnabled) : (resBiz?.negativeSmsAlertEnabled ?? exBiz?.negativeSmsAlertEnabled ?? false),
      positiveAlertsEnabled: effPosAlertsEnabled !== undefined ? Boolean(effPosAlertsEnabled) : (resBiz?.positiveAlertsEnabled ?? exBiz?.positiveAlertsEnabled ?? true),
      positiveEmailAlertEnabled: effPosEmailEnabled !== undefined ? Boolean(effPosEmailEnabled) : (resBiz?.positiveEmailAlertEnabled ?? exBiz?.positiveEmailAlertEnabled ?? true),
      positiveSmsAlertEnabled: effPosSmsEnabled !== undefined ? Boolean(effPosSmsEnabled) : (resBiz?.positiveSmsAlertEnabled ?? exBiz?.positiveSmsAlertEnabled ?? false),
      updatedAt: new Date().toISOString(),
    };
    console.log('[SETTINGS_SAVE] Successfully persisted business record:', updatedBusiness);

    // Cache revalidation across dashboard routes
    try {
      revalidatePath('/dashboard/settings');
      revalidatePath('/dashboard/setup');
      revalidatePath('/dashboard/businesses');
      revalidatePath('/dashboard', 'layout');
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/reviews');
      revalidatePath('/dashboard/invites');
    } catch (revErr) {
      console.warn('[Settings API] Cache revalidation note:', revErr);
    }

    return NextResponse.json({
      success: true,
      business: updatedBusiness,
      profile: updatedProfile,
      settings: updatedSettings,
      phone: updatedBusiness.phone,
      email: updatedBusiness.emailSender,
      message: 'Settings updated successfully',
    });
  } catch (err: any) {
    console.error('[Settings API Save Error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error saving settings' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return handleSaveSettings(req);
}

export async function PUT(req: NextRequest) {
  return handleSaveSettings(req);
}
