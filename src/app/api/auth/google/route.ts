export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { generateGoogleAuthUrl, getGoogleOAuthConfig } from '@/lib/google-gbp';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clerkAuth = await auth().catch(() => null);
    const userId = searchParams.get('userId') || searchParams.get('user_id') || clerkAuth?.userId || '';
    const returnUrl = searchParams.get('returnUrl') || searchParams.get('redirect') || '/dashboard/setup?oauth=success';

    const { isConfigured } = getGoogleOAuthConfig();
    if (!isConfigured) {
      return NextResponse.json(
        { error: 'Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) are not configured in environment.' },
        { status: 500 }
      );
    }

    const authUrl = generateGoogleAuthUrl({ userId, returnUrl });
    return NextResponse.redirect(authUrl);
  } catch (err: any) {
    console.error('[OAuth /api/auth/google error]:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to initialize Google OAuth' },
      { status: 500 }
    );
  }
}
