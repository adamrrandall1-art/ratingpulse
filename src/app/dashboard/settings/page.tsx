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

  const posPhone = profile?.notifyPositivePhone || profile?.notify_positive_phone || business?.positiveAlertPhone || '';
  const posSms = Boolean(profile?.notifyPositiveSms ?? profile?.notify_positive_sms ?? business?.positiveAlertSmsEnabled);

  const safeSettings = {
    id: settings?.id || '',
    userId: profile?.id || settings?.userId || '',
    brandVoice: settings?.brandVoice || business?.brandVoice || business?.aiTone || 'friendly_professional',
    googleReviewUrl: settings?.googleReviewUrl || business?.googleReviewUrl || '',
    placeId: settings?.placeId || business?.placeId || '',
    businessName: settings?.businessName || business?.name || '',
    // Negative Review Alerts (business_settings)
    notifyNegativePhone: settings?.notifyNegativePhone || business?.negativeAlertPhone || '',
    notifyNegativeEmail: settings?.notifyNegativeEmail || business?.negativeAlertEmail || '',
    emailAlertsEnabled: settings?.emailAlertsEnabled ?? business?.emailAlertsEnabled ?? true,
    notifyNegativeEnabled: settings?.notifyNegativeEnabled ?? business?.negativeAlertSmsEnabled ?? true,
    // Positive Review Alerts (profiles)
    notifyPositivePhone: posPhone,
    notifyPositiveSms: posSms,
    positiveAlertPhone: posPhone,
    positiveAlertSmsEnabled: posSms,
  };

  if (business) {
    business.positiveAlertPhone = safeSettings.notifyPositivePhone;
    business.positiveAlertSmsEnabled = safeSettings.notifyPositiveSms;
  }

  if (!business) {
    business = {
      id: settings?.id || profile?.id || clerkUserId,
      userId: profile?.id || clerkUserId,
      clerkUserId: clerkUserId,
      name: settings?.businessName || profile?.business_name || 'My Business',
      brandVoice: safeSettings.brandVoice,
      aiTone: safeSettings.brandVoice,
      aiPersonality: safeSettings.brandVoice,
      negativeAlertEmail: safeSettings.notifyNegativeEmail,
      notifyNegativeEmail: safeSettings.notifyNegativeEmail,
      negativeAlertPhone: safeSettings.notifyNegativePhone,
      notifyNegativePhone: safeSettings.notifyNegativePhone,
      emailAlertsEnabled: safeSettings.emailAlertsEnabled,
      negativeAlertEmailEnabled: safeSettings.emailAlertsEnabled,
      negativeEmailAlertEnabled: safeSettings.emailAlertsEnabled,
      negativeAlertSmsEnabled: safeSettings.notifyNegativeEnabled,
      smsAlertsEnabled: safeSettings.notifyNegativeEnabled,
      googleReviewUrl: safeSettings.googleReviewUrl,
      placeId: safeSettings.placeId,
      positiveAlertPhone: safeSettings.notifyPositivePhone,
      positiveAlertSmsEnabled: safeSettings.notifyPositiveSms,
    };
  }

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

