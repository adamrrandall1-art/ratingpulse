'use server';

import { auth } from '@clerk/nextjs/server';
import { db, toSnakeBrandVoice } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

export async function saveAllSettingsAction(payload: {
  businessId?: string;
  negativeAlertEmail?: string | null;
  negativeAlertPhone?: string | null;
  positiveAlertEmail?: string | null;
  positiveAlertPhone?: string | null;
  googleReviewUrl?: string | null;
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
  const { userId } = await auth();
  if (!userId) {
    throw new Error('Unauthorized');
  }

  const profile = await (db as any).profile.findFirst({
    where: { clerkUserId: userId },
  });
  const targetUserId = profile?.id || userId;

  console.log('Incoming saveAllSettingsAction payload:', payload);

  const incomingTone =
    payload.brandVoice ??
    payload.brand_voice ??
    payload.aiTone ??
    payload.ai_tone ??
    payload.tone ??
    payload.selectedTone ??
    payload.aiPersonality ??
    payload.ai_personality;

  const resolvedBrandVoice =
    incomingTone !== undefined && incomingTone !== null && String(incomingTone).trim() !== ''
      ? String(incomingTone)
      : undefined;

  // Robust boolean extraction for negative email alert
  let emailEnabled: boolean | undefined = undefined;
  const rawEmailInput =
    payload.emailAlertsEnabled ??
    payload.email_alerts_enabled ??
    payload.negativeAlertEmailEnabled ??
    payload.negativeEmailAlertEnabled ??
    payload.negative_alert_email_enabled ??
    payload.negative_email_alert_enabled;

  if (typeof rawEmailInput === 'boolean') {
    emailEnabled = rawEmailInput;
  } else if (typeof rawEmailInput === 'string') {
    emailEnabled = rawEmailInput === 'true' || rawEmailInput === 'on' || rawEmailInput === '1';
  }

  // Robust boolean extraction for negative SMS alert
  let smsEnabledVal: boolean | undefined = undefined;
  const rawSmsInput =
    payload.negativeAlertSmsEnabled ??
    payload.smsAlertsEnabled ??
    payload.notifySms ??
    payload.negativeSmsAlertEnabled ??
    payload.enableSmsAlerts ??
    payload.notifyNegativeEnabled ??
    payload.notify_negative_enabled;

  if (typeof rawSmsInput === 'boolean') {
    smsEnabledVal = rawSmsInput;
  } else if (typeof rawSmsInput === 'string') {
    smsEnabledVal = rawSmsInput === 'true' || rawSmsInput === 'on' || rawSmsInput === '1';
  }

  // Persist directly to businessSettings table strictly scoped to targetUserId
  const settingsUpdateData: Record<string, any> = {
    notifyNegativePhone: payload.negativeAlertPhone || null,
    notifyNegativeEmail: payload.negativeAlertEmail || null,
    googleReviewUrl: payload.googleReviewUrl || null,
    updatedAt: new Date(),
  };
  if (resolvedBrandVoice !== undefined) {
    settingsUpdateData.brandVoice = resolvedBrandVoice;
  }
  if (smsEnabledVal !== undefined) {
    settingsUpdateData.notifyNegativeEnabled = smsEnabledVal;
  }
  if (emailEnabled !== undefined) {
    settingsUpdateData.emailAlertsEnabled = emailEnabled;
  }

  const settingsCreateData: Record<string, any> = {
    userId: targetUserId,
    brandVoice: resolvedBrandVoice || 'friendly_professional',
    notifyNegativePhone: payload.negativeAlertPhone || null,
    notifyNegativeEmail: payload.negativeAlertEmail || null,
    notifyNegativeEnabled: smsEnabledVal !== undefined ? smsEnabledVal : true,
    emailAlertsEnabled: emailEnabled !== undefined ? emailEnabled : true,
    googleReviewUrl: payload.googleReviewUrl || null,
  };

  try {
    await db.businessSettings.upsert({
      where: { userId: targetUserId },
      update: settingsUpdateData,
      create: settingsCreateData,
    });
  } catch (settingsErr) {
    console.warn('[saveAllSettingsAction] businessSettings update error:', settingsErr);
  }

  // 1. Find all businesses for this user and resolve active business with saved settings
  const businesses = await db.business.findMany({
    where: {
      OR: [
        { clerkUserId: userId },
        { userId: targetUserId },
        { userId: userId },
        { id: targetUserId },
        { id: userId },
      ],
    },
    orderBy: { updatedAt: 'desc' },
  });

  const activeBusiness = businesses.find(b => b.negativeAlertPhone || b.aiTone || b.negativeAlertEmail || b.brandVoice) || businesses[0];

  const updateData: Record<string, any> = {
    updatedAt: new Date(),
    isGoogleConnected: true,
    clerkUserId: userId,
    userId: userId,
  };

  if (resolvedBrandVoice !== undefined) {
    updateData.brandVoice = resolvedBrandVoice;
    updateData.brand_voice = resolvedBrandVoice;
    updateData.aiTone = resolvedBrandVoice;
    updateData.ai_tone = resolvedBrandVoice;
    updateData.aiPersonality = resolvedBrandVoice;
    updateData.ai_personality = resolvedBrandVoice;
  }

  // Text fields
  if (payload.negativeAlertEmail !== undefined) {
    updateData.negativeAlertEmail = payload.negativeAlertEmail || null;
    updateData.notifyNegativeEmail = payload.negativeAlertEmail || null;
    updateData.notify_negative_email = payload.negativeAlertEmail || null;
  }
  if (payload.negativeAlertPhone !== undefined) {
    updateData.negativeAlertPhone = payload.negativeAlertPhone || null;
    updateData.notifyNegativePhone = payload.negativeAlertPhone || null;
    updateData.notify_negative_phone = payload.negativeAlertPhone || null;
  }
  if (payload.positiveAlertEmail !== undefined) updateData.positiveAlertEmail = payload.positiveAlertEmail || null;
  if (payload.positiveAlertPhone !== undefined) updateData.positiveAlertPhone = payload.positiveAlertPhone || null;
  if (payload.googleReviewUrl !== undefined) updateData.googleReviewUrl = payload.googleReviewUrl;

  if (payload.aiInstructions !== undefined) updateData.aiInstructions = payload.aiInstructions;
  if (payload.aiSignature !== undefined) updateData.aiSignature = payload.aiSignature;

  const autoReply = payload.autoReplyEnabled !== undefined ? payload.autoReplyEnabled : payload.autoPublish5Star;
  if (autoReply !== undefined) {
    const isAutoReply = Boolean(autoReply);
    updateData.autoReplyEnabled = isAutoReply;
    updateData.autoPublish5Star = isAutoReply;
  }

  if (payload.selectedModel !== undefined) updateData.selectedModel = payload.selectedModel || 'gemini-1.5-flash';

  const kw = payload.seoKeywords !== undefined ? payload.seoKeywords : (payload.customKeywords !== undefined ? payload.customKeywords : payload.keywords);
  if (kw !== undefined) {
    const kwStr = Array.isArray(kw) ? kw.join(',') : kw;
    updateData.customKeywords = kwStr;
    updateData.seoKeywords = kwStr;
  }

  if (payload.smsTemplate !== undefined) updateData.smsTemplate = payload.smsTemplate;

  if (payload.negativeAlertsEnabled !== undefined) updateData.negativeAlertsEnabled = payload.negativeAlertsEnabled;
  
  // Boolean checkmark fields (support every possible naming convention)
  if (smsEnabledVal !== undefined) {
    updateData.negativeAlertSmsEnabled = smsEnabledVal;
    updateData.smsAlertsEnabled = smsEnabledVal;
    updateData.negativeSmsAlertEnabled = smsEnabledVal;
    updateData.notifyNegativeEnabled = smsEnabledVal;
    updateData.notify_negative_enabled = smsEnabledVal;
  }

  if (emailEnabled !== undefined) {
    updateData.negativeAlertEmailEnabled = emailEnabled;
    updateData.negativeEmailAlertEnabled = emailEnabled;
    updateData.emailAlertsEnabled = emailEnabled;
    updateData.email_alerts_enabled = emailEnabled;
    updateData.negative_alert_email_enabled = emailEnabled;
    updateData.negative_email_alert_enabled = emailEnabled;
  }

  if (payload.positiveAlertsEnabled !== undefined) updateData.positiveAlertsEnabled = payload.positiveAlertsEnabled;

  const posSms = payload.positiveAlertSmsEnabled !== undefined
    ? Boolean(payload.positiveAlertSmsEnabled)
    : (payload.positiveSmsAlertEnabled !== undefined ? Boolean(payload.positiveSmsAlertEnabled) : undefined);
  if (posSms !== undefined) {
    updateData.positiveAlertSmsEnabled = posSms;
    updateData.positiveSmsAlertEnabled = posSms;
  }

  const posEmail = payload.positiveAlertEmailEnabled !== undefined
    ? Boolean(payload.positiveAlertEmailEnabled)
    : (payload.positiveEmailAlertEnabled !== undefined ? Boolean(payload.positiveEmailAlertEnabled) : undefined);
  if (posEmail !== undefined) {
    updateData.positiveAlertEmailEnabled = posEmail;
    updateData.positiveEmailAlertEnabled = posEmail;
  }

  let saved;
  if (activeBusiness) {
    saved = await db.business.update({
      where: { id: activeBusiness.id },
      data: {
        ...updateData,
        clerkUserId: userId,
        userId: targetUserId,
        updatedAt: new Date(),
      },
    });
  } else {
    const recordId = payload.businessId || targetUserId || userId;
    saved = await db.business.create({
      data: {
        id: recordId,
        userId: targetUserId,
        clerkUserId: userId,
        name: 'RatingPulse Business',
        aiTone: resolvedBrandVoice || 'Professional & Warm',
        aiPersonality: resolvedBrandVoice || 'Professional & Warm',
        brandVoice: resolvedBrandVoice || 'Professional & Warm',
        aiInstructions: '',
        autoReplyEnabled: false,
        autoPublish5Star: false,
        selectedModel: 'gemini-1.5-flash',
        customKeywords: null,
        seoKeywords: null,
        ...updateData,
      },
    });
  }

  // Synchronize duplicate rows for this user without clearing columns
  try {
    const allUserBusinesses = await db.business.findMany({
      where: {
        OR: [
          { userId: targetUserId },
          { userId },
          { clerkUserId: userId },
          { id: targetUserId },
          { id: userId },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });
    if (allUserBusinesses.length > 1) {
      for (const dup of allUserBusinesses) {
        if (dup.id !== saved.id) {
          await db.business.update({
            where: { id: dup.id },
            data: {
              ...updateData,
              clerkUserId: userId,
              userId: targetUserId,
            },
          }).catch(() => null);
        }
      }
    }
  } catch {}

  // Set active business cookies
  try {
    const cookieStore = await cookies();
    cookieStore.set('activeBusinessId', saved.id, { path: '/', maxAge: 60 * 60 * 24 * 365 });
    cookieStore.set('rp_active_business_id', saved.id, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  } catch {}

  revalidatePath('/dashboard', 'layout');
  revalidatePath('/dashboard/settings');

  return { success: true, business: saved };
}

// Backward-compatible wrappers
export async function saveSettingsAction(formData: FormData | Record<string, any>) {
  const body: Record<string, any> = {};
  if (formData instanceof FormData) {
    for (const [key, val] of formData.entries()) {
      body[key] = typeof val === 'string' ? val.trim() : val;
    }
    // HTML form checkboxes are omitted from FormData when unchecked:
    if (formData.has('negativeAlertEmail') || formData.has('negativeAlertPhone') || formData.has('isNotificationForm')) {
      if (!formData.has('emailAlertsEnabled') && !formData.has('negativeAlertEmailEnabled') && !formData.has('negativeEmailAlertEnabled')) {
        body.emailAlertsEnabled = false;
        body.negativeAlertEmailEnabled = false;
        body.negativeEmailAlertEnabled = false;
      }
      if (!formData.has('negativeAlertSmsEnabled') && !formData.has('smsAlertsEnabled') && !formData.has('notifyNegativeEnabled')) {
        body.negativeAlertSmsEnabled = false;
        body.smsAlertsEnabled = false;
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
