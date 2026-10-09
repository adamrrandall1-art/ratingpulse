export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get('userId') || searchParams.get('id');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'User ID is required' }, { status: 400 });
    }

    const supabase = getAdminClient();

    const [profRes, settRes] = await Promise.allSettled([
      supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
      supabase.from('business_settings').select('*').eq('user_id', userId).maybeSingle(),
    ]);

    const profile = profRes.status === 'fulfilled' ? profRes.value.data : null;
    const settings = settRes.status === 'fulfilled' ? settRes.value.data : null;

    const resolvedPhone =
      settings?.notify_negative_phone ||
      settings?.notification_phone ||
      profile?.notify_negative_phone ||
      profile?.notification_phone ||
      profile?.phone ||
      '';

    const resolvedEmail =
      settings?.notification_email ||
      profile?.notification_email ||
      profile?.email ||
      '';

    return NextResponse.json({
      success: true,
      profile,
      settings,
      resolvedPhone,
      resolvedEmail,
    });
  } catch (err: any) {
    console.error('[Settings API GET Error]:', err);
    return NextResponse.json({ success: false, error: err?.message || 'Failed to fetch settings' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const {
      userId,
      user_id,
      id,
      full_name,
      notification_email,
      notification_phone,
      notify_negative_phone,
      alert_phone,
      phone,
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
    } = body;

    const targetUserId = userId || user_id || id;
    if (!targetUserId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required to update settings' },
        { status: 400 }
      );
    }

    const supabase = getAdminClient();
    const effectivePhone = (notify_negative_phone || alert_phone || notification_phone || phone || '').trim();
    const effectiveEmail = (notification_email || '').trim();

    console.log('[Saving Settings Payload in API]:', {
      targetUserId,
      effectivePhone,
      effectiveEmail,
      notify_negative_sms,
      notify_negative_enabled,
    });

    const profilePayload: Record<string, unknown> = {
      updated_at: new Date().toISOString(),
    };
    if (full_name !== undefined) profilePayload.full_name = full_name;
    if (effectiveEmail) profilePayload.notification_email = effectiveEmail;
    if (body.business_name !== undefined) profilePayload.business_name = body.business_name;
    if (body.business_category !== undefined) profilePayload.business_category = body.business_category;
    if (body.formatted_address !== undefined) profilePayload.formatted_address = body.formatted_address;
    if (body.google_place_id !== undefined) profilePayload.google_place_id = body.google_place_id;
    if (body.review_url !== undefined) profilePayload.review_url = body.review_url;
    if (body.google_connected !== undefined) profilePayload.google_connected = body.google_connected;
    if (body.google_access_token !== undefined) profilePayload.google_access_token = body.google_access_token;
    if (body.google_refresh_token !== undefined) profilePayload.google_refresh_token = body.google_refresh_token;
    if (body.google_rating !== undefined) profilePayload.google_rating = body.google_rating;
    if (body.google_review_count !== undefined) profilePayload.google_review_count = body.google_review_count;
    if (effectivePhone) {
      profilePayload.notification_phone = effectivePhone;
      profilePayload.notify_negative_phone = effectivePhone;
      profilePayload.notify_positive_phone = effectivePhone;
      profilePayload.phone = effectivePhone;
    }
    if (sms_alerts_enabled !== undefined) profilePayload.sms_alerts_enabled = sms_alerts_enabled;
    if (notify_negative_enabled !== undefined) profilePayload.notify_negative_enabled = notify_negative_enabled;
    if (notify_negative_email !== undefined) profilePayload.notify_negative_email = notify_negative_email;
    if (notify_negative_sms !== undefined) profilePayload.notify_negative_sms = notify_negative_sms;
    if (notify_positive_enabled !== undefined) profilePayload.notify_positive_enabled = notify_positive_enabled;
    if (notify_positive_email !== undefined) profilePayload.notify_positive_email = notify_positive_email;
    if (notify_positive_sms !== undefined) profilePayload.notify_positive_sms = notify_positive_sms;

    const settingsPayload: Record<string, unknown> = {
      user_id: targetUserId,
      updated_at: new Date().toISOString(),
    };
    if (effectivePhone) {
      settingsPayload.notification_phone = effectivePhone;
      settingsPayload.notify_negative_phone = effectivePhone;
    }
    if (effectiveEmail) settingsPayload.notification_email = effectiveEmail;
    if (sms_alerts_enabled !== undefined) settingsPayload.sms_alerts_enabled = sms_alerts_enabled;
    if (notify_negative_enabled !== undefined) settingsPayload.notify_negative_enabled = notify_negative_enabled;
    if (notify_negative_email !== undefined) settingsPayload.notify_negative_email = notify_negative_email;
    if (notify_negative_sms !== undefined) settingsPayload.notify_negative_sms = notify_negative_sms;
    if (notify_positive_enabled !== undefined) settingsPayload.notify_positive_enabled = notify_positive_enabled;
    if (notify_positive_email !== undefined) settingsPayload.notify_positive_email = notify_positive_email;
    if (notify_positive_sms !== undefined) settingsPayload.notify_positive_sms = notify_positive_sms;
    if (body.auto_publish_5_star !== undefined) settingsPayload.auto_publish_5_star = body.auto_publish_5_star;
    if (brand_voice !== undefined) settingsPayload.brand_voice = brand_voice;
    if (sms_template !== undefined) settingsPayload.sms_template = sms_template;
    if (custom_keywords !== undefined) settingsPayload.custom_keywords = custom_keywords;

    // Update both tables with service role client
    const [profileUpdateRes, settingsUpdateRes] = await Promise.allSettled([
      supabase.from('profiles').upsert({ id: targetUserId, ...profilePayload }, { onConflict: 'id' }),
      supabase.from('business_settings').upsert(settingsPayload, { onConflict: 'user_id' }),
    ]);

    let updateError: string | null = null;
    if (profileUpdateRes.status === 'fulfilled' && profileUpdateRes.value.error) {
      console.error('[Settings API] Profile update error:', profileUpdateRes.value.error);
      updateError = profileUpdateRes.value.error.message;
    }
    if (settingsUpdateRes.status === 'fulfilled' && settingsUpdateRes.value.error) {
      console.warn('[Settings API] Business settings upsert warning (non-fatal):', settingsUpdateRes.value.error);
    }

    if (updateError) {
      return NextResponse.json(
        { success: false, error: updateError },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      phone: effectivePhone,
      email: effectiveEmail,
      message: 'Settings updated successfully',
    });
  } catch (err: any) {
    console.error('[Settings API POST Error]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error saving settings' },
      { status: 500 }
    );
  }
}
