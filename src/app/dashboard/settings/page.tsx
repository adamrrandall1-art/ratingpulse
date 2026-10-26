import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SettingsPage() {
  const clerkAuth = await auth().catch(() => null);
  const business = clerkAuth?.userId
    ? await db.business.findFirst({
        where: {
          OR: [
            { userId: clerkAuth.userId },
            { clerkUserId: clerkAuth.userId },
          ],
        },
        orderBy: { createdAt: 'desc' },
      })
    : null;

  return (
    <SettingsClient
      key={business?.id || clerkAuth?.userId || 'settings'}
      initialBusiness={business ? JSON.parse(JSON.stringify(business)) : null}
    />
  );
}
