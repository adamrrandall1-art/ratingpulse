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
  negativeSmsAlertEnabled?: boolean;
  positiveAlertsEnabled?: boolean;
  positiveEmailAlertEnabled?: boolean;
  positiveSmsAlertEnabled?: boolean;
}) {
  const clerkAuth = await auth().catch(() => null);
  const userId = clerkAuth?.userId;
  if (!userId) {
    throw new Error('Unauthorized');
  }

  // Find the definitive business row
  let targetBusiness = null;
  if (payload.businessId && payload.businessId !== 'undefined' && payload.businessId !== 'null' && !payload.businessId.startsWith('user_')) {
    targetBusiness = await db.business.findUnique({
      where: { id: payload.businessId },
    });
  }

  if (!targetBusiness) {
    targetBusiness = await db.business.findFirst({
      where: {
        OR: [{ userId }, { clerkUserId: userId }, { id: userId }],
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  const businessId = targetBusiness?.id || payload.businessId || userId;

  // Construct data payload ONLY with defined keys (never overwrite with undefined)
  const updateData: Record<string, any> = {
    updatedAt: new Date(),
    isGoogleConnected: true,
  };

  if (payload.negativeAlertEmail !== undefined) updateData.negativeAlertEmail = payload.negativeAlertEmail;
  if (payload.negativeAlertPhone !== undefined) updateData.negativeAlertPhone = payload.negativeAlertPhone;
  if (payload.positiveAlertEmail !== undefined) updateData.positiveAlertEmail = payload.positiveAlertEmail;
  if (payload.positiveAlertPhone !== undefined) updateData.positiveAlertPhone = payload.positiveAlertPhone;
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
  if (payload.negativeEmailAlertEnabled !== undefined) updateData.negativeEmailAlertEnabled = payload.negativeEmailAlertEnabled;
  if (payload.negativeSmsAlertEnabled !== undefined) updateData.negativeSmsAlertEnabled = payload.negativeSmsAlertEnabled;
  if (payload.positiveAlertsEnabled !== undefined) updateData.positiveAlertsEnabled = payload.positiveAlertsEnabled;
  if (payload.positiveEmailAlertEnabled !== undefined) updateData.positiveEmailAlertEnabled = payload.positiveEmailAlertEnabled;
  if (payload.positiveSmsAlertEnabled !== undefined) updateData.positiveSmsAlertEnabled = payload.positiveSmsAlertEnabled;

  console.log('[SERVER ACTION] saveAllSettingsAction payload:', {
    businessId,
    updateData,
  });

  const updated = await db.business.upsert({
    where: { id: businessId },
    update: updateData,
    create: {
      id: businessId,
      userId,
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
        if (dup.id !== updated.id) {
          await db.business.update({
            where: { id: dup.id },
            data: updateData,
          }).catch(() => null);
        }
      }
    }
  } catch {}

  // Set active business cookies
  try {
    const cookieStore = await cookies();
    cookieStore.set('activeBusinessId', updated.id, { path: '/', maxAge: 60 * 60 * 24 * 365 });
    cookieStore.set('rp_active_business_id', updated.id, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  } catch {}

  revalidatePath('/dashboard', 'layout');
  revalidatePath('/dashboard/settings');

  return { success: true, business: updated };
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
