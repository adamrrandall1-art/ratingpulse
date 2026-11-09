export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';
import ReportsClientView from './ReportsClientView';

export default async function ReportsPage() {
  let invites: any[] = [];
  try {
    const clerkAuth = await auth().catch(() => null);
    const userId = clerkAuth?.userId;

    if (userId) {
      let profileId: string | null = null;
      try {
        const profile = await db.profile.findFirst({
          where: {
            OR: [
              { clerkUserId: userId },
              { clerk_user_id: userId },
              { id: userId },
            ],
          },
        });
        if (profile?.id) profileId = profile.id;
      } catch {}

      const businesses = await db.business.findMany({
        where: {
          OR: [
            { userId },
            { clerkUserId: userId },
            { id: userId },
            ...(profileId ? [{ userId: profileId }, { clerkUserId: profileId }, { id: profileId }] : []),
          ],
        },
        orderBy: { updatedAt: 'desc' },
      }).catch(() => []);
      const business = businesses.find(b => b.negativeAlertPhone || b.aiTone || b.negativeAlertEmail) || businesses[0] || null;

      const orConditions: any[] = [
        { userId },
        { user_id: userId },
      ];
      if (profileId) {
        orConditions.push({ userId: profileId });
        orConditions.push({ user_id: profileId });
      }
      if (business?.id) {
        orConditions.push({ businessId: business.id });
        orConditions.push({ business_id: business.id });
      }

      invites = await db.reviewInvite.findMany({
        where: {
          OR: orConditions,
        },
        orderBy: { createdAt: 'desc' },
      });
    }
  } catch (error) {
    console.warn('[REPORTS_PAGE_LOADER_ERROR]', error);
  }

  return <ReportsClientView initialInvites={invites} />;
}
