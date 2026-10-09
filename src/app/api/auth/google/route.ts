export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clerkAuth = await auth().catch(() => null);
    const userId = clerkAuth?.userId || searchParams.get('userId') || searchParams.get('user_id');

    if (!userId) {
      return NextResponse.json(
        { error: 'Unauthorized. Please sign in to connect your Google Business Profile.' },
        { status: 401 }
      );
    }

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) {
      return NextResponse.json(
        { error: 'Google OAuth client ID (GOOGLE_CLIENT_ID) is not configured.' },
        { status: 500 }
      );
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ratingpulse.co';
    const redirectUri = `${appUrl.replace(/\/$/, '')}/api/auth/google/callback`;
    const returnUrl = searchParams.get('returnUrl') || searchParams.get('redirect') || '/dashboard/setup?connected=true';

    const statePayload = Buffer.from(
      JSON.stringify({ userId, returnUrl })
    ).toString('base64url');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      access_type: 'offline',
      prompt: 'consent',
      scope: 'https://www.googleapis.com/auth/business.manage openid email profile',
      include_granted_scopes: 'true',
      state: statePayload,
    });

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return NextResponse.redirect(googleAuthUrl);
  } catch (err: any) {
    console.error('[OAuth /api/auth/google error]:', err);
    return NextResponse.json(
      { error: err?.message || 'Failed to initialize Google OAuth' },
      { status: 500 }
    );
  }
}
