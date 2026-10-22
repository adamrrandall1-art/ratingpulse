export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { createClient } from '@supabase/supabase-js';
import { getInitialServerBusiness, getInitialServerSettings } from '@/lib/server-business';

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

async function resolveProfileId(supabase: ReturnType<typeof getAdminClient>, rawUserId?: string | null) {
  if (!rawUserId) return null;
  if (UUID_REGEX.test(rawUserId)) {
    try {
      const { data } = await supabase.from('profiles').select('id').eq('id', rawUserId).maybeSingle();
      if (data?.id) return data.id;
    } catch {}
  }
  try {
    const { data } = await supabase.from('profiles').select('id').eq('clerk_user_id', rawUserId).maybeSingle();
    if (data?.id) return data.id;
  } catch {}
  return UUID_REGEX.test(rawUserId) ? rawUserId : null;
}

export async function handleSaveNotifications(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const clerkAuth = await auth().catch(() => null);

    const targetUserId =
      body.activeBusinessId ||
      body.businessId ||
      body.userId ||
      body.user_id ||
      body.id ||
      clerkAuth?.userId;

    console.log('[NOTIFICATIONS_SAVE] Incoming payload:', body);
    console.log('[NOTIFICATIONS_SAVE] Authenticated User ID:', targetUserId);

    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'Business or User ID is required' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    const profileId = (await resolveProfileId(supabase, targetUserId)) || targetUserId;

    // Load existing business before update to guarantee connection metadata is protected
    const existingBusiness = await getInitialServerBusiness(profileId || targetUserId);

    // Extract both camelCase and snake_case notification routing fields
    const negativeAlertEmail =
      body.negativeAlertEmail !== undefined
        ? body.negativeAlertEmail
        : body.negative_alert_email !== undefined
        ? body.negative_alert_email
        : undefined;

    const negativeAlertPhone =
      body.negativeAlertPhone !== undefined
        ? body.negativeAlertPhone
        : body.negative_alert_phone !== undefined
        ? body.negative_alert_phone
        : body.notify_negative_phone !== undefined
        ? body.notify_negative_phone
        : undefined;

    const negativeAlertsEnabled =
      body.negativeAlertsEnabled !== undefined
        ? body.negativeAlertsEnabled
        : body.negative_alerts_enabled !== undefined
        ? body.negative_alerts_enabled
        : body.notify_negative_enabled;

    const negativeEmailAlertEnabled =
      body.negativeEmailAlertEnabled !== undefined
        ? body.negativeEmailAlertEnabled
        : body.negative_email_alert_enabled !== undefined
        ? body.negative_email_alert_enabled
        : body.notify_negative_email;

    const negativeSmsAlertEnabled =
      body.negativeSmsAlertEnabled !== undefined
        ? body.negativeSmsAlertEnabled
        : body.negative_sms_alert_enabled !== undefined
        ? body.negative_sms_alert_enabled
        : body.notify_negative_sms;

    const positiveAlertEmail =
      body.positiveAlertEmail !== undefined
        ? body.positiveAlertEmail
        : body.positive_alert_email !== undefined
        ? body.positive_alert_email
        : undefined;

    const positiveAlertPhone =
      body.positiveAlertPhone !== undefined
        ? body.positiveAlertPhone
        : body.positive_alert_phone !== undefined
        ? body.positive_alert_phone
        : body.notify_positive_phone;

    const positiveAlertsEnabled =
      body.positiveAlertsEnabled !== undefined
        ? body.positiveAlertsEnabled
        : body.positive_alerts_enabled !== undefined
        ? body.positive_alerts_enabled
        : body.notify_positive_enabled;

    const positiveEmailAlertEnabled =
      body.positiveEmailAlertEnabled !== undefined
        ? body.positiveEmailAlertEnabled
        : body.positive_email_alert_enabled !== undefined
        ? body.positive_email_alert_enabled
        : body.notify_positive_email;

    const positiveSmsAlertEnabled =
      body.positiveSmsAlertEnabled !== undefined
        ? body.positiveSmsAlertEnabled
        : body.positive_sms_alert_enabled !== undefined
        ? body.positive_sms_alert_enabled
        : body.notify_positive_sms;

    const cleanNegPhone = negativeAlertPhone !== undefined ? (negativeAlertPhone ? String(negativeAlertPhone).trim() : null) : undefined;
    const cleanNegEmail = negativeAlertEmail !== undefined ? (negativeAlertEmail ? String(negativeAlertEmail).trim() : null) : undefined;
    const cleanPosPhone = positiveAlertPhone !== undefined ? (positiveAlertPhone ? String(positiveAlertPhone).trim() : null) : undefined;
    const cleanPosEmail = positiveAlertEmail !== undefined ? (positiveAlertEmail ? String(positiveAlertEmail).trim() : null) : undefined;

    // Profile updates
    const profileUpdates: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };

    if (cleanNegPhone !== undefined) {
      profileUpdates.notify_negative_phone = cleanNegPhone;
      profileUpdates.notification_phone = cleanNegPhone;
      profileUpdates.negative_alert_phone = cleanNegPhone;
    }
    if (cleanNegEmail !== undefined) {
      profileUpdates.notification_email = cleanNegEmail;
      profileUpdates.negative_alert_email = cleanNegEmail;
    }
    if (negativeAlertsEnabled !== undefined) {
      profileUpdates.notify_negative_enabled = Boolean(negativeAlertsEnabled);
      profileUpdates.negative_alerts_enabled = Boolean(negativeAlertsEnabled);
    }
    if (negativeEmailAlertEnabled !== undefined) {
      profileUpdates.notify_negative_email = Boolean(negativeEmailAlertEnabled);
      profileUpdates.negative_email_alert_enabled = Boolean(negativeEmailAlertEnabled);
    }
    if (negativeSmsAlertEnabled !== undefined) {
      profileUpdates.notify_negative_sms = Boolean(negativeSmsAlertEnabled);
      profileUpdates.negative_sms_alert_enabled = Boolean(negativeSmsAlertEnabled);
      profileUpdates.sms_alerts_enabled = Boolean(negativeSmsAlertEnabled || positiveSmsAlertEnabled);
    }

    if (cleanPosPhone !== undefined) {
      profileUpdates.notify_positive_phone = cleanPosPhone;
      profileUpdates.positive_alert_phone = cleanPosPhone;
    }
    if (cleanPosEmail !== undefined) {
      profileUpdates.positive_alert_email = cleanPosEmail;
    }
    if (positiveAlertsEnabled !== undefined) {
      profileUpdates.notify_positive_enabled = Boolean(positiveAlertsEnabled);
      profileUpdates.positive_alerts_enabled = Boolean(positiveAlertsEnabled);
    }
    if (positiveEmailAlertEnabled !== undefined) {
      profileUpdates.notify_positive_email = Boolean(positiveEmailAlertEnabled);
      profileUpdates.positive_email_alert_enabled = Boolean(positiveEmailAlertEnabled);
    }
    if (positiveSmsAlertEnabled !== undefined) {
      profileUpdates.notify_positive_sms = Boolean(positiveSmsAlertEnabled);
      profileUpdates.positive_sms_alert_enabled = Boolean(positiveSmsAlertEnabled);
    }

    // Business settings updates
    const settingsUpdates: Record<string, unknown> = {
      user_id: profileId,
      updated_at: new Date().toISOString(),
    };

    if (cleanNegPhone !== undefined) {
      settingsUpdates.notify_negative_phone = cleanNegPhone;
      settingsUpdates.notification_phone = cleanNegPhone;
      settingsUpdates.negative_alert_phone = cleanNegPhone;
    }
    if (cleanNegEmail !== undefined) {
      settingsUpdates.notification_email = cleanNegEmail;
      settingsUpdates.negative_alert_email = cleanNegEmail;
    }
    if (negativeAlertsEnabled !== undefined) {
      settingsUpdates.notify_negative_enabled = Boolean(negativeAlertsEnabled);
      settingsUpdates.negative_alerts_enabled = Boolean(negativeAlertsEnabled);
    }
    if (negativeEmailAlertEnabled !== undefined) {
      settingsUpdates.notify_negative_email = Boolean(negativeEmailAlertEnabled);
      settingsUpdates.negative_email_alert_enabled = Boolean(negativeEmailAlertEnabled);
    }
    if (negativeSmsAlertEnabled !== undefined) {
      settingsUpdates.notify_negative_sms = Boolean(negativeSmsAlertEnabled);
      settingsUpdates.negative_sms_alert_enabled = Boolean(negativeSmsAlertEnabled);
      settingsUpdates.sms_alerts_enabled = Boolean(negativeSmsAlertEnabled || positiveSmsAlertEnabled);
    }

    if (cleanPosPhone !== undefined) {
      settingsUpdates.notify_positive_phone = cleanPosPhone;
      settingsUpdates.positive_alert_phone = cleanPosPhone;
    }
    if (cleanPosEmail !== undefined) {
      settingsUpdates.positive_alert_email = cleanPosEmail;
    }
    if (positiveAlertsEnabled !== undefined) {
      settingsUpdates.notify_positive_enabled = Boolean(positiveAlertsEnabled);
      settingsUpdates.positive_alerts_enabled = Boolean(positiveAlertsEnabled);
    }
    if (positiveEmailAlertEnabled !== undefined) {
      settingsUpdates.notify_positive_email = Boolean(positiveEmailAlertEnabled);
      settingsUpdates.positive_email_alert_enabled = Boolean(positiveEmailAlertEnabled);
    }
    if (positiveSmsAlertEnabled !== undefined) {
      settingsUpdates.notify_positive_sms = Boolean(positiveSmsAlertEnabled);
      settingsUpdates.positive_sms_alert_enabled = Boolean(positiveSmsAlertEnabled);
    }

    // Execute database updates
    // Isolated partial updates modifying ONLY notification routing fields
    const [profRes] = await Promise.allSettled([
      supabase.from('profiles').update(profileUpdates).eq('id', profileId),
    ]);

    if (profRes.status === 'fulfilled' && profRes.value.error) {
      console.error('[Notification Settings API] Profile update error:', profRes.value.error);
    }

    // Update business_settings via safe update/insert preserving existing placeId & googleReviewUrl
    try {
      const { data: existingSettings } = await supabase
        .from('business_settings')
        .select('id, user_id, place_id, google_review_url')
        .eq('user_id', profileId)
        .maybeSingle();

      if (existingSettings) {
        await supabase
          .from('business_settings')
          .update(settingsUpdates)
          .eq('user_id', profileId);
      } else {
        await supabase
          .from('business_settings')
          .insert({
            user_id: profileId,
            ...settingsUpdates,
            place_id: existingBusiness?.placeId || undefined,
            google_review_url: existingBusiness?.googleReviewUrl || undefined,
            google_connected: existingBusiness?.isGoogleConnected || undefined,
          });
      }
    } catch (settErr) {
      console.warn('[Notification Settings API] Business settings update note:', settErr);
    }

    // Database / Prisma partial update pattern for business:
    // Ensure isGoogleConnected is NEVER included unless explicitly changing connection status.
    // Ensure googleReviewUrl is NEVER set to null or undefined.
    const businessPartialUpdate: Record<string, unknown> = {
      ...(cleanNegEmail !== undefined && { negativeAlertEmail: cleanNegEmail, negative_alert_email: cleanNegEmail }),
      ...(cleanNegPhone !== undefined && { negativeAlertPhone: cleanNegPhone, negative_alert_phone: cleanNegPhone }),
      ...(cleanPosEmail !== undefined && { positiveAlertEmail: cleanPosEmail, positive_alert_email: cleanPosEmail }),
      ...(cleanPosPhone !== undefined && { positiveAlertPhone: cleanPosPhone, positive_alert_phone: cleanPosPhone }),
      ...(negativeAlertsEnabled !== undefined && { negativeAlertsEnabled: Boolean(negativeAlertsEnabled), negative_alerts_enabled: Boolean(negativeAlertsEnabled) }),
      ...(positiveAlertsEnabled !== undefined && { positiveAlertsEnabled: Boolean(positiveAlertsEnabled), positive_alerts_enabled: Boolean(positiveAlertsEnabled) }),
      ...(negativeEmailAlertEnabled !== undefined && { negativeEmailAlertEnabled: Boolean(negativeEmailAlertEnabled), negative_email_alert_enabled: Boolean(negativeEmailAlertEnabled) }),
      ...(negativeSmsAlertEnabled !== undefined && { negativeSmsAlertEnabled: Boolean(negativeSmsAlertEnabled), negative_sms_alert_enabled: Boolean(negativeSmsAlertEnabled) }),
      ...(positiveEmailAlertEnabled !== undefined && { positiveEmailAlertEnabled: Boolean(positiveEmailAlertEnabled), positive_email_alert_enabled: Boolean(positiveEmailAlertEnabled) }),
      ...(positiveSmsAlertEnabled !== undefined && { positiveSmsAlertEnabled: Boolean(positiveSmsAlertEnabled), positive_sms_alert_enabled: Boolean(positiveSmsAlertEnabled) }),
      updatedAt: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // Safe partial update across potential ID match columns
    try {
      await supabase.from('businesses').update(businessPartialUpdate).eq('id', profileId);
    } catch {}
    try {
      await supabase.from('businesses').update(businessPartialUpdate).eq('userId', profileId);
    } catch {}
    try {
      await supabase.from('businesses').update(businessPartialUpdate).eq('user_id', profileId);
    } catch {}

    // Revalidate dashboard paths
    try {
      revalidatePath('/dashboard/settings');
      revalidatePath('/dashboard', 'layout');
      revalidatePath('/dashboard');
    } catch {}

    const [resolvedBusiness, updatedServerSettings] = await Promise.all([
      getInitialServerBusiness(profileId || targetUserId),
      getInitialServerSettings(profileId || targetUserId),
    ]);

    // NEVER touch or reset isGoogleConnected, googleReviewUrl, or placeId
    const shouldBeConnected = Boolean(
      existingBusiness?.isGoogleConnected ||
      existingBusiness?.googleReviewUrl ||
      existingBusiness?.reviewUrl ||
      existingBusiness?.placeId ||
      resolvedBusiness?.isGoogleConnected
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
      placeIdStatus: preservedReviewUrl ? 'OVERRIDDEN' : (preservedPlaceId ? 'CONNECTED' : (existingBusiness?.placeIdStatus || 'DISCONNECTED')),
      negativeAlertEmail: cleanNegEmail !== undefined ? cleanNegEmail : (resolvedBusiness?.negativeAlertEmail ?? existingBusiness?.negativeAlertEmail ?? ''),
      negativeAlertPhone: cleanNegPhone !== undefined ? cleanNegPhone : (resolvedBusiness?.negativeAlertPhone ?? existingBusiness?.negativeAlertPhone ?? ''),
      positiveAlertEmail: cleanPosEmail !== undefined ? cleanPosEmail : (resolvedBusiness?.positiveAlertEmail ?? existingBusiness?.positiveAlertEmail ?? ''),
      positiveAlertPhone: cleanPosPhone !== undefined ? cleanPosPhone : (resolvedBusiness?.positiveAlertPhone ?? existingBusiness?.positiveAlertPhone ?? ''),
      negativeAlertsEnabled: negativeAlertsEnabled !== undefined ? Boolean(negativeAlertsEnabled) : (resolvedBusiness?.negativeAlertsEnabled ?? existingBusiness?.negativeAlertsEnabled ?? true),
      negativeEmailAlertEnabled: negativeEmailAlertEnabled !== undefined ? Boolean(negativeEmailAlertEnabled) : (resolvedBusiness?.negativeEmailAlertEnabled ?? existingBusiness?.negativeEmailAlertEnabled ?? true),
      negativeSmsAlertEnabled: negativeSmsAlertEnabled !== undefined ? Boolean(negativeSmsAlertEnabled) : (resolvedBusiness?.negativeSmsAlertEnabled ?? existingBusiness?.negativeSmsAlertEnabled ?? false),
      positiveAlertsEnabled: positiveAlertsEnabled !== undefined ? Boolean(positiveAlertsEnabled) : (resolvedBusiness?.positiveAlertsEnabled ?? existingBusiness?.positiveAlertsEnabled ?? true),
      positiveEmailAlertEnabled: positiveEmailAlertEnabled !== undefined ? Boolean(positiveEmailAlertEnabled) : (resolvedBusiness?.positiveEmailAlertEnabled ?? existingBusiness?.positiveEmailAlertEnabled ?? true),
      positiveSmsAlertEnabled: positiveSmsAlertEnabled !== undefined ? Boolean(positiveSmsAlertEnabled) : (resolvedBusiness?.positiveSmsAlertEnabled ?? existingBusiness?.positiveSmsAlertEnabled ?? false),
      updatedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      message: 'Notification routing settings saved successfully',
      notificationSettings: updatedServerSettings?.notificationSettings || {
        negativeAlertEmail: updatedBusiness.negativeAlertEmail,
        negativeAlertPhone: updatedBusiness.negativeAlertPhone,
        positiveAlertEmail: updatedBusiness.positiveAlertEmail,
        positiveAlertPhone: updatedBusiness.positiveAlertPhone,
        negativeAlertsEnabled: updatedBusiness.negativeAlertsEnabled,
        negativeEmailAlertEnabled: updatedBusiness.negativeEmailAlertEnabled,
        negativeSmsAlertEnabled: updatedBusiness.negativeSmsAlertEnabled,
        positiveAlertsEnabled: updatedBusiness.positiveAlertsEnabled,
        positiveEmailAlertEnabled: updatedBusiness.positiveEmailAlertEnabled,
        positiveSmsAlertEnabled: updatedBusiness.positiveSmsAlertEnabled,
      },
      business: updatedBusiness,
    });
  } catch (err: any) {
    console.error('[Notification Settings API Error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to update notification settings' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  return handleSaveNotifications(req);
}

export async function PATCH(req: NextRequest) {
  return handleSaveNotifications(req);
}

export async function PUT(req: NextRequest) {
  return handleSaveNotifications(req);
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clerkAuth = await auth().catch(() => null);
    const userId = searchParams.get('userId') || searchParams.get('id') || clerkAuth?.userId;

    const [businessData, settingsData] = await Promise.all([
      getInitialServerBusiness(userId),
      getInitialServerSettings(userId),
    ]);
    return NextResponse.json({
      success: true,
      notificationSettings: settingsData?.notificationSettings,
      business: businessData,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch notification settings' },
      { status: 500 }
    );
  }
}
