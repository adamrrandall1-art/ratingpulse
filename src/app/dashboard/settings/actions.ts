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
    return { success: false, error: 'Unauthorized' };
  }

  console.log('--- SAVING SETTINGS ---', payload);

  try {
    const targetId = payload.settingsId || payload.id;
    let record: any = null;

    if (targetId) {
      record = await db.businessSettings.findUnique({ where: { id: targetId } }).catch(() => null);
    }
    if (!record) {
      record = await db.businessSettings.findFirst({ orderBy: { updatedAt: 'desc' } }).catch(() => null);
    }
    if (!record) {
      throw new Error('No record found to update');
    }

    const updated = await db.businessSettings.update({
      where: { id: record.id },
      data: {
        brandVoice: payload.brandVoice || payload.aiTone,
        notifyNegativePhone: payload.negativeAlertPhone ?? payload.notifyNegativePhone ?? '',
        notifyNegativeEmail: payload.negativeAlertEmail ?? payload.notifyNegativeEmail ?? '',
        emailAlertsEnabled: Boolean(payload.emailAlertsEnabled),
        notifyNegativeEnabled: Boolean(payload.negativeAlertSmsEnabled ?? payload.notifyNegativeEnabled),
        googleReviewUrl: payload.googleReviewUrl || undefined,
        updatedAt: new Date(),
      },
    });

    console.log('DB Updated Successfully:', updated);

    // Also update businesses table to maintain consistency
    let savedBusiness = null;
    try {
      const businesses = await db.business.findMany({
        where: {
          OR: [
            { clerkUserId: userId },
            { id: record.id },
            { userId },
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
            aiInstructions: payload.aiInstructions !== undefined ? payload.aiInstructions : activeBusiness.aiInstructions,
            aiSignature: payload.aiSignature !== undefined ? payload.aiSignature : activeBusiness.aiSignature,
            autoReplyEnabled: payload.autoReplyEnabled !== undefined ? Boolean(payload.autoReplyEnabled) : activeBusiness.autoReplyEnabled,
            selectedModel: payload.selectedModel !== undefined ? payload.selectedModel : activeBusiness.selectedModel,
            smsTemplate: payload.smsTemplate !== undefined ? payload.smsTemplate : activeBusiness.smsTemplate,
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

    return { success: true, settings: updated, business: savedBusiness || updated };
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
