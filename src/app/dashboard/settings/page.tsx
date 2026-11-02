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
    business = businesses.find(b => b.negativeAlertPhone || b.aiTone || b.negativeAlertEmail) || businesses[0] || null;
  }

  return (
    <SettingsClient 
      key="settings-client"
      initialBusiness={business ? JSON.parse(JSON.stringify(business)) : null} 
    />
  );
}

