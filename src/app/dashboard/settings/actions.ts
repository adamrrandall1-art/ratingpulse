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

  const selectedVoice = payload.brandVoice || payload.aiTone || 'friendly_professional';

  // Persist directly to businessSettings table strictly scoped to targetUserId
  try {
    await db.businessSettings.upsert({
      where: { userId: targetUserId },
      update: {
        brandVoice: payload.brandVoice || payload.aiTone,
        notifyNegativePhone: payload.negativeAlertPhone || null,
        notifyNegativeEmail: payload.negativeAlertEmail || null,
        notifyNegativeEnabled: Boolean(payload.negativeAlertSmsEnabled ?? payload.smsAlertsEnabled ?? true),
        emailAlertsEnabled: Boolean(payload.emailAlertsEnabled ?? payload.negativeAlertEmailEnabled ?? true),
        googleReviewUrl: payload.googleReviewUrl || null,
        updatedAt: new Date(),
      },
      create: {
        userId: targetUserId,
        brandVoice: payload.brandVoice || payload.aiTone || 'friendly_professional',
        notifyNegativePhone: payload.negativeAlertPhone || null,
        notifyNegativeEmail: payload.negativeAlertEmail || null,
        notifyNegativeEnabled: Boolean(payload.negativeAlertSmsEnabled ?? payload.smsAlertsEnabled ?? true),
        emailAlertsEnabled: Boolean(payload.emailAlertsEnabled ?? payload.negativeAlertEmailEnabled ?? true),
        googleReviewUrl: payload.googleReviewUrl || null,
      },
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

  const activeBusiness = businesses.find(b => b.negativeAlertPhone || b.aiTone || b.negativeAlertEmail) || businesses[0];

  const updateData: Record<string, any> = {
    updatedAt: new Date(),
    isGoogleConnected: true,
    clerkUserId: userId,
    userId: userId,
    brandVoice: selectedVoice,
    brand_voice: selectedVoice,
    aiTone: selectedVoice,
    ai_tone: selectedVoice,
    aiPersonality: selectedVoice,
    ai_personality: selectedVoice,
  };

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
  const smsEnabled = 
    payload.negativeAlertSmsEnabled ?? 
    payload.smsAlertsEnabled ?? 
    payload.notifySms ?? 
    payload.negativeSmsAlertEnabled ?? 
    payload.enableSmsAlerts;
  if (smsEnabled !== undefined) {
    const isSmsActive = Boolean(smsEnabled);
    updateData.negativeAlertSmsEnabled = isSmsActive;
    updateData.smsAlertsEnabled = isSmsActive;
    updateData.negativeSmsAlertEnabled = isSmsActive;
    updateData.notifyNegativeEnabled = isSmsActive;
    updateData.notify_negative_enabled = isSmsActive;
  }

  const negEmail = payload.negativeAlertEmailEnabled !== undefined
    ? Boolean(payload.negativeAlertEmailEnabled)
    : (payload.negativeEmailAlertEnabled !== undefined ? Boolean(payload.negativeEmailAlertEnabled) : undefined);
  if (negEmail !== undefined) {
    updateData.negativeAlertEmailEnabled = negEmail;
    updateData.negativeEmailAlertEnabled = negEmail;
    updateData.emailAlertsEnabled = negEmail;
    updateData.email_alerts_enabled = negEmail;
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
        aiTone: 'Professional & Warm',
        aiPersonality: 'Professional & Warm',
        brandVoice: 'Professional & Warm',
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
