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

  return <InvitesClientView initialInvites={invites} />;
}
