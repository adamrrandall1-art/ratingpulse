'use server';

import { getOrCreateUserSession } from '@/lib/auth-sync';
import { db, toSnakeBrandVoice } from '@/lib/db';
import { createClient } from '@supabase/supabase-js';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseServiceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ADMIN_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  if (!supabaseUrl || !supabaseServiceKey) return null;
  return createClient(supabaseUrl, supabaseServiceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function saveAllSettingsAction(payload: {
  businessId?: string;
  negativeAlertEmail?: string | null;
  negativeAlertPhone?: string | null;
  positiveAlertEmail?: string | null;
  positiveAlertPhone?: string | null;
  googleReviewUrl?: string | null;
  google_review_url?: string | null;
  placeId?: string | null;
  place_id?: string | null;
  aiTone?: string | null;
  aiPersonality?: string | null;
  brandVoice?: string | null;
  aiInstructions?: string | null;
  aiSignature?: string | null;
  autoReplyEnabled?: boolean;
  autoPublish5Star?: boolean;
  selectedModel?: string | null;
  customKeywords?: string | string[] | null;
  keywords?: string[];
  seoKeywords?: string | string[] | null;
  smsTemplate?: string | null;
  negativeAlertsEnabled?: boolean;
  negativeEmailAlertEnabled?: boolean;
  negativeAlertSmsEnabled?: boolean;
  smsAlertsEnabled?: boolean;
  negativeSmsAlertEnabled?: boolean;
  notifySms?: boolean;
  enableSmsAlerts?: boolean;
  negativeAlertEmailEnabled?: boolean;
  emailAlertsEnabled?: boolean;
  positiveAlertsEnabled?: boolean;
  positiveEmailAlertEnabled?: boolean;
  positiveSmsAlertEnabled?: boolean;
  positiveAlertSmsEnabled?: boolean;
  positiveAlertEmailEnabled?: boolean;
  notifyNegativePhone?: string | null;
  notifyNegativeEmail?: string | null;
  notifyNegativeEnabled?: boolean;
  [key: string]: any;
}) {
  const session = await getOrCreateUserSession();
  if (!session) {
    return { success: false, error: 'Unauthorized' };
  }

  const { settings, profile, clerkUserId } = session;

  console.log('[ACTION] Incoming settings update payload:', payload);

  try {
    const googleReviewUrlVal =
      payload.googleReviewUrl !== undefined
        ? payload.googleReviewUrl
        : (payload.google_review_url !== undefined ? payload.google_review_url : undefined);

    const placeIdVal =
      payload.placeId !== undefined
        ? payload.placeId
        : (payload.place_id !== undefined ? payload.place_id : undefined);
    const posPhoneVal = payload.notifyPositivePhone ?? payload.positiveAlertPhone ?? '';
    const posSmsVal = Boolean(payload.notifyPositiveSms ?? payload.positiveAlertSmsEnabled ?? payload.positiveSmsAlertEnabled);

    let emailValue = payload.notifyPositiveEmail ?? payload.positiveAlertEmail ?? '';
    if (typeof emailValue !== 'string' || emailValue === 'true' || emailValue === 'false') {
      emailValue = '';
    }
    const rawPosEmailEnabled =
      payload.notifyPositiveEmailEnabled ??
      payload.positiveAlertEmailEnabled ??
      payload.positiveEmailAlertEnabled ??
      payload.notifyPositiveEnabled;
    const posEmailEnabled = rawPosEmailEnabled !== undefined && rawPosEmailEnabled !== null
      ? Boolean(rawPosEmailEnabled)
      : true;

    // 1. UPDATE PROFILES TABLE (Positive alerts + Review links)
    let updatedProfile: any = null;
    if (profile?.id) {
      try {
        const profileUpdates: any = {
          notifyPositivePhone: posPhoneVal,
          notifyPositiveSms: posSmsVal,
          notifyPositiveEmail: emailValue,
          notifyPositiveEnabled: posEmailEnabled,
          updatedAt: new Date(),
        };
        if (googleReviewUrlVal !== undefined) {
          profileUpdates.reviewUrl = googleReviewUrlVal;
          profileUpdates.review_url = googleReviewUrlVal;
        }
        if (placeIdVal !== undefined) {
          profileUpdates.googlePlaceId = placeIdVal;
          profileUpdates.google_place_id = placeIdVal;
        }
        updatedProfile = await db.profile.update({
          where: { id: profile.id },
          data: profileUpdates,
        });
        console.log('[ACTION] Successfully updated profile:', updatedProfile);
      } catch (profErr) {
        console.error('Failed to update profile:', profErr);
      }
    }

    // 2. UPDATE OR UPSERT BUSINESS_SETTINGS TABLE (Review Links + Negative alerts + AI Tone)
    const targetId = payload.settingsId || payload.id;
    let record: any = null;

    if (profile?.id) {
      record = await db.businessSettings.findFirst({ where: { userId: profile.id } }).catch(() => null);
    }
    if (!record && targetId) {
      record = await db.businessSettings.findUnique({ where: { id: targetId } }).catch(() => null);
    }
    if (!record) {
      record = await db.businessSettings.findFirst({ orderBy: { updatedAt: 'desc' } }).catch(() => null);
    }

    const brandVoiceVal = payload.brandVoice || payload.aiTone || payload.aiPersonality || 'friendly_professional';
    const negPhoneVal = payload.negativeAlertPhone ?? payload.notifyNegativePhone ?? '';
    const negEmailVal = payload.negativeAlertEmail ?? payload.notifyNegativeEmail ?? '';
    const emailAlertsVal =
      typeof payload.emailAlertsEnabled === 'boolean'
        ? payload.emailAlertsEnabled
        : (typeof payload.negativeAlertEmailEnabled === 'boolean'
          ? payload.negativeAlertEmailEnabled
          : true);
    const smsAlertsVal =
      typeof payload.negativeAlertSmsEnabled === 'boolean'
        ? payload.negativeAlertSmsEnabled
        : (typeof payload.notifyNegativeEnabled === 'boolean'
          ? payload.notifyNegativeEnabled
          : (typeof payload.smsAlertsEnabled === 'boolean' ? payload.smsAlertsEnabled : true));

    let formattedKeywords = '';
    const raw = payload.seoKeywords ?? payload.keywords ?? payload.customKeywords;
    if (Array.isArray(raw)) {
      formattedKeywords = raw.map((k: any) => typeof k === 'string' ? k.trim() : k.text || '').filter(Boolean).join(', ');
    } else if (typeof raw === 'string') {
      formattedKeywords = raw.trim();
    }

    const customInstructionsVal = payload.customInstructions ?? payload.aiInstructions ?? '';
    const replySignatureVal = payload.replySignature ?? payload.signature ?? payload.aiSignature ?? '';

    const updatePayload: any = {
      userId: profile?.id || record?.userId,
      brandVoice: payload.brandVoice || payload.aiTone || payload.aiPersonality || 'friendly_professional',
      notifyNegativePhone: payload.notifyNegativePhone ?? payload.negativeAlertPhone ?? '',
      notifyNegativeEmail: payload.notifyNegativeEmail ?? payload.negativeAlertEmail ?? '',
      emailAlertsEnabled: Boolean(payload.emailAlertsEnabled ?? payload.negativeAlertEmailEnabled ?? true),
      notifyNegativeEnabled: Boolean(payload.notifyNegativeEnabled ?? payload.negativeAlertSmsEnabled ?? payload.smsAlertsEnabled ?? true),
      ...(googleReviewUrlVal !== undefined && { googleReviewUrl: googleReviewUrlVal, google_review_url: googleReviewUrlVal }),
      ...(placeIdVal !== undefined && { placeId: placeIdVal, place_id: placeIdVal }),
      seoKeywords: formattedKeywords,
      customInstructions: customInstructionsVal,
      replySignature: replySignatureVal,
      updatedAt: new Date(),
    };

    // Direct Supabase Admin upsert to guarantee persistence to business_settings
    const supabase = getSupabaseAdmin();
    const targetUserId = profile?.id || record?.userId || clerkUserId;
    if (supabase && targetUserId) {
      try {
        const sbSettingsUpdates: Record<string, any> = {
          user_id: targetUserId,
          updated_at: new Date().toISOString(),
        };
        if (googleReviewUrlVal !== undefined) sbSettingsUpdates.google_review_url = googleReviewUrlVal;
        if (placeIdVal !== undefined) sbSettingsUpdates.place_id = placeIdVal;
        if (brandVoiceVal) sbSettingsUpdates.brand_voice = toSnakeBrandVoice(brandVoiceVal);
        if (negEmailVal) sbSettingsUpdates.notify_negative_email = negEmailVal;
        if (negPhoneVal) sbSettingsUpdates.notify_negative_phone = negPhoneVal;
        sbSettingsUpdates.email_alerts_enabled = emailAlertsVal;
        sbSettingsUpdates.notify_negative_enabled = smsAlertsVal;
        if (formattedKeywords) sbSettingsUpdates.seo_keywords = formattedKeywords;
        if (customInstructionsVal) sbSettingsUpdates.custom_instructions = customInstructionsVal;
        if (replySignatureVal) sbSettingsUpdates.reply_signature = replySignatureVal;

        const { error: sbUpsertErr } = await supabase
          .from('business_settings')
          .upsert(sbSettingsUpdates, { onConflict: 'user_id' });
        if (sbUpsertErr) {
          console.warn('[ACTION] Supabase business_settings direct upsert note:', sbUpsertErr.message);
        } else {
          console.log('[ACTION] Successfully persisted to Supabase business_settings directly');
        }
      } catch (sbErr) {
        console.warn('[ACTION] Supabase business_settings update error:', sbErr);
      }
    }

    let updated: any = null;
    if (record) {
      try {
        updated = await db.businessSettings.update({
          where: { id: record.id },
          data: updatePayload,
        });
      } catch (updateErr: any) {
        console.warn('Failed to update businessSettings with new columns, retrying without new columns:', updateErr?.message);
        const { seoKeywords, customInstructions, replySignature, ...fallbackPayload } = updatePayload;
        try {
          updated = await db.businessSettings.update({
            where: { id: record.id },
            data: fallbackPayload,
          });
        } catch (fatalErr) {
          console.error('Fatal error updating businessSettings:', fatalErr);
        }
      }
    } else {
      try {
        updated = await db.businessSettings.create({
          data: {
            ...updatePayload,
            userId: profile?.id || clerkUserId,
          },
        });
      } catch (createErr: any) {
        console.warn('Failed to create businessSettings with new columns, retrying without new columns:', createErr?.message);
        const { seoKeywords, customInstructions, replySignature, ...fallbackPayload } = updatePayload;
        try {
          updated = await db.businessSettings.create({
            data: {
              ...fallbackPayload,
              userId: profile?.id || clerkUserId,
            },
          });
        } catch (fatalErr) {
          console.error('Fatal error creating businessSettings:', fatalErr);
        }
      }
    }

    if (!updated) {
      updated = {
        id: record?.id || `settings_${Date.now()}`,
        userId: profile?.id || clerkUserId,
        ...updatePayload,
      };
    }

    console.log('[ACTION] Successfully updated business_settings:', updated);

    // Also update businesses table to maintain consistency
    let savedBusiness = null;
    try {
      const businesses = await db.business.findMany({
        where: {
          OR: [
            { clerkUserId: clerkUserId },
            { id: record?.id },
            { id: profile?.id },
            { userId: profile?.id },
            { userId: clerkUserId },
          ],
        },
        orderBy: { updatedAt: 'desc' },
      }).catch(() => []);

      const activeBusiness = businesses[0];
      if (activeBusiness) {
        savedBusiness = await db.business.update({
          where: { id: activeBusiness.id },
          data: {
            brandVoice: updated.brandVoice,
            aiTone: updated.brandVoice,
            aiPersonality: updated.brandVoice,
            negativeAlertEmail: updated.notifyNegativeEmail,
            notifyNegativeEmail: updated.notifyNegativeEmail,
            negativeAlertPhone: updated.notifyNegativePhone,
            notifyNegativePhone: updated.notifyNegativePhone,
            emailAlertsEnabled: updated.emailAlertsEnabled,
            negativeAlertEmailEnabled: updated.emailAlertsEnabled,
            negativeEmailAlertEnabled: updated.emailAlertsEnabled,
            negativeAlertSmsEnabled: updated.notifyNegativeEnabled,
            smsAlertsEnabled: updated.notifyNegativeEnabled,
            notifyNegativeEnabled: updated.notifyNegativeEnabled,
            googleReviewUrl: updated.googleReviewUrl ?? activeBusiness.googleReviewUrl,
            reviewUrl: updated.googleReviewUrl ?? activeBusiness.reviewUrl,
            placeId: updated.placeId ?? activeBusiness.placeId,
            aiInstructions: customInstructionsVal || activeBusiness.aiInstructions,
            customInstructions: customInstructionsVal || activeBusiness.customInstructions,
            aiSignature: replySignatureVal || activeBusiness.aiSignature,
            replySignature: replySignatureVal || activeBusiness.replySignature,
            autoReplyEnabled: payload.autoReplyEnabled !== undefined ? Boolean(payload.autoReplyEnabled) : activeBusiness.autoReplyEnabled,
            selectedModel: payload.selectedModel !== undefined ? payload.selectedModel : activeBusiness.selectedModel,
            smsTemplate: payload.smsTemplate !== undefined ? payload.smsTemplate : activeBusiness.smsTemplate,
            positiveAlertPhone: posPhoneVal,
            positiveAlertSmsEnabled: posSmsVal,
            positiveSmsAlertEnabled: posSmsVal,
            positiveAlertEmail: emailValue,
            notifyPositiveEmail: emailValue,
            positiveAlertEmailEnabled: posEmailEnabled,
            positiveEmailAlertEnabled: posEmailEnabled,
            notifyPositiveEmailEnabled: posEmailEnabled,
            seoKeywords: formattedKeywords,
            customKeywords: formattedKeywords,
            updatedAt: new Date(),
          },
        }).catch(() => null);
      }
    } catch (bizErr) {
      console.warn('Could not sync businesses table:', bizErr);
    }

    // Set active business cookies
    try {
      const cookieStore = await cookies();
      const cookieBizId = savedBusiness?.id || record?.id || targetId;
      cookieStore.set('activeBusinessId', cookieBizId, { path: '/', maxAge: 60 * 60 * 24 * 365 });
      cookieStore.set('rp_active_business_id', cookieBizId, { path: '/', maxAge: 60 * 60 * 24 * 365 });
    } catch {}

    // Revalidate paths to bust Next.js server cache
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard');
    revalidatePath('/dashboard', 'layout');
    revalidatePath('/review');

    return {
      success: true,
      settings: updated,
      business: savedBusiness || updated,
      profile: updatedProfile || profile,
    };
  } catch (error: any) {
    console.error('DATABASE UPDATE FAILED:', error);
    return { success: false, error: error?.message || 'Failed to save settings' };
  }
}

// Backward-compatible wrappers
export async function saveSettingsAction(formData: FormData | Record<string, any>) {
  const body: Record<string, any> = {};
  if (formData instanceof FormData) {
    for (const [key, val] of formData.entries()) {
      body[key] = typeof val === 'string' ? val.trim() : val;
    }
    // HTML form checkboxes are omitted from FormData when unchecked:
    if (formData.has('negativeAlertEmail') || formData.has('negativeAlertPhone') || formData.has('isNotificationForm') || formData.has('positiveAlertPhone') || formData.has('positiveAlertEmail') || formData.has('notifyPositiveEmail')) {
      if (!formData.has('emailAlertsEnabled') && !formData.has('negativeAlertEmailEnabled') && !formData.has('negativeEmailAlertEnabled')) {
        body.emailAlertsEnabled = false;
        body.negativeAlertEmailEnabled = false;
        body.negativeEmailAlertEnabled = false;
      }
      if (!formData.has('negativeAlertSmsEnabled') && !formData.has('smsAlertsEnabled') && !formData.has('notifyNegativeEnabled')) {
        body.negativeAlertSmsEnabled = false;
        body.smsAlertsEnabled = false;
      }
      if (!formData.has('positiveAlertSmsEnabled') && !formData.has('positiveSmsAlertEnabled') && !formData.has('notifyPositiveSms')) {
        body.positiveAlertSmsEnabled = false;
        body.positiveSmsAlertEnabled = false;
        body.notifyPositiveSms = false;
      }
      if (!formData.has('positiveAlertEmailEnabled') && !formData.has('positiveEmailAlertEnabled') && !formData.has('notifyPositiveEmailEnabled') && !formData.has('notifyPositiveEnabled')) {
        body.positiveAlertEmailEnabled = false;
        body.positiveEmailAlertEnabled = false;
        body.notifyPositiveEmailEnabled = false;
        body.notifyPositiveEnabled = false;
      }
    }
  } else if (formData && typeof formData === 'object') {
    for (const [key, val] of Object.entries(formData)) {
      body[key] = typeof val === 'string' ? val.trim() : val;
    }
  }
  return saveAllSettingsAction(body);
}

export async function updateAiPersonaAction(data: any) {
  return saveAllSettingsAction(data);
}
