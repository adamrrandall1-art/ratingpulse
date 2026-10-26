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

    // 2. Try finding by explicit valid business ID if provided and not undefined
    let business = null;
    const incomingBizId = body.businessId || body.activeBusinessId || body.id;
    if (incomingBizId && incomingBizId !== 'undefined' && incomingBizId !== 'null' && !incomingBizId.startsWith('user_')) {
      business = await db.business.findUnique({
        where: { id: incomingBizId },
      }).catch(() => null);
    }

    // 3. Locate the user's business using Prisma by effectiveUserId if not found by ID
    if (!business) {
      business = await db.business.findFirst({
        where: {
          OR: [
            { userId: effectiveUserId },
            { clerkUserId: effectiveUserId },
          ],
        },
      }).catch(() => null);
    }

    // 4. Sanitize and prepare review URL & placeId
    const rawReviewUrl = body.googleReviewUrl || body.reviewUrl || business?.googleReviewUrl || business?.reviewUrl || 'https://g.page/r/Cc5qbA6YaZ6-EBM/review';
    const cleanReviewUrl = sanitizeReviewUrl(rawReviewUrl);
    const placeId = body.placeId || business?.placeId || '';

    const data = {
      negativeAlertEmail: typeof body.negativeAlertEmail === 'string' ? body.negativeAlertEmail.trim() || null : (body.negativeAlertEmail?.trim?.() || null),
      negativeAlertPhone: typeof body.negativeAlertPhone === 'string' ? body.negativeAlertPhone.trim() || null : (body.negativeAlertPhone?.trim?.() || null),
      positiveAlertEmail: typeof body.positiveAlertEmail === 'string' ? body.positiveAlertEmail.trim() || null : (body.positiveAlertEmail?.trim?.() || null),
      positiveAlertPhone: typeof body.positiveAlertPhone === 'string' ? body.positiveAlertPhone.trim() || null : (body.positiveAlertPhone?.trim?.() || null),
      negativeAlertsEnabled: body.negativeAlertsEnabled !== undefined ? Boolean(body.negativeAlertsEnabled) : (business?.negativeAlertsEnabled ?? true),
      positiveAlertsEnabled: body.positiveAlertsEnabled !== undefined ? Boolean(body.positiveAlertsEnabled) : (business?.positiveAlertsEnabled ?? true),
      negativeEmailAlertEnabled: body.negativeEmailAlertEnabled !== undefined ? Boolean(body.negativeEmailAlertEnabled) : (business?.negativeEmailAlertEnabled ?? true),
      negativeSmsAlertEnabled: body.negativeSmsAlertEnabled !== undefined ? Boolean(body.negativeSmsAlertEnabled) : (business?.negativeSmsAlertEnabled ?? false),
      positiveEmailAlertEnabled: body.positiveEmailAlertEnabled !== undefined ? Boolean(body.positiveEmailAlertEnabled) : (business?.positiveEmailAlertEnabled ?? true),
      positiveSmsAlertEnabled: body.positiveSmsAlertEnabled !== undefined ? Boolean(body.positiveSmsAlertEnabled) : (business?.positiveSmsAlertEnabled ?? false),
      googleReviewUrl: cleanReviewUrl,
      reviewUrl: cleanReviewUrl,
      placeId,
      isGoogleConnected: true,
      updatedAt: new Date(),
    };

    // 5. If business doesn't exist, create it; otherwise update it directly by business.id
    const updated = business
      ? await db.business.update({ where: { id: business.id }, data })
      : await db.business.create({
          data: {
            ...data,
            userId: effectiveUserId,
            clerkUserId: effectiveUserId,
            name: 'RatingPulse',
          },
        });

    // 6. Invalidate caches
    try {
      revalidatePath('/dashboard', 'layout');
      revalidatePath('/dashboard/settings');
    } catch {}

    // 7. Return updated business
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
    });

    return NextResponse.json({ success: true, business });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
