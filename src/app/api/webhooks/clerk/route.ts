export const dynamic = 'force-dynamic';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const evt = await req.json().catch(() => null);
    if (!evt || !evt.type || !evt.data) {
      return NextResponse.json({ success: true, message: 'No event data' });
    }

    if (evt.type === 'user.created' || evt.type === 'session.created') {
      const clerkId = evt.data.id || evt.data.user_id;
      if (clerkId) {
        const existing = await db.business.findFirst({
          where: {
            OR: [
              { clerkUserId: clerkId },
              { userId: clerkId },
              { id: clerkId },
            ],
          },
        });

        if (!existing) {
          await db.business.create({
            data: {
              id: clerkId,
              clerkUserId: clerkId,
              userId: clerkId,
              name: evt.data.first_name ? `${evt.data.first_name}'s Business` : 'RatingPulse Business',
              negativeAlertSmsEnabled: true,
              aiTone: 'Professional & Warm',
              isGoogleConnected: true,
            },
          });
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[CLERK_WEBHOOK_ERROR]', err);
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
