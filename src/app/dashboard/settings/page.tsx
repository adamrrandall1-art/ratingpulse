import { auth } from '@clerk/nextjs/server';
import { cookies } from 'next/headers';
import { db } from '@/lib/db';
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
          { userId },
          { clerkUserId: userId },
        ],
      },
      orderBy: { createdAt: 'desc' },
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
        orderBy: { createdAt: 'desc' },
      });
    }
  }

  return (
    <SettingsClient 
      initialBusiness={business ? JSON.parse(JSON.stringify(business)) : null} 
    />
  );
}
