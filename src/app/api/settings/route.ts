export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { auth } from '@clerk/nextjs/server';
import { db } from '@/lib/db'; // Prisma client instance

export async function POST(req: NextRequest) {
  try {
    const clerkAuth = await auth().catch(() => null);
    const userId = clerkAuth?.userId;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => ({}));

    // Find the real active business for this user
    let business = await db.business.findFirst({
      where: {
        OR: [
          { userId: userId },
          { id: body.businessId || undefined },
          { id: body.activeBusinessId || undefined },
        ],
      },
    });

    if (!business) {
      return NextResponse.json({ success: false, error: 'Business not found' }, { status: 404 });
    }

    // Clean notification inputs
    const negativeAlertEmail = body.negativeAlertEmail !== undefined ? String(body.negativeAlertEmail).trim() : business.negativeAlertEmail;
    const negativeAlertPhone = body.negativeAlertPhone !== undefined ? String(body.negativeAlertPhone).trim() : business.negativeAlertPhone;
    const positiveAlertEmail = body.positiveAlertEmail !== undefined ? String(body.positiveAlertEmail).trim() : business.positiveAlertEmail;
    const positiveAlertPhone = body.positiveAlertPhone !== undefined ? String(body.positiveAlertPhone).trim() : business.positiveAlertPhone;

    // Preserve Google connection and Place ID override strictly
    const rawReviewUrl = business.googleReviewUrl || body.googleReviewUrl || 'https://g.page/r/Cc5qbA6YaZ6-EBM/review';
    const googleReviewUrl = rawReviewUrl.includes('http')
      ? (rawReviewUrl.match(/https?:\/\/[^\s)\]]+/)?.[0] || rawReviewUrl)
      : rawReviewUrl;
    const placeId = business.placeId || body.placeId || '';
    const isGoogleConnected = Boolean(googleReviewUrl || business.isGoogleConnected);

    // Direct update to the Business record
    const updated = await db.business.update({
      where: { id: business.id },
      data: {
        negativeAlertEmail,
        negativeAlertPhone,
        positiveAlertEmail,
        positiveAlertPhone,
        negativeAlertsEnabled: body.negativeAlertsEnabled !== undefined ? Boolean(body.negativeAlertsEnabled) : business.negativeAlertsEnabled,
        negativeEmailAlertEnabled: body.negativeEmailAlertEnabled !== undefined ? Boolean(body.negativeEmailAlertEnabled) : business.negativeEmailAlertEnabled,
        negativeSmsAlertEnabled: body.negativeSmsAlertEnabled !== undefined ? Boolean(body.negativeSmsAlertEnabled) : business.negativeSmsAlertEnabled,
        positiveAlertsEnabled: body.positiveAlertsEnabled !== undefined ? Boolean(body.positiveAlertsEnabled) : business.positiveAlertsEnabled,
        positiveEmailAlertEnabled: body.positiveEmailAlertEnabled !== undefined ? Boolean(body.positiveEmailAlertEnabled) : business.positiveEmailAlertEnabled,
        positiveSmsAlertEnabled: body.positiveSmsAlertEnabled !== undefined ? Boolean(body.positiveSmsAlertEnabled) : business.positiveSmsAlertEnabled,
        googleReviewUrl,
        reviewUrl: googleReviewUrl,
        placeId,
        isGoogleConnected,
        updatedAt: new Date(),
      },
    });

    // Invalidate dashboard caches
    revalidatePath('/dashboard', 'layout');
    revalidatePath('/dashboard/settings');
    revalidatePath('/dashboard/invites');
    revalidatePath('/dashboard/businesses');

    return NextResponse.json({
      success: true,
      business: updated,
      message: 'Settings updated successfully',
    });
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
    const userId = clerkAuth?.userId;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const business = await db.business.findFirst({
      where: { userId },
    });

    return NextResponse.json({ success: true, business });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
