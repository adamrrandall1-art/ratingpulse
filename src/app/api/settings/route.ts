export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import { resolveReviewUrl } from '@/lib/google-places';

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

    const supabase = getAdminClient();
    const { profile, settings, profileId } = await resolveProfileAndSettings(supabase, targetUserId);
    const business = buildBusinessObject(profile, settings, targetUserId);

    return NextResponse.json({
      success: true,
      business,
      profile,
      settings,
      resolvedPhone: business.phone,
      resolvedEmail: business.emailSender,
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
    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Business or User ID is required to update settings' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    let { profile, settings, profileId } = await resolveProfileAndSettings(supabase, targetUserId);

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
    if (effectivePlaceId !== undefined) profilePayload.google_place_id = effectivePlaceId;
    if (resolvedReview !== undefined) {
      profilePayload.review_url = resolvedReview;
      profilePayload.google_connected = true;
    }
    if (google_connected !== undefined) profilePayload.google_connected = google_connected;
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

    if (sms_alerts_enabled !== undefined) profilePayload.sms_alerts_enabled = sms_alerts_enabled;
    if (notify_negative_enabled !== undefined) profilePayload.notify_negative_enabled = notify_negative_enabled;
    if (notify_negative_email !== undefined) profilePayload.notify_negative_email = notify_negative_email;
    if (notify_negative_sms !== undefined) profilePayload.notify_negative_sms = notify_negative_sms;
    if (notify_positive_enabled !== undefined) profilePayload.notify_positive_enabled = notify_positive_enabled;
    if (notify_positive_email !== undefined) profilePayload.notify_positive_email = notify_positive_email;
    if (notify_positive_sms !== undefined) profilePayload.notify_positive_sms = notify_positive_sms;

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
    if (resolvedReview !== undefined) {
      settingsPayload.google_review_url = resolvedReview;
      settingsPayload.google_connected = true;
    }
    if (effectivePlaceId !== undefined) {
      settingsPayload.place_id = effectivePlaceId;
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

    if (profileRes.status === 'fulfilled' && profileRes.value.error) {
      console.error('[Settings API] Profile update error:', profileRes.value.error);
    }
    if (settingsRes.status === 'fulfilled' && settingsRes.value.error) {
      console.warn('[Settings API] Business settings upsert warning:', settingsRes.value.error);
    }

    // Refresh updated data
    const { profile: updatedProfile, settings: updatedSettings } = await resolveProfileAndSettings(supabase, profileId);
    const updatedBusiness = buildBusinessObject(updatedProfile, updatedSettings, profileId);

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
