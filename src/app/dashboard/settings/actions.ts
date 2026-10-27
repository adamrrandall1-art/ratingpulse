'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';

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

  // 1. Locate primary business owned by this user
  let business = await db.business.findFirst({
    where: {
      OR: [
        { userId: userId },
        { clerkUserId: userId },
      ],
    },
    orderBy: { createdAt: 'desc' },
  });

  if (!business) {
    try {
      const cookieStore = await cookies();
      const activeId =
        cookieStore.get('activeBusinessId')?.value ||
        cookieStore.get('rp_active_business_id')?.value;
      if (activeId) {
        business = await db.business.findFirst({
          where: { id: activeId },
          orderBy: { createdAt: 'desc' },
        });
      }
    } catch {}
  }

  const payload: Record<string, any> = {
    googleReviewUrl,
    reviewUrl: googleReviewUrl,
    isGoogleConnected: true,
    google_connected: true,
    updatedAt: new Date(),
  };

  if (negativeAlertEmail !== null) payload.negativeAlertEmail = negativeAlertEmail;
  if (negativeAlertPhone !== null) payload.negativeAlertPhone = negativeAlertPhone;
  if (positiveAlertEmail !== null) payload.positiveAlertEmail = positiveAlertEmail;
  if (positiveAlertPhone !== null) payload.positiveAlertPhone = positiveAlertPhone;

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

  let savedBusiness;
  if (business) {
    savedBusiness = await db.business.update({
      where: { id: business.id },
      data: {
        ...payload,
        userId: userId,
        clerkUserId: userId,
      },
    });
  } else {
    // Create new business record tied directly to Clerk userId
    savedBusiness = await db.business.create({
      data: {
        ...payload,
        userId: userId,
        clerkUserId: userId,
        name: 'RatingPulse Business',
      },
    });
  }

  // 2. Set active business cookie for layout/context readers
  try {
    const cookieStore = await cookies();
    cookieStore.set('activeBusinessId', savedBusiness.id, { path: '/', maxAge: 60 * 60 * 24 * 365 });
    cookieStore.set('rp_active_business_id', savedBusiness.id, { path: '/', maxAge: 60 * 60 * 24 * 365 });
  } catch (e) {
    console.error('Cookie set error:', e);
  }

  // 3. Purge server caches
  revalidatePath('/', 'layout');
  revalidatePath('/dashboard', 'layout');
  revalidatePath('/dashboard/settings');
  revalidatePath('/dashboard/businesses');
  revalidatePath('/dashboard/invites');

  return { success: true, business: savedBusiness };
}
