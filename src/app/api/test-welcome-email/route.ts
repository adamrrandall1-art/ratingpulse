export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { sendWelcomeEmail } from '@/lib/email/templates/welcome';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const email = searchParams.get('email') || process.env.ADMIN_ALERT_EMAIL || 'arandall79@gmail.com';
    const name = searchParams.get('name') || 'Valued Business Owner';

    const result = await sendWelcomeEmail({
      to: email,
      name,
      force: true, // Force send bypasses deduplication in test route
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to dispatch test welcome email' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Welcome onboarding email successfully dispatched to ${email}`,
      data: result,
    });
  } catch (err: any) {
    console.error('[GET /api/test-welcome-email exception]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const email = body.email || body.to || process.env.ADMIN_ALERT_EMAIL || 'arandall79@gmail.com';
    const name = body.name || body.fullName || 'Valued Business Owner';
    const userId = body.userId;

    const result = await sendWelcomeEmail({
      to: email,
      name,
      userId,
      force: true, // Force send bypasses deduplication in test route
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to dispatch test welcome email' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Welcome onboarding email successfully dispatched to ${email}`,
      data: result,
    });
  } catch (err: any) {
    console.error('[POST /api/test-welcome-email exception]:', err);
    return NextResponse.json(
      { success: false, error: err.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
