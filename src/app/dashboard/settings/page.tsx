import { getOrCreateUserSession } from '@/lib/auth-sync';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function SettingsPage() {
  const session = await getOrCreateUserSession();
  if (!session) redirect('/sign-in');

  const { settings, profile, clerkUserId } = session;

  let business: any = null;

  try {
    const targetUserId = profile?.id || clerkUserId;
    const businesses = await db.business.findMany({
      where: {
        OR: [
          { clerkUserId: clerkUserId },
          { userId: targetUserId },
          { userId: clerkUserId },
          { id: targetUserId },
          { id: clerkUserId },
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

  // Pass settings ID explicitly so actions can update the EXACT primary key row
  const safeSettings = {
    id: settings?.id || '',
    userId: profile?.id || clerkUserId,
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
      initialProfile={profile ? JSON.parse(JSON.stringify(profile)) : null}
      settingsId={settings?.id}
    />
  );
}

