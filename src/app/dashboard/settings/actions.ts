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

  // Handle both FormData and plain object body
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

  const { negativeAlertEmail, negativeAlertPhone, positiveAlertEmail, positiveAlertPhone } = body;
  const rawGoogleReviewUrl = body.googleReviewUrl || 'https://g.page/r/Cc5qbA6YaZ6-EBM/review';
  const googleReviewUrl = typeof rawGoogleReviewUrl === 'string' && rawGoogleReviewUrl.includes('http')
    ? (rawGoogleReviewUrl.match(/https?:\/\/[^\s)\]]+/)?.[0] || rawGoogleReviewUrl)
    : rawGoogleReviewUrl;

  console.log('[SERVER ACTION] Received save request:', {
    userId,
    negativeAlertEmail,
    negativeAlertPhone,
    positiveAlertEmail,
    positiveAlertPhone,
  });

  // 1. Locate primary business owned by this user
  let business = await db.business.findFirst({
    where: {
      OR: [
        { userId: userId },
        { clerkUserId: userId },
      ],
    },
    orderBy: { updatedAt: 'desc' },
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
          orderBy: { updatedAt: 'desc' },
        });
      }
    } catch {}
  }

  const payload: Record<string, any> = {
    negativeAlertEmail: negativeAlertEmail || null,
    negativeAlertPhone: negativeAlertPhone || null,
    positiveAlertEmail: positiveAlertEmail || null,
    positiveAlertPhone: positiveAlertPhone || null,
    googleReviewUrl,
    reviewUrl: googleReviewUrl,
    isGoogleConnected: true,
    google_connected: true,
    updatedAt: new Date(),
  };

  const getBool = (key: string) => {
    const val = body[key];
    if (val === null || val === undefined) return undefined;
    if (typeof val === 'string') {
      return val === 'true' || val === '1' || val === 'on';
    }
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

  const brandVoice = body.brandVoice;
  if (brandVoice) payload.brandVoice = brandVoice;

  const smsTemplate = body.smsTemplate;
  if (smsTemplate) payload.smsTemplate = smsTemplate;

  const autoPublish5Star = getBool('autoPublish5Star');
  if (autoPublish5Star !== undefined) payload.autoPublish5Star = autoPublish5Star;

  const businessId = business?.id || userId;

  const savedBusiness = await db.business.upsert({
    where: { id: businessId },
    update: {
      negativeAlertEmail: negativeAlertEmail || null,
      negativeAlertPhone: negativeAlertPhone || null,
      positiveAlertEmail: positiveAlertEmail || null,
      positiveAlertPhone: positiveAlertPhone || null,
      isGoogleConnected: true,
      updatedAt: new Date(),
      ...payload,
      userId: userId,
      clerkUserId: userId,
    },
    create: {
      id: businessId,
      userId: userId,
      clerkUserId: userId,
      name: business?.name || 'RatingPulse Business',
      negativeAlertEmail: negativeAlertEmail || null,
      negativeAlertPhone: negativeAlertPhone || null,
      positiveAlertEmail: positiveAlertEmail || null,
      positiveAlertPhone: positiveAlertPhone || null,
      isGoogleConnected: true,
      ...payload,
    },
  });

  const updated = savedBusiness;
  console.log('[SERVER ACTION] Prisma upsert success:', updated);

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
