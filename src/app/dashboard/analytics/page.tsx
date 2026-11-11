export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import db from '@/lib/db';
import ReportsClientView from '@/app/dashboard/reports/ReportsClientView';

export default async function AnalyticsPage() {
  // Resolve Clerk ID to Supabase Profile UUID
  const { userId: clerkUserId } = await auth();
  if (!clerkUserId) redirect('/sign-in');

  // Find profile by clerkUserId or id
  const profile = await db.profile.findFirst({
    where: {
      OR: [
        { clerkUserId: clerkUserId },
        { id: clerkUserId },
      ],
    },
  });

  const targetUserId = profile?.id || clerkUserId;

  // Query invites by targetUserId
  const invites = await db.reviewInvite.findMany({
    where: { userId: targetUserId },
    orderBy: { createdAt: 'desc' },
  });

  console.log('[ANALYTICS] Found invites for user:', invites.length);

  // Separate SMS and Email metrics
  const emailInvites = invites.filter((i) => Boolean(i.email));
  const emailSent = emailInvites.length;
  const emailOpened = emailInvites.filter(
    (i) => i.status === 'opened' || i.status === 'reviewed' || i.openedAt
  ).length;
  const emailOpenRate =
    emailSent > 0 ? ((emailOpened / emailSent) * 100).toFixed(1) : '0.0';

  const smsInvites = invites.filter((i) => Boolean(i.phone) && !i.email);
  const smsSent = smsInvites.length;
  const smsOpened = smsInvites.filter(
    (i) => i.status === 'opened' || i.status === 'reviewed' || i.openedAt
  ).length;
  const smsCTR = smsSent > 0 ? ((smsOpened / smsSent) * 100).toFixed(1) : '0.0';

  return (
    <ReportsClientView
      initialInvites={invites}
      channelMetrics={{
        smsSent,
        smsCTR,
        emailSent,
        emailOpenRate,
      }}
    />
  );
}
