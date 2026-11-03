import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function SettingsPage() {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in');
  }

  let settings: any = null;
  let business: any = null;

  try {
    // 1. Try finding profile by clerkUserId
    const profile = await (db as any).profile?.findFirst?.({
      where: { clerkUserId: userId },
    }).catch(() => null);

    // 2. Fetch business_settings using profile ID, or clerk ID, or most recent record fallback
    if (profile?.id) {
      settings = await db.businessSettings.findFirst({
        where: { userId: profile.id },
      }).catch(() => null);
    }

    if (!settings) {
      settings = await db.businessSettings.findFirst({
        where: { userId: userId },
      }).catch(() => null);
    }

    // 3. Fallback to first available record if still testing single user
    if (!settings) {
      settings = await db.businessSettings.findFirst({
        orderBy: { updatedAt: 'desc' },
      }).catch(() => null);
    }

    // Safely resolve user's businesses
    const targetUserId = profile?.id || userId;
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

    business = businesses.find(b => b.negativeAlertPhone || b.aiTone || b.negativeAlertEmail || b.brandVoice) || businesses[0] || null;

    if (business && settings) {
      const effectiveTone = settings.brandVoice || settings.brand_voice || business.brandVoice || business.brand_voice || business.aiPersonality || business.aiTone;
      if (effectiveTone) {
        business.brandVoice = effectiveTone;
        business.brand_voice = effectiveTone;
        business.aiTone = effectiveTone;
        business.aiPersonality = effectiveTone;
      }
      if (settings.notifyNegativePhone) {
        business.negativeAlertPhone = settings.notifyNegativePhone;
        business.notifyNegativePhone = settings.notifyNegativePhone;
      }
      if (settings.notifyNegativeEmail) {
        business.negativeAlertEmail = settings.notifyNegativeEmail;
        business.notifyNegativeEmail = settings.notifyNegativeEmail;
      }
      if (settings.notifyNegativeEnabled !== undefined && settings.notifyNegativeEnabled !== null) {
        const smsVal = typeof settings.notifyNegativeEnabled === 'boolean'
          ? settings.notifyNegativeEnabled
          : (settings.notifyNegativeEnabled === 'true' || settings.notifyNegativeEnabled === 'on');
        business.negativeAlertSmsEnabled = smsVal;
        business.smsAlertsEnabled = smsVal;
      }
      if (settings.emailAlertsEnabled !== undefined && settings.emailAlertsEnabled !== null) {
        const emailVal = typeof settings.emailAlertsEnabled === 'boolean'
          ? settings.emailAlertsEnabled
          : (settings.emailAlertsEnabled === 'true' || settings.emailAlertsEnabled === 'on');
        business.negativeAlertEmailEnabled = emailVal;
        business.negativeEmailAlertEnabled = emailVal;
        business.emailAlertsEnabled = emailVal;
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
  } catch (error) {
    console.error('Error fetching settings on server:', error);
  }

  // Provide clean default values if settings is still null to prevent UI render crashes:
  const safeSettings = {
    id: settings?.id || '',
    brandVoice: settings?.brandVoice || settings?.brand_voice || 'friendly_professional',
    notifyNegativePhone: settings?.notifyNegativePhone || settings?.notify_negative_phone || '',
    notifyNegativeEmail: settings?.notifyNegativeEmail || settings?.notify_negative_email || '',
    emailAlertsEnabled: settings?.emailAlertsEnabled ?? settings?.email_alerts_enabled ?? true,
    notifyNegativeEnabled: settings?.notifyNegativeEnabled ?? settings?.notify_negative_enabled ?? true,
    googleReviewUrl: settings?.googleReviewUrl || settings?.google_review_url || '',
    placeId: settings?.placeId || settings?.place_id || '',
    businessName: settings?.businessName || settings?.business_name || '',
  };

  return (
    <SettingsClient 
      key="settings-client"
      initialBusiness={business ? JSON.parse(JSON.stringify(business)) : null} 
      initialSettings={safeSettings}
    />
  );
}

