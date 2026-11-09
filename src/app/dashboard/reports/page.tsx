export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import ReportsClientView from './ReportsClientView';

export default async function ReportsPage() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) redirect('/sign-in');

  const profile = await db.profile.findFirst({
    where: { clerkUserId },
  });

  const invites = profile?.id
    ? await db.reviewInvite.findMany({
        where: {
          OR: [
            { userId: profile.id },
            { user_id: profile.id },
            { userId: clerkUserId },
            { user_id: clerkUserId },
            { businessId: profile.businessId || undefined },
            { business_id: profile.businessId || undefined },
          ],
        },
        orderBy: { createdAt: 'desc' },
      })
    : [];

  return <ReportsClientView initialInvites={invites} />;
}
