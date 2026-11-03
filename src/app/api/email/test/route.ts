export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { sendReviewInviteEmail } from '@/lib/email/templates/reviewInvite';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db';

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
        { success: false, error: result.error || 'Failed to dispatch test review invite' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Sample customer review request email sent to ${email}`,
      data: result,
    });
  } catch (err: any) {
    console.error('[GET /api/email/test exception]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const clerkAuth = await auth().catch(() => null);
    const userId = clerkAuth?.userId;

    const body = await req.json().catch(() => ({}));
    let targetEmail = body.email || body.to;
    let targetName = body.name || body.customerName || body.fullName || 'Valued Customer';
    let targetBusinessName = body.businessName || body.business_name;
    let targetReviewUrl = body.reviewUrl || body.googleReviewUrl || body.reviewGateUrl;

    // Look up business context if user is signed in
    if (userId) {
      const biz = await db.business.findFirst({
        where: {
          OR: [{ clerkUserId: userId }, { userId }, { id: userId }],
        },
      });

      if (biz) {
        if (!targetBusinessName) targetBusinessName = biz.name;
        if (!targetReviewUrl) targetReviewUrl = biz.googleReviewUrl || biz.reviewUrl;
        if (!targetEmail) targetEmail = biz.negativeAlertEmail || biz.positiveAlertEmail;
      }
    }

    if (!targetEmail) {
      targetEmail = process.env.ADMIN_ALERT_EMAIL || 'admin@business.com';
    }
    if (!targetBusinessName) {
      targetBusinessName = 'RatingPulse Business';
    }
    if (!targetReviewUrl) {
      targetReviewUrl = 'https://g.page/r/Cc5qbA6YaZ6-EBM/review';
    }

    const result = await sendReviewInviteEmail({
      to: targetEmail,
      customerName: targetName,
      businessName: targetBusinessName,
      reviewUrl: targetReviewUrl,
      isTestPreview: true,
    });

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error || 'Failed to dispatch test review invite email' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Sample customer review invite successfully delivered to ${targetEmail}`,
      data: result,
    });
  } catch (err: any) {
    console.error('[POST /api/email/test exception]:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Internal server error' },
      { status: 500 }
    );
  }
}
