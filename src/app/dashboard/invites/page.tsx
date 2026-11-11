export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { db } from '@/lib/db';
import InvitesClientView from './InvitesClientView';

export default async function InvitesPage() {
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) redirect('/sign-in');

  const profile = await db.profile.findFirst({
    where: {
      OR: [
        { clerkUserId: clerkUserId },
        { id: clerkUserId },
      ],
    },
  });

  const targetUserId = profile?.id || clerkUserId;

  const invites = await db.reviewInvite.findMany({
    where: { userId: targetUserId },
    orderBy: { createdAt: 'desc' },
  });

  return <InvitesClientView initialInvites={invites} />;
}
