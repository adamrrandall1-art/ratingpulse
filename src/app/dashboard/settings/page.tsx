import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function SettingsPage() {
  await cookies().catch(() => null);
  const clerkAuth = await auth().catch(() => null);
  const userId = clerkAuth?.userId;

  let business = null;
  let businessSettings = null;
  if (userId) {
    const businesses = await db.business.findMany({
      where: {
        OR: [
          { clerkUserId: userId },
          { userId: userId },
          { id: userId },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });
    business = businesses.find(b => b.negativeAlertPhone || b.aiTone || b.negativeAlertEmail || b.brandVoice) || businesses[0] || null;

    try {
      businessSettings = await db.businessSettings.findFirst({
        where: {
          OR: [
            { userId },
            { id: userId },
          ],
        },
      });
    } catch {}

    if (business && businessSettings) {
      if (businessSettings.brandVoice) {
        business.brandVoice = businessSettings.brandVoice;
        business.brand_voice = businessSettings.brandVoice;
      }
      if (businessSettings.notifyNegativePhone) {
        business.negativeAlertPhone = businessSettings.notifyNegativePhone;
        business.notifyNegativePhone = businessSettings.notifyNegativePhone;
      }
      if (businessSettings.notifyNegativeEmail) {
        business.negativeAlertEmail = businessSettings.notifyNegativeEmail;
        business.notifyNegativeEmail = businessSettings.notifyNegativeEmail;
      }
      if (businessSettings.notifyNegativeEnabled !== undefined) {
        business.negativeAlertSmsEnabled = businessSettings.notifyNegativeEnabled;
        business.smsAlertsEnabled = businessSettings.notifyNegativeEnabled;
      }
      if (businessSettings.emailAlertsEnabled !== undefined) {
        business.negativeAlertEmailEnabled = businessSettings.emailAlertsEnabled;
        business.emailAlertsEnabled = businessSettings.emailAlertsEnabled;
      }
    }
  }

  return (
    <SettingsClient 
      key="settings-client"
      initialBusiness={business ? JSON.parse(JSON.stringify(business)) : null} 
      initialSettings={businessSettings ? JSON.parse(JSON.stringify(businessSettings)) : null}
    />
  );
}

