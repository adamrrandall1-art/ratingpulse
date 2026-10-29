'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
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
  brandVoice?: string | null;
  aiInstructions?: string | null;
  aiSignature?: string | null;
  autoReplyEnabled?: boolean;
  autoPublish5Star?: boolean;
  selectedModel?: string | null;
  customKeywords?: string | string[] | null;
  keywords?: string[];
  smsTemplate?: string | null;
  negativeAlertsEnabled?: boolean;
  negativeEmailAlertEnabled?: boolean;
  negativeAlertSmsEnabled?: boolean;
  smsAlertsEnabled?: boolean;
  negativeSmsAlertEnabled?: boolean;
  notifySms?: boolean;
  enableSmsAlerts?: boolean;
  negativeAlertEmailEnabled?: boolean;
  positiveAlertsEnabled?: boolean;
  positiveEmailAlertEnabled?: boolean;
  positiveSmsAlertEnabled?: boolean;
  positiveAlertSmsEnabled?: boolean;
  positiveAlertEmailEnabled?: boolean;
}) {
  const clerkAuth = await auth().catch(() => null);
  const userId = clerkAuth?.userId;
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // 1. Find the existing business for this user using canonical OR conditions
  let business = await db.business.findFirst({
    where: {
      OR: [
        { clerkUserId: userId },
        { userId: userId },
        { id: userId },
      ],
    },
    orderBy: { updatedAt: 'desc' },
  });

  const updateData: Record<string, any> = {
    updatedAt: new Date(),
    isGoogleConnected: true,
    clerkUserId: userId,
    userId: userId,
  };

  // Text fields
  if (payload.negativeAlertEmail !== undefined) updateData.negativeAlertEmail = payload.negativeAlertEmail || null;
  if (payload.negativeAlertPhone !== undefined) updateData.negativeAlertPhone = payload.negativeAlertPhone || null;
  if (payload.positiveAlertEmail !== undefined) updateData.positiveAlertEmail = payload.positiveAlertEmail || null;
  if (payload.positiveAlertPhone !== undefined) updateData.positiveAlertPhone = payload.positiveAlertPhone || null;
  if (payload.googleReviewUrl !== undefined) updateData.googleReviewUrl = payload.googleReviewUrl;

  const tone = payload.aiTone !== undefined ? payload.aiTone : payload.brandVoice;
  if (tone !== undefined) {
    updateData.aiTone = tone;
    updateData.brandVoice = tone;
  }

  if (payload.aiInstructions !== undefined) updateData.aiInstructions = payload.aiInstructions;
  if (payload.aiSignature !== undefined) updateData.aiSignature = payload.aiSignature;

  const autoReply = payload.autoReplyEnabled !== undefined ? payload.autoReplyEnabled : payload.autoPublish5Star;
  if (autoReply !== undefined) {
    updateData.autoReplyEnabled = autoReply;
    updateData.autoPublish5Star = autoReply;
  }

  if (payload.selectedModel !== undefined) updateData.selectedModel = payload.selectedModel;

  const kw = payload.customKeywords !== undefined ? payload.customKeywords : payload.keywords;
  if (kw !== undefined) {
    updateData.customKeywords = Array.isArray(kw) ? kw.join(',') : kw;
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
  }

  const negEmail = payload.negativeAlertEmailEnabled !== undefined
    ? Boolean(payload.negativeAlertEmailEnabled)
    : (payload.negativeEmailAlertEnabled !== undefined ? Boolean(payload.negativeEmailAlertEnabled) : undefined);
  if (negEmail !== undefined) {
    updateData.negativeAlertEmailEnabled = negEmail;
    updateData.negativeEmailAlertEnabled = negEmail;
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

  // Upsert guaranteeing we update the existing row if found
  const recordId = business?.id || payload.businessId || userId;
  console.log('[SERVER ACTION] saveAllSettingsAction targeting recordId:', recordId, 'userId:', userId);

  const saved = await db.business.upsert({
    where: { id: recordId },
    update: {
      ...updateData,
      clerkUserId: userId,
      userId: userId,
    },
    create: {
      id: recordId,
      userId: userId,
      clerkUserId: userId,
      ...updateData,
    },
  });

  // Synchronize duplicate rows for this user without clearing columns
  try {
    const businesses = await db.business.findMany({
      where: {
        OR: [{ userId }, { clerkUserId: userId }, { id: userId }],
      },
      orderBy: { updatedAt: 'desc' },
    });
    if (businesses.length > 1) {
      for (const dup of businesses) {
        if (dup.id !== saved.id) {
          await db.business.update({
            where: { id: dup.id },
            data: {
              ...updateData,
              clerkUserId: userId,
              userId: userId,
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
