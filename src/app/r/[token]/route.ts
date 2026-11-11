import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: Request,
  props: { params: Promise<{ token: string }> | { token: string } }
) {
  const resolvedParams = await Promise.resolve(props.params);
  const inviteId = resolvedParams?.token || (props.params as any)?.token || '';
  console.log('[TRACKING REDIRECT] Processing invite ID:', inviteId);

  try {
    // Update review_invites where id matches inviteId
    await db.reviewInvite.update({
      where: { id: inviteId },
      data: {
        status: 'opened',
      },
    });
    console.log('[TRACKING REDIRECT] Successfully marked invite as opened');
  } catch (err) {
    console.error('[TRACKING REDIRECT ERROR]:', err);
  }

  return NextResponse.redirect(new URL(`/review?inviteId=${inviteId}`, request.url));
}
