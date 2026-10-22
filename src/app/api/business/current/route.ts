export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { getInitialServerBusiness } from '@/lib/server-business';

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

    const business = await getInitialServerBusiness(userId);
    console.log("[DASHBOARD_LOAD] Loaded business for user:", business);

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
