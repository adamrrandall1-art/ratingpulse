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

  const business = userId
    ? await db.business.findFirst({
        where: {
          OR: [
            { clerkUserId: userId },
            { userId: userId },
            { id: userId },
          ],
        },
        orderBy: { updatedAt: 'desc' },
      })
    : null;

  return (
    <SettingsClient 
      key="settings-page"
      initialBusiness={business ? JSON.parse(JSON.stringify(business)) : null} 
    />
  );
}
