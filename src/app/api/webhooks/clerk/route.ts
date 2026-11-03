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
              brandVoice: 'friendly_professional',
              aiTone: 'friendly_professional',
              isGoogleConnected: true,
            },
          });
        }

        // Send platform onboarding welcome email only upon new user account creation
        if (evt.type === 'user.created') {
          const userEmail = evt.data.email_addresses?.[0]?.email_address;
          const userName = evt.data.first_name
            ? `${evt.data.first_name} ${evt.data.last_name || ''}`.trim()
            : undefined;
          if (userEmail) {
            try {
              const { sendWelcomeEmail } = await import('@/lib/email/templates/welcome');
              await sendWelcomeEmail({ to: userEmail, name: userName, userId: clerkId });
            } catch (wErr) {
              console.warn('[Clerk Webhook Welcome Email error]:', wErr);
            }
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error('[CLERK_WEBHOOK_ERROR]', err);
    return NextResponse.json({ success: false, error: err?.message }, { status: 500 });
  }
}
