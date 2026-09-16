export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  exchangeCodeForTokens,
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

  const destination = stateData.returnUrl || '/dashboard';
  const redirectBase = `${appUrl.replace(/\/$/, '')}${destination.startsWith('/') ? destination : `/${destination}`}`;

  if (error || !code) {
    console.error('[Google OAuth Callback Error]:', error || 'No code provided');
    const redirectUrl = new URL(redirectBase);
    redirectUrl.searchParams.set('google_error', error || 'access_denied');
    return NextResponse.redirect(redirectUrl.toString());
  }

  try {
    // 1. Exchange authorization code for tokens
    const tokens = await exchangeCodeForTokens(code);
    const accessToken = tokens.access_token;
    const refreshToken = tokens.refresh_token;
    const expiryDate = new Date(Date.now() + (tokens.expires_in || 3600) * 1000).toISOString();

    // 2. Discover Google Business Profile Accounts & Locations
    let accountId: string | null = null;
    let accountName: string | null = null;
    let locationId: string | null = null;
    let locationTitle: string | null = null;
    let placeId: string | null = null;
    let formattedAddress: string | null = null;

    try {
      const accounts = await fetchGBPAccounts(accessToken);
      if (accounts.length > 0) {
        accountId = accounts[0].name.replace('accounts/', '');
        accountName = accounts[0].accountName || accounts[0].name;

        const locations = await fetchGBPLocations(accounts[0].name, accessToken);
        if (locations.length > 0) {
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

    // 3. Save tokens and linked GBP details into Supabase Profile
    const supabase = getSupabaseAdmin();
    const userId = stateData.userId;
    const isUuid = userId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId);

    if (supabase && isUuid) {
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
      if (placeId) profileUpdates.google_place_id = placeId;
      if (formattedAddress) profileUpdates.formatted_address = formattedAddress;

      const { error: dbError } = await supabase
        .from('profiles')
        .update(profileUpdates)
        .eq('id', userId);

      if (dbError) {
        console.error('[Google OAuth Save Profile Error]:', dbError.message);
      }
    }

    const redirectUrl = new URL(redirectBase);
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
