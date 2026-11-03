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
    const businessId = searchParams.get('businessId') || searchParams.get('id') || 'demo';
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ratingpulse.co';
    const canonicalGatingUrl = `${baseUrl}/review/${businessId}`;

    const result = await sendReviewInviteEmail({
      to: email,
      customerName: name,
      businessName,
      businessId,
      reviewUrl: canonicalGatingUrl,
      reviewGateUrl: canonicalGatingUrl,
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
    const rawBusinessId = body.businessId || body.business_id;

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ratingpulse.co';
    let biz: any = null;

    // Look up business context if user is signed in or businessId provided
    if (userId || rawBusinessId) {
      const orConditions: any[] = [];
      if (rawBusinessId) {
        orConditions.push({ id: rawBusinessId }, { clerkUserId: rawBusinessId }, { userId: rawBusinessId });
      }
      if (userId) {
        orConditions.push({ clerkUserId: userId }, { userId }, { id: userId });
      }
      biz = await db.business.findFirst({
        where: {
          OR: orConditions,
        },
      });

      if (biz) {
        if (!targetBusinessName) targetBusinessName = biz.name;
        if (!targetEmail) targetEmail = biz.negativeAlertEmail || biz.positiveAlertEmail;
      }
    }

    const effectiveBusinessId = biz?.id || rawBusinessId || userId || 'demo';
    const canonicalGatingUrl = `${baseUrl}/review/${effectiveBusinessId}`;

    if (!targetEmail) {
      targetEmail = process.env.ADMIN_ALERT_EMAIL || 'admin@business.com';
    }
    if (!targetBusinessName) {
      targetBusinessName = 'RatingPulse Business';
    }

    const result = await sendReviewInviteEmail({
      to: targetEmail,
      customerName: targetName,
      businessName: targetBusinessName,
      businessId: effectiveBusinessId,
      reviewUrl: canonicalGatingUrl,
      reviewGateUrl: canonicalGatingUrl,
      googleReviewUrl: biz?.googleReviewUrl || biz?.reviewUrl || body.googleReviewUrl || undefined,
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
