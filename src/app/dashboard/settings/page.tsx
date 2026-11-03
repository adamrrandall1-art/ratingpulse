import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function SettingsPage() {
  await cookies().catch(() => null);
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  const profile = await (db as any).profile.findFirst({
    where: { clerkUserId: userId },
  });
  const targetUserId = profile?.id || userId;

  let settings = await db.businessSettings.findFirst({
    where: { userId: targetUserId },
  });

  // If a brand new user doesn't have a settings record yet, create their default row:
  if (!settings) {
    settings = await db.businessSettings.create({
      data: {
        userId: targetUserId,
        brandVoice: 'friendly_professional',
        notifyNegativeEnabled: true,
        emailAlertsEnabled: true,
      },
    });
  }

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
  const business = businesses.find(b => b.negativeAlertPhone || b.aiTone || b.negativeAlertEmail || b.brandVoice) || businesses[0] || null;

  if (business && settings) {
    let effectiveTone = settings.brandVoice || (settings as any).brand_voice;
    if (!effectiveTone || (effectiveTone === 'friendly_professional' && (business.brandVoice || business.aiTone || business.aiPersonality) && (business.brandVoice || business.aiTone || business.aiPersonality) !== 'friendly_professional')) {
      effectiveTone = business.brandVoice || business.brand_voice || business.aiPersonality || business.aiTone || effectiveTone;
    }
    if (effectiveTone) {
      business.brandVoice = effectiveTone;
      business.brand_voice = effectiveTone;
      business.aiTone = effectiveTone;
      business.aiPersonality = effectiveTone;
      settings.brandVoice = effectiveTone;
      (settings as any).brand_voice = effectiveTone;
    }
    if (settings.notifyNegativePhone) {
      business.negativeAlertPhone = settings.notifyNegativePhone;
      business.notifyNegativePhone = settings.notifyNegativePhone;
    }
    if (settings.notifyNegativeEmail) {
      business.negativeAlertEmail = settings.notifyNegativeEmail;
      business.notifyNegativeEmail = settings.notifyNegativeEmail;
    }
    if (settings.notifyNegativeEnabled !== undefined) {
      business.negativeAlertSmsEnabled = settings.notifyNegativeEnabled;
      business.smsAlertsEnabled = settings.notifyNegativeEnabled;
    }
    if (settings.emailAlertsEnabled !== undefined) {
      business.negativeAlertEmailEnabled = settings.emailAlertsEnabled;
      business.emailAlertsEnabled = settings.emailAlertsEnabled;
    }
    if (settings.googleReviewUrl) {
      business.googleReviewUrl = settings.googleReviewUrl;
      business.reviewUrl = settings.googleReviewUrl;
    }
    if (settings.placeId) {
      business.placeId = settings.placeId;
    }
    if (settings.businessName) {
      business.name = settings.businessName;
    }
  }

  return (
    <SettingsClient 
      key="settings-client"
      initialBusiness={business ? JSON.parse(JSON.stringify(business)) : null} 
      initialSettings={settings ? JSON.parse(JSON.stringify(settings)) : null}
    />
  );
}

