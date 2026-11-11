import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(
  request: Request,
  props: { params: Promise<{ token: string }> | { token: string } }
) {
  const resolvedParams = await Promise.resolve(props.params);
  const token = resolvedParams?.token || (props.params as any)?.token || '';
  console.log('[TRACKING REDIRECT] Processing token:', token);

  try {
    // Direct update without prior lookup
    const updated = await db.reviewInvite.updateMany({
      where: { token },
      data: {
        status: 'opened',
        openedAt: new Date(),
      },
    });
    console.log('[TRACKING REDIRECT] Rows updated:', updated.count);
  } catch (err) {
    console.error('[TRACKING REDIRECT ERROR]:', err);
  }

  // Redirect user to the review funnel
  return NextResponse.redirect(new URL(`/review?token=${token}`, request.url));
}
