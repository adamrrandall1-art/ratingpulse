export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import {
  fetchGBPAccounts,
  fetchGBPLocations,
} from '@/lib/google-gbp';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false } });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const stateRaw = url.searchParams.get('state');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ratingpulse.co';

  let stateData: { userId?: string; returnUrl?: string } = {};
  if (stateRaw) {
    try {
      stateData = JSON.parse(Buffer.from(stateRaw, 'base64url').toString('utf8'));
    } catch {
      // fallback
    }
  }

  const clerkAuth = await auth().catch(() => null);
  const activeUserId = stateData.userId || clerkAuth?.userId || '';

  const destination = stateData.returnUrl || '/dashboard/setup?oauth=success';
  const redirectBase = destination.startsWith('http')
    ? destination
    : `${appUrl.replace(/\/$/, '')}${destination.startsWith('/') ? destination : `/${destination}`}`;

  if (error || !code) {
    console.error('[Google OAuth Callback Error]:', error || 'No code provided');
    const redirectUrl = new URL(redirectBase);
    redirectUrl.searchParams.set('google_error', error || 'access_denied');
    return NextResponse.redirect(redirectUrl.toString());
  }

  try {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = `${appUrl.replace(/\/$/, '')}/api/auth/google/callback`;

    if (!clientId || !clientSecret) {
      throw new Error('Google OAuth credentials (GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET) missing from environment');
    }

    // 1. Post to https://oauth2.googleapis.com/token to exchange authorization code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData = await tokenRes.json();
    if (!tokenRes.ok || tokenData.error) {
      throw new Error(tokenData.error_description || tokenData.error || 'Failed to exchange code for tokens');
    }

    const accessToken = tokenData.access_token as string;
    const refreshToken = (tokenData.refresh_token as string) || null;
    const expiresIn = Number(tokenData.expires_in) || 3600;
    const expiryDate = new Date(Date.now() + expiresIn * 1000).toISOString();

    // 2. Query Google Business Profile API for verified locations
    let accountId: string | null = null;
    let accountName: string | null = null;
    let locationId: string | null = null;
    let locationTitle: string | null = null;
    let placeId: string | null = null;
    let formattedAddress: string | null = null;

    try {
      const accounts = await fetchGBPAccounts(accessToken);
      if (accounts && accounts.length > 0) {
        accountId = accounts[0].name.replace('accounts/', '');
        accountName = accounts[0].accountName || accounts[0].name;

        const locations = await fetchGBPLocations(accounts[0].name, accessToken);
        if (locations && locations.length > 0) {
          const loc = locations[0];
          locationId = loc.name.split('/').pop() || loc.name;
          locationTitle = loc.title || null;
          placeId = loc.metadata?.placeId || null;

          if (loc.storefrontAddress) {
            const parts = [
              ...(loc.storefrontAddress.addressLines || []),
              loc.storefrontAddress.locality,
              loc.storefrontAddress.administrativeArea,
              loc.storefrontAddress.postalCode,
            ].filter(Boolean);
            formattedAddress = parts.join(', ');
          }
        }
      }
    } catch (discoveryErr) {
      console.warn('[GBP Discovery Warning]:', discoveryErr);
    }

    // 3. Fallback to Google UserInfo if GBP listing title is not yet created
    if (!locationTitle) {
      try {
        const userInfoRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
          headers: { Authorization: `Bearer ${accessToken}` },
        });
        if (userInfoRes.ok) {
          const uInfo = await userInfoRes.json();
          if (uInfo.name && !locationTitle) {
            locationTitle = `${uInfo.name}'s Business`;
          }
        }
      } catch (uErr) {
        console.warn('[UserInfo Fallback Warning]:', uErr);
      }
    }

    // 4. Save the primary location and access credentials linked to the Clerk userId
    const supabase = getSupabaseAdmin();
    if (supabase && activeUserId) {
      const profileUpdates: Record<string, unknown> = {
        google_access_token: accessToken,
        google_token_expiry: expiryDate,
        google_connected: true,
        updated_at: new Date().toISOString(),
      };

      if (refreshToken) profileUpdates.google_refresh_token = refreshToken;
      if (accountId) profileUpdates.google_account_id = accountId;
      if (accountName) profileUpdates.google_account_name = accountName;
      if (locationId) profileUpdates.google_location_id = locationId;
      if (locationTitle) profileUpdates.business_name = locationTitle;
      if (placeId) {
        profileUpdates.google_place_id = placeId;
        profileUpdates.review_url = `https://search.google.com/local/writereview?placeid=${placeId}`;
      }
      if (formattedAddress) profileUpdates.formatted_address = formattedAddress;

      const { error: dbError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', activeUserId);

      if (dbError) {
        console.error('[Google OAuth Save Profile Error]:', dbError.message);
      }

      try {
        await supabase
          .from('business_settings')
          .upsert({
            user_id: activeUserId,
            business_name: locationTitle,
            place_id: placeId,
            google_access_token: accessToken,
            google_refresh_token: refreshToken || null,
            connected_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }, { onConflict: 'user_id' });
      } catch (settErr) {
        console.warn('[Google OAuth Save Business Settings Warning]:', settErr);
      }
    }

    // 5. Redirect back to /dashboard/setup?oauth=success
    const redirectUrl = new URL(redirectBase);
    redirectUrl.searchParams.set('oauth', 'success');
    redirectUrl.searchParams.set('google', 'connected');
    if (locationTitle) redirectUrl.searchParams.set('business', locationTitle);
    if (placeId) redirectUrl.searchParams.set('placeId', placeId);

    return NextResponse.redirect(redirectUrl.toString());
  } catch (err: any) {
    console.error('[Google OAuth Callback Exception]:', err);
    const redirectUrl = new URL(redirectBase);
    redirectUrl.searchParams.set('google_error', err?.message || 'oauth_exchange_failed');
    return NextResponse.redirect(redirectUrl.toString());
  }
}

