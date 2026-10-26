'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';

export async function saveSettingsAction(formData: FormData) {
  const clerkAuth = await auth().catch(() => null);
  const userId = clerkAuth?.userId;

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const getVal = (key: string) => {
    if (formData instanceof FormData) {
      return formData.get(key)?.toString().trim() || null;
    }
    return (formData as any)?.[key]?.toString?.().trim?.() || null;
  };

  const negativeAlertEmail = getVal('negativeAlertEmail');
  const negativeAlertPhone = getVal('negativeAlertPhone');
  const positiveAlertEmail = getVal('positiveAlertEmail');
  const positiveAlertPhone = getVal('positiveAlertPhone');
  const rawGoogleReviewUrl = getVal('googleReviewUrl') || 'https://g.page/r/Cc5qbA6YaZ6-EBM/review';
  const googleReviewUrl = rawGoogleReviewUrl.includes('http')
    ? (rawGoogleReviewUrl.match(/https?:\/\/[^\s)\]]+/)?.[0] || rawGoogleReviewUrl)
    : rawGoogleReviewUrl;

  // 1. Locate business by Clerk userId
  let business = await db.business.findFirst({
    where: {
      OR: [
        { userId: userId },
        { clerkUserId: userId },
      ],
    },
  });

  const payload: Record<string, any> = {
    negativeAlertEmail,
    negativeAlertPhone,
    positiveAlertEmail,
    positiveAlertPhone,
    googleReviewUrl,
    reviewUrl: googleReviewUrl,
    isGoogleConnected: true,
    updatedAt: new Date(),
  };

  const getBool = (key: string) => {
    if (formData instanceof FormData) {
      const val = formData.get(key);
      if (val === null || val === undefined) return undefined;
      return val === 'true' || val === '1' || val === 'on';
    }
    const val = (formData as any)?.[key];
    if (val === null || val === undefined) return undefined;
    return Boolean(val);
  };

  const negAlerts = getBool('negativeAlertsEnabled');
  if (negAlerts !== undefined) payload.negativeAlertsEnabled = negAlerts;

  const negEmail = getBool('negativeEmailAlertEnabled');
  if (negEmail !== undefined) payload.negativeEmailAlertEnabled = negEmail;

  const negSms = getBool('negativeSmsAlertEnabled');
  if (negSms !== undefined) payload.negativeSmsAlertEnabled = negSms;

  const posAlerts = getBool('positiveAlertsEnabled');
  if (posAlerts !== undefined) payload.positiveAlertsEnabled = posAlerts;

  const posEmail = getBool('positiveEmailAlertEnabled');
  if (posEmail !== undefined) payload.positiveEmailAlertEnabled = posEmail;

  const posSms = getBool('positiveSmsAlertEnabled');
  if (posSms !== undefined) payload.positiveSmsAlertEnabled = posSms;

  const brandVoice = getVal('brandVoice');
  if (brandVoice) payload.brandVoice = brandVoice;

  const smsTemplate = getVal('smsTemplate');
  if (smsTemplate) payload.smsTemplate = smsTemplate;

  const autoPublish5Star = getBool('autoPublish5Star');
  if (autoPublish5Star !== undefined) payload.autoPublish5Star = autoPublish5Star;

  if (business) {
    await db.business.update({
      where: { id: business.id },
      data: payload,
    });
  } else {
    await db.business.create({
      data: {
        ...payload,
        userId: userId,
        name: 'RatingPulse Business',
      },
    });
  }

  revalidatePath('/dashboard', 'layout');
  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard/invites');

  return { success: true };
}
