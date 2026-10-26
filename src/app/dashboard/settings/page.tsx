import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import { cookies } from 'next/headers';
import SettingsClient from './SettingsClient';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export default async function SettingsPage() {
  const clerkAuth = await auth().catch(() => null);
  const userId = clerkAuth?.userId;

  let business = null;
  if (userId) {
    business = await db.business.findFirst({
      where: {
        OR: [
          { userId: userId },
          { clerkUserId: userId },
        ],
      },
    });
  }

  if (!business) {
    const cookieStore = await cookies().catch(() => null);
    const activeId =
      cookieStore?.get('activeBusinessId')?.value ||
      cookieStore?.get('rp_active_business_id')?.value;
    if (activeId) {
      business = await db.business.findFirst({
        where: { id: activeId },
      });
    }
  }

  const serializedBusiness = business ? JSON.parse(JSON.stringify(business)) : null;

  return (
    <SettingsClient
      key={serializedBusiness?.id || userId || 'settings'}
      initialBusiness={serializedBusiness}
    />
  );
}
