export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { auth, currentUser } from '@clerk/nextjs/server';
import { checkSubscriptionAccess } from '@/lib/subscription';

const NO_CACHE_HEADERS = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
  'Pragma': 'no-cache',
  'Expires': '0',
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clerkAuth = await auth().catch(() => null);
    const userId = searchParams.get('userId') || searchParams.get('id') || searchParams.get('user_id') || clerkAuth?.userId;

    if (!userId || userId.startsWith('usr_mock')) {
      return NextResponse.json(
        {
          success: false,
          hasActiveAccess: false,
          status: 'no_subscription',
          reason: 'User ID missing or unauthenticated',
        },
        { status: 400, headers: NO_CACHE_HEADERS }
      );
    }

    const clerkUser = await currentUser().catch(() => null);
    const userEmail =
      searchParams.get('email') ||
      searchParams.get('userEmail') ||
      clerkUser?.emailAddresses?.[0]?.emailAddress ||
      '';

    const subCheck = await checkSubscriptionAccess(userId, {
      userEmail,
    });

    return NextResponse.json(
      {
        success: true,
        hasActiveAccess: subCheck.hasActiveAccess,
        status: subCheck.status,
        reason: subCheck.reason,
      },
      { headers: NO_CACHE_HEADERS }
    );
  } catch (err: any) {
    console.error('[Subscription Status GET Error]:', err);
    return NextResponse.json(
      {
        success: false,
        hasActiveAccess: false,
        status: 'no_subscription',
        error: err?.message || 'Failed to check subscription access',
      },
      { status: 500, headers: NO_CACHE_HEADERS }
    );
  }
}
