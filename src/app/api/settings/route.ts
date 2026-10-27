export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db'; // Prisma client instance

function sanitizeReviewUrl(url?: string | null): string {
  if (!url) return 'https://g.page/r/Cc5qbA6YaZ6-EBM/review';
  if (url.includes('http')) {
    const match = url.match(/https?:\/\/[^\s)\]]+/);
    return match ? match[0] : url;
  }
  return url;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));

    // 1. Read the authenticated Clerk user with body fallback
    const clerkAuth = await auth().catch(() => null);
    const effectiveUserId = clerkAuth?.userId || body.userId;

    if (!effectiveUserId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Extract settings fields from request body
    const {
      negativeAlertEmail,
      negativeAlertPhone,
      positiveAlertEmail,
      positiveAlertPhone,
      googleReviewUrl,
    } = body;

    // 3. Try finding by explicit valid business ID if provided and not undefined
    let business = null;
    const incomingBizId = body.businessId || body.activeBusinessId || body.id;
    if (incomingBizId && incomingBizId !== 'undefined' && incomingBizId !== 'null' && !incomingBizId.startsWith('user_')) {
      business = await db.business.findUnique({
        where: { id: incomingBizId },
      }).catch(() => null);
    }

    // 4. Locate the user's business using Prisma by effectiveUserId if not found by ID
    if (!business) {
      business = await db.business.findFirst({
        where: {
          OR: [
            { userId: effectiveUserId },
            { clerkUserId: effectiveUserId },
          ],
        },
        orderBy: { updatedAt: 'desc' },
      }).catch(() => null);
    }

    const businessId = business?.id || incomingBizId || effectiveUserId;

    // 5. Sanitize and prepare review URL & placeId
    const rawReviewUrl = googleReviewUrl || body.reviewUrl || business?.googleReviewUrl || business?.reviewUrl || 'https://g.page/r/Cc5qbA6YaZ6-EBM/review';
    const cleanReviewUrl = sanitizeReviewUrl(rawReviewUrl);
    const placeId = body.placeId || business?.placeId || '';

    // 6. Save directly inside the Prisma upsert query
    const updated = await db.business.upsert({
      where: { id: businessId },
      update: {
        negativeAlertEmail: negativeAlertEmail || null,
        negativeAlertPhone: negativeAlertPhone || null,
        positiveAlertEmail: positiveAlertEmail || null,
        positiveAlertPhone: positiveAlertPhone || null,
        isGoogleConnected: true,
        updatedAt: new Date(),
        ...(cleanReviewUrl && { googleReviewUrl: cleanReviewUrl, reviewUrl: cleanReviewUrl }),
        ...(placeId && { placeId }),
        ...(body.negativeAlertsEnabled !== undefined && { negativeAlertsEnabled: Boolean(body.negativeAlertsEnabled) }),
        ...(body.positiveAlertsEnabled !== undefined && { positiveAlertsEnabled: Boolean(body.positiveAlertsEnabled) }),
        ...(body.negativeEmailAlertEnabled !== undefined && { negativeEmailAlertEnabled: Boolean(body.negativeEmailAlertEnabled) }),
        ...(body.negativeSmsAlertEnabled !== undefined && { negativeSmsAlertEnabled: Boolean(body.negativeSmsAlertEnabled) }),
        ...(body.positiveEmailAlertEnabled !== undefined && { positiveEmailAlertEnabled: Boolean(body.positiveEmailAlertEnabled) }),
        ...(body.positiveSmsAlertEnabled !== undefined && { positiveSmsAlertEnabled: Boolean(body.positiveSmsAlertEnabled) }),
      },
      create: {
        id: businessId,
        userId: effectiveUserId,
        clerkUserId: effectiveUserId,
        negativeAlertEmail: negativeAlertEmail || null,
        negativeAlertPhone: negativeAlertPhone || null,
        positiveAlertEmail: positiveAlertEmail || null,
        positiveAlertPhone: positiveAlertPhone || null,
        isGoogleConnected: true,
        name: business?.name || 'RatingPulse',
        ...(cleanReviewUrl && { googleReviewUrl: cleanReviewUrl, reviewUrl: cleanReviewUrl }),
        ...(placeId && { placeId }),
      },
    });

    // 7. Invalidate caches
    try {
      revalidatePath('/dashboard', 'layout');
      revalidatePath('/dashboard/settings');
    } catch {}

    // 8. Return updated business
    return NextResponse.json({ success: true, business: updated });
  } catch (error: any) {
    console.error('[SETTINGS_ROUTE_ERROR]', error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  return POST(req);
}

export async function GET(req: NextRequest) {
  try {
    const clerkAuth = await auth().catch(() => null);
    const userId = clerkAuth?.userId || req.nextUrl.searchParams.get('userId');

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const business = await db.business.findFirst({
      where: {
        OR: [
          { userId },
          { clerkUserId: userId },
        ],
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json({ success: true, business });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
