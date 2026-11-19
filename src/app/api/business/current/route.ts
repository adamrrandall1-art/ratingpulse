export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getInitialServerBusiness } from '@/lib/server-business';
import { db } from '@/lib/db';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clerkAuth = await auth().catch(() => null);
    const userId = searchParams.get('userId') || searchParams.get('id') || clerkAuth?.userId;

    let business = null;
    if (userId) {
      const orConditions: any[] = [{ userId }, { clerkUserId: userId }];
      if (UUID_REGEX.test(userId)) {
        orConditions.push({ id: userId });
      }

      const businesses = await db.business.findMany({
        where: {
          OR: orConditions,
        },
        orderBy: { updatedAt: 'desc' },
      }).catch(() => []);
      business = businesses.find(b => b.negativeAlertPhone || b.aiTone || b.negativeAlertEmail) || businesses[0] || null;
    }

    if (!business) {
      business = await getInitialServerBusiness(userId);
    }
    console.log("[DASHBOARD_LOAD] Loaded business for user:", business?.id, business?.name);

    if (!business) {
      return NextResponse.json({
        success: false,
        business: null,
        isGoogleConnected: false,
        error: 'No business found or unauthenticated',
      }, { status: 200, headers: NO_CACHE_HEADERS });
    }

    return NextResponse.json({
      success: true,
      business,
      isGoogleConnected: business.isGoogleConnected,
      googleReviewUrl: business.googleReviewUrl,
    }, { headers: NO_CACHE_HEADERS });
  } catch (err: any) {
    console.error('[DASHBOARD_LOAD] GET current business error:', err);
    return NextResponse.json(
      { success: false, error: err?.message || 'Failed to fetch current business' },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
