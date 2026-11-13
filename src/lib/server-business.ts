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
          const { data: bById } = await supabase.from('businesses').select('*').eq('id', candId).order('updated_at', { ascending: false }).limit(1);
          if (bById && bById[0]) {
            businessRecord = bById[0];
            break;
          }
        }
        const { data: bByUserId } = await supabase.from('businesses').select('*').eq('userId', candId).order('updated_at', { ascending: false }).limit(1);
        if (bByUserId && bByUserId[0]) {
          businessRecord = bByUserId[0];
          break;
        }
        const { data: bByClerk } = await supabase.from('businesses').select('*').eq('clerkUserId', candId).order('updated_at', { ascending: false }).limit(1);
        if (bByClerk && bByClerk[0]) {
          businessRecord = bByClerk[0];
          break;
        }
        const { data: bByUser_id } = await supabase.from('businesses').select('*').eq('user_id', candId).order('updated_at', { ascending: false }).limit(1);
        if (bByUser_id && bByUser_id[0]) {
          businessRecord = bByUser_id[0];
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
    const defaultReviewUrl = '';
    const effectiveReviewUrl = directReviewUrl ? (resolveReviewUrl(directReviewUrl) || directReviewUrl) : (hasValidPlaceId ? resolveReviewUrl(placeId) : '');
    const hasDirectReviewUrl = Boolean(effectiveReviewUrl && effectiveReviewUrl.startsWith('http'));

    const isGoogleConnected = Boolean(
      (profile?.google_connected && (profile?.google_access_token || profile?.google_refresh_token || profile?.google_account_id)) ||
      (businessRecord?.isGoogleConnected && (profile?.google_access_token || profile?.google_refresh_token || profile?.google_account_id))
    );

    const outboundPhone = process.env.TWILIO_PHONE_NUMBER || process.env.NEXT_PUBLIC_TWILIO_PHONE_NUMBER || '';
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

    const aiTone =
      (typeof businessRecord?.aiTone === 'string' && businessRecord.aiTone) ||
      (typeof businessRecord?.ai_tone === 'string' && businessRecord.ai_tone) ||
      (typeof businessRecord?.brandVoice === 'string' && businessRecord.brandVoice) ||
      (typeof businessRecord?.brand_voice === 'string' && businessRecord.brand_voice) ||
      (typeof settings?.aiTone === 'string' && settings.aiTone) ||
      (typeof settings?.ai_tone === 'string' && settings.ai_tone) ||
      (typeof settings?.brandVoice === 'string' && settings.brandVoice) ||
      (typeof settings?.brand_voice === 'string' && settings.brand_voice) ||
      (typeof profile?.aiTone === 'string' && profile.aiTone) ||
      (typeof profile?.ai_tone === 'string' && profile.ai_tone) ||
      (typeof profile?.brandVoice === 'string' && profile.brandVoice) ||
      (typeof profile?.brand_voice === 'string' && profile.brand_voice) ||
      'Professional & Warm';

    const aiInstructions =
      businessRecord?.aiInstructions ??
      businessRecord?.ai_instructions ??
      settings?.aiInstructions ??
      settings?.ai_instructions ??
      profile?.aiInstructions ??
      profile?.ai_instructions ??
      '';

    const aiSignature =
      businessRecord?.aiSignature ??
      businessRecord?.ai_signature ??
      settings?.aiSignature ??
      settings?.ai_signature ??
      profile?.aiSignature ??
      profile?.ai_signature ??
      '';

    const autoReplyEnabled = Boolean(
      businessRecord?.autoReplyEnabled ??
      businessRecord?.auto_reply_enabled ??
      businessRecord?.autoPublish5Star ??
      businessRecord?.auto_publish_5_star ??
      settings?.autoReplyEnabled ??
      settings?.auto_reply_enabled ??
      settings?.autoPublish5Star ??
      settings?.auto_publish_5_star ??
      profile?.autoReplyEnabled ??
      profile?.auto_reply_enabled ??
      false
    );

    const selectedModel =
      businessRecord?.selectedModel ??
      businessRecord?.selected_model ??
      settings?.selectedModel ??
      settings?.selected_model ??
      profile?.selectedModel ??
      profile?.selected_model ??
      'gemini-1.5-flash';

    const customKeywords =
      businessRecord?.customKeywords ??
      businessRecord?.custom_keywords ??
      settings?.customKeywords ??
      settings?.custom_keywords ??
      (Array.isArray(settings?.custom_keywords) ? settings.custom_keywords.join(',') : null) ??
      (Array.isArray(settings?.keywords) ? settings.keywords.join(',') : null) ??
      profile?.customKeywords ??
      profile?.custom_keywords ??
      '';

    const smsTemplate =
      businessRecord?.smsTemplate ??
      businessRecord?.sms_template ??
      settings?.smsTemplate ??
      settings?.sms_template ??
      profile?.smsTemplate ??
      profile?.sms_template ??
      '';

    const rawCount = Number(businessRecord?.reviewCount || profile?.google_review_count) || 0;
    const cleanCount = (rawCount === 284 || rawCount === 128 || rawCount === 48) ? 0 : rawCount;
    const rawRating = Number(businessRecord?.rating || profile?.google_rating) || 0;
    const cleanRating = (cleanCount === 0 || (rawRating === 4.9 && cleanCount === 0)) ? 0 : rawRating;

    const business = {
      id: businessRecord?.id || profile?.id || userId,
      userId: businessRecord?.userId || businessRecord?.user_id || profile?.clerk_user_id || profile?.id || userId,
      actualBusinessId: businessRecord?.id,
      name: businessRecord?.name || profile?.business_name || settings?.business_name || '',
      category: businessRecord?.category || profile?.business_category || '',
      address: businessRecord?.address || profile?.formatted_address || '',
      phone: businessRecord?.phone || activePhone || outboundPhone || '',
      smsSenderNumber: activePhone || outboundPhone || '',
      emailSender: profile?.notification_email || profile?.email || settings?.notification_email || '',
      email: profile?.email || '',
      placeId: hasValidPlaceId ? placeId : '',
      reviewUrl: effectiveReviewUrl,
      googleReviewUrl: effectiveReviewUrl,
      reviewLink: effectiveReviewUrl,
      rating: cleanRating,
      reviewCount: cleanCount,
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
      // AI Persona & Brand Voice Fields
      aiTone,
      aiPersonality: aiTone,
      brandVoice: aiTone,
      aiInstructions,
      aiSignature,
      autoReplyEnabled,
      autoPublish5Star: autoReplyEnabled,
      selectedModel,
      customKeywords,
      seoKeywords: customKeywords,
      smsTemplate,
      ai_tone: aiTone,
      ai_personality: aiTone,
      brand_voice: aiTone,
      ai_instructions: aiInstructions,
      ai_signature: aiSignature,
      auto_reply_enabled: autoReplyEnabled,
      auto_publish_5_star: autoReplyEnabled,
      selected_model: selectedModel,
      custom_keywords: customKeywords,
      seo_keywords: customKeywords,
      sms_template: smsTemplate,
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

    const aiTone =
      (typeof businessRecord?.aiTone === 'string' && businessRecord.aiTone) ||
      (typeof businessRecord?.ai_tone === 'string' && businessRecord.ai_tone) ||
      (typeof settings?.brand_voice === 'string' && settings.brand_voice) ||
      (typeof profile?.brand_voice === 'string' && profile.brand_voice) ||
      'Professional & Warm';

    const aiInstructions =
      businessRecord?.aiInstructions ??
      businessRecord?.ai_instructions ??
      settings?.aiInstructions ??
      settings?.ai_instructions ??
      '';

    const autoReplyEnabled = Boolean(
      businessRecord?.autoReplyEnabled ??
      businessRecord?.auto_reply_enabled ??
      businessRecord?.autoPublish5Star ??
      settings?.auto_publish_5_star ??
      false
    );

    const selectedModel =
      businessRecord?.selectedModel ??
      businessRecord?.selected_model ??
      'gemini-1.5-flash';

    const aiPersonaSettings = {
      aiTone,
      brandVoice: aiTone,
      aiInstructions,
      autoReplyEnabled,
      selectedModel,
    };

    return {
      profile,
      settings,
      notificationSettings,
      aiPersonaSettings,
      business: businessRecord,
    };
  } catch (err) {
    console.error('[getInitialServerSettings Error]:', err);
    return null;
  }
}
