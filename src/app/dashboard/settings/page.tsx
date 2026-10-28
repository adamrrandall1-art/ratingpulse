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

  if (!userId) {
    return (
      <SettingsClient 
        key="settings-unauth"
        initialBusiness={null} 
      />
    );
  }

  // Fetch all rows belonging to this user
  const businesses = await db.business.findMany({
    where: {
      OR: [
        { userId },
        { clerkUserId: userId },
        { id: userId },
      ],
    },
    orderBy: { updatedAt: 'desc' },
  });

  // Pick the record that actually has saved alert settings or AI persona settings, or the newest one
  let activeBusiness: any =
    businesses.find(b => b.negativeAlertEmail || b.negativeAlertPhone || b.brandVoice || b.aiTone || b.aiInstructions) ||
    businesses[0] ||
    null;

  if (!activeBusiness) {
    const cookieStore = await cookies().catch(() => null);
    const activeId =
      cookieStore?.get('activeBusinessId')?.value ||
      cookieStore?.get('rp_active_business_id')?.value;
    if (activeId) {
      activeBusiness = await db.business.findFirst({
        where: { id: activeId },
        orderBy: { updatedAt: 'desc' },
      });
    }
  }

  return (
    <SettingsClient 
      key={activeBusiness?.id || 'settings-active'}
      initialBusiness={activeBusiness ? JSON.parse(JSON.stringify(activeBusiness)) : null} 
    />
  );
}
