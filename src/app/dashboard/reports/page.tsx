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

  const orConditions: any[] = [
    { userId: clerkUserId },
    { user_id: clerkUserId },
  ];

  if (profile?.id) {
    orConditions.push({ userId: profile.id });
    orConditions.push({ user_id: profile.id });
  }

  if (profile?.businessId) {
    orConditions.push({ businessId: profile.businessId });
    orConditions.push({ business_id: profile.businessId });
  }

  const invites = await db.reviewInvite.findMany({
    where: {
      OR: orConditions,
    },
    orderBy: { createdAt: 'desc' },
  });

  return <ReportsClientView initialInvites={invites} />;
}
