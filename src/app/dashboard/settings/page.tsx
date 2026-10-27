import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

export default async function SettingsPage() {
  const clerkAuth = await auth().catch(() => null);
  const userId = clerkAuth?.userId;

  let business = userId
    ? await db.business.findFirst({
        where: {
          OR: [
            { userId: userId },
            { clerkUserId: userId },
          ],
        },
        orderBy: { createdAt: 'desc' },
      })
    : null;

  if (!business) {
    const cookieStore = await cookies().catch(() => null);
    const activeId =
      cookieStore?.get('activeBusinessId')?.value ||
      cookieStore?.get('rp_active_business_id')?.value;
    if (activeId) {
      business = await db.business.findFirst({
        where: { id: activeId },
        orderBy: { createdAt: 'desc' },
      });
    }
  }

  const serializedBusiness = business ? JSON.parse(JSON.stringify(business)) : null;

  const initialNotificationSettings = business
    ? {
        negativeAlertEmail: business.negativeAlertEmail || '',
        negativeAlertPhone: business.negativeAlertPhone || '',
        positiveAlertEmail: business.positiveAlertEmail || '',
        positiveAlertPhone: business.positiveAlertPhone || '',
        negativeAlertsEnabled: business.negativeAlertsEnabled ?? true,
        negativeEmailAlertEnabled: business.negativeEmailAlertEnabled ?? true,
        negativeSmsAlertEnabled: business.negativeSmsAlertEnabled ?? false,
        positiveAlertsEnabled: business.positiveAlertsEnabled ?? true,
        positiveEmailAlertEnabled: business.positiveEmailAlertEnabled ?? true,
        positiveSmsAlertEnabled: business.positiveSmsAlertEnabled ?? false,
      }
    : null;

  return (
    <SettingsClient
      key={business?.id ? `${business.id}_${business.updatedAt ? String(business.updatedAt) : ''}` : (userId || 'settings')}
      initialBusiness={serializedBusiness}
      initialNotificationSettings={initialNotificationSettings}
    />
  );
}
