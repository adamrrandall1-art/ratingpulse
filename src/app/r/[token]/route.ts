export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(
  request: Request,
  props: { params: Promise<{ token: string }> | { token: string } }
) {
  const resolvedParams = await Promise.resolve(props.params);
  const token = resolvedParams?.token || '';

  try {
    // Find the invite by token
    const invite = await db.reviewInvite.findFirst({
      where: { token },
    });

    if (invite) {
      // Mark as opened if not already completed/reviewed
      if (invite.status !== 'reviewed') {
        await db.reviewInvite.update({
          where: { id: invite.id },
          data: {
            status: 'opened',
            openedAt: new Date(),
          },
        });
      }

      // Redirect to the review funnel
      return NextResponse.redirect(new URL(`/review?token=${token}`, request.url));
    }
  } catch (error) {
    console.error('Error tracking redirect token:', error);
  }

  return NextResponse.redirect(new URL('/review', request.url));
}
