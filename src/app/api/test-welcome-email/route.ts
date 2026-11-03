export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { sendReviewInviteEmail } from '@/lib/email/templates/reviewInvite';

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const email = searchParams.get('email') || process.env.ADMIN_ALERT_EMAIL || 'arandall79@gmail.com';
    const name = searchParams.get('name') || 'Valued Customer';
    const businessName = searchParams.get('businessName') || searchParams.get('business') || 'RatingPulse Business';
    const reviewUrl = searchParams.get('reviewUrl') || searchParams.get('googleReviewUrl') || 'https://g.page/r/Cc5qbA6YaZ6-EBM/review';

    const result = await sendReviewInviteEmail({
      to: email,
      customerName: name,
      businessName,
      reviewUrl,
      isTestPreview: true,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to dispatch sample review invite email' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Sample customer review invite successfully dispatched to ${email}`,
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
    const name = body.name || body.customerName || body.fullName || 'Valued Customer';
    const businessName = body.businessName || body.business_name || 'RatingPulse Business';
    const reviewUrl = body.reviewUrl || body.googleReviewUrl || 'https://g.page/r/Cc5qbA6YaZ6-EBM/review';

    const result = await sendReviewInviteEmail({
      to: email,
      customerName: name,
      businessName,
      reviewUrl,
      isTestPreview: true,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to dispatch sample review invite email' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Sample customer review invite successfully dispatched to ${email}`,
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
