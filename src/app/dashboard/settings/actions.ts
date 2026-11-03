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

  console.log('--- SAVE SETTINGS ACTION TRIGGERED ---');
  console.log('User auth ID:', userId);
  console.log('Received Payload:', JSON.stringify(payload, null, 2));

  try {
    const profile = await (db as any).profile?.findFirst?.({
      where: { clerkUserId: userId },
    }).catch(() => null);
    const targetUserId = profile?.id || userId;

    // Find the existing settings row first by profile.id, userId, or fallback
    let existingSettings: any = null;
    if (profile?.id) {
      existingSettings = await db.businessSettings.findFirst({
        where: { userId: profile.id },
      }).catch(() => null);
    }

    if (!existingSettings) {
      existingSettings = await db.businessSettings.findFirst({
        where: { userId: userId },
      }).catch(() => null);
    }

    if (!existingSettings) {
      existingSettings = await db.businessSettings.findFirst({
        orderBy: { updatedAt: 'desc' },
      }).catch(() => null);
    }

    if (!existingSettings) {
      try {
        existingSettings = await db.businessSettings.create({
          data: {
            userId: targetUserId,
            brandVoice: payload.brandVoice || payload.aiTone || 'friendly_professional',
            notifyNegativeEmail: payload.negativeAlertEmail || null,
            notifyNegativePhone: payload.negativeAlertPhone || null,
            emailAlertsEnabled: typeof payload.emailAlertsEnabled === 'boolean' ? payload.emailAlertsEnabled : true,
            notifyNegativeEnabled: typeof payload.negativeAlertSmsEnabled === 'boolean' ? payload.negativeAlertSmsEnabled : true,
            googleReviewUrl: payload.googleReviewUrl || null,
          },
        });
      } catch (createErr) {
        console.warn('Could not auto-create businessSettings:', createErr);
      }
    }

    if (!existingSettings?.id) {
      return { success: false, error: `No business_settings record found for user: ${userId}` };
    }

    // Resolve brand voice / tone
    const incomingTone =
      payload.brandVoice ??
      payload.brand_voice ??
      payload.aiTone ??
      payload.ai_tone ??
      payload.tone ??
      payload.selectedTone ??
      payload.aiPersonality ??
      payload.ai_personality;

    const resolvedTone = (incomingTone !== undefined && incomingTone !== null && String(incomingTone).trim() !== '')
      ? String(incomingTone)
      : (payload.brandVoice || payload.aiTone || existingSettings.brandVoice || 'friendly_professional');

    // Robust boolean extraction for negative email alert
    let emailAlertsVal: boolean | undefined = undefined;
    const rawEmailInput =
      payload.emailAlertsEnabled ??
      payload.email_alerts_enabled ??
      payload.negativeAlertEmailEnabled ??
      payload.negativeEmailAlertEnabled;

    if (typeof rawEmailInput === 'boolean') {
      emailAlertsVal = rawEmailInput;
    } else if (typeof rawEmailInput === 'string') {
      emailAlertsVal = rawEmailInput === 'true' || rawEmailInput === 'on' || rawEmailInput === '1';
    }

    // Robust boolean extraction for negative SMS alert
    let smsAlertsVal: boolean | undefined = undefined;
    const rawSmsInput =
      payload.negativeAlertSmsEnabled ??
      payload.notifyNegativeEnabled ??
      payload.smsAlertsEnabled ??
      payload.negativeSmsAlertEnabled ??
      payload.notifySms ??
      payload.enableSmsAlerts;

    if (typeof rawSmsInput === 'boolean') {
      smsAlertsVal = rawSmsInput;
    } else if (typeof rawSmsInput === 'string') {
      smsAlertsVal = rawSmsInput === 'true' || rawSmsInput === 'on' || rawSmsInput === '1';
    }

    const finalNegativeEmail = payload.negativeAlertEmail !== undefined
      ? (payload.negativeAlertEmail || null)
      : (payload.notifyNegativeEmail !== undefined ? (payload.notifyNegativeEmail || null) : existingSettings.notifyNegativeEmail);

    const finalNegativePhone = payload.negativeAlertPhone !== undefined
      ? (payload.negativeAlertPhone || null)
      : (payload.notifyNegativePhone !== undefined ? (payload.notifyNegativePhone || null) : existingSettings.notifyNegativePhone);

    const finalGoogleReviewUrl = payload.googleReviewUrl !== undefined
      ? (payload.googleReviewUrl || null)
      : existingSettings.googleReviewUrl;

    const updated = await db.businessSettings.update({
      where: { id: existingSettings.id },
      data: {
        brandVoice: resolvedTone,
        notifyNegativeEmail: finalNegativeEmail,
        notifyNegativePhone: finalNegativePhone,
        emailAlertsEnabled: emailAlertsVal !== undefined ? emailAlertsVal : existingSettings.emailAlertsEnabled,
        notifyNegativeEnabled: smsAlertsVal !== undefined ? smsAlertsVal : existingSettings.notifyNegativeEnabled,
        googleReviewUrl: finalGoogleReviewUrl,
        updatedAt: new Date(),
      },
    });

    console.log('Successfully updated settings in DB:', updated);

    // Also update businesses table to maintain consistency
    let savedBusiness = null;
    try {
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
      }).catch(() => []);

      const activeBusiness = businesses[0];
      if (activeBusiness) {
        savedBusiness = await db.business.update({
          where: { id: activeBusiness.id },
          data: {
            brandVoice: resolvedTone,
            aiTone: resolvedTone,
            aiPersonality: resolvedTone,
            negativeAlertEmail: finalNegativeEmail,
            notifyNegativeEmail: finalNegativeEmail,
            negativeAlertPhone: finalNegativePhone,
            notifyNegativePhone: finalNegativePhone,
            emailAlertsEnabled: emailAlertsVal !== undefined ? emailAlertsVal : existingSettings.emailAlertsEnabled,
            negativeAlertEmailEnabled: emailAlertsVal !== undefined ? emailAlertsVal : existingSettings.emailAlertsEnabled,
            negativeEmailAlertEnabled: emailAlertsVal !== undefined ? emailAlertsVal : existingSettings.emailAlertsEnabled,
            negativeAlertSmsEnabled: smsAlertsVal !== undefined ? smsAlertsVal : existingSettings.notifyNegativeEnabled,
            smsAlertsEnabled: smsAlertsVal !== undefined ? smsAlertsVal : existingSettings.notifyNegativeEnabled,
            notifyNegativeEnabled: smsAlertsVal !== undefined ? smsAlertsVal : existingSettings.notifyNegativeEnabled,
            googleReviewUrl: finalGoogleReviewUrl,
            reviewUrl: finalGoogleReviewUrl,
            aiInstructions: payload.aiInstructions !== undefined ? payload.aiInstructions : activeBusiness.aiInstructions,
            aiSignature: payload.aiSignature !== undefined ? payload.aiSignature : activeBusiness.aiSignature,
            autoReplyEnabled: payload.autoReplyEnabled !== undefined ? Boolean(payload.autoReplyEnabled) : activeBusiness.autoReplyEnabled,
            selectedModel: payload.selectedModel !== undefined ? payload.selectedModel : activeBusiness.selectedModel,
            smsTemplate: payload.smsTemplate !== undefined ? payload.smsTemplate : activeBusiness.smsTemplate,
            updatedAt: new Date(),
          },
        });
      }
    } catch (bizErr) {
      console.warn('Could not sync businesses table:', bizErr);
    }

    // Set active business cookies
    try {
      const cookieStore = await cookies();
      const cookieBizId = savedBusiness?.id || existingSettings.id;
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
