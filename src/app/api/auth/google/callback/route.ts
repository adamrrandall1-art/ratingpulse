export const dynamic = 'force-dynamic';
export const revalidate = 0;

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { auth } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import {
  fetchGBPAccounts,
  fetchGBPLocations,
} from '@/lib/google-gbp';

function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
  const supabaseKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.SUPABASE_SERVICE_KEY ||
    process.env.SUPABASE_SECRET_KEY ||
    process.env.SUPABASE_ADMIN_KEY ||
    process.env.SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    '';
  if (!supabaseUrl || !supabaseKey) return null;
  return createClient(supabaseUrl, supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
}

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const code = url.searchParams.get('code');
  const error = url.searchParams.get('error');
  const stateRaw = url.searchParams.get('state');
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://ratingpulse.co';

  let stateData: { userId?: string; returnUrl?: string; businessId?: string } = {};
  if (stateRaw) {
    const attempts = [
      () => JSON.parse(Buffer.from(stateRaw, 'base64url').toString('utf8')),
      () => JSON.parse(Buffer.from(stateRaw, 'base64').toString('utf8')),
      () => JSON.parse(stateRaw),
      () => JSON.parse(decodeURIComponent(stateRaw)),
      () => JSON.parse(Buffer.from(decodeURIComponent(stateRaw), 'base64url').toString('utf8')),
      () => JSON.parse(Buffer.from(decodeURIComponent(stateRaw), 'base64').toString('utf8')),
    ];
    for (const attempt of attempts) {
      try {
        const parsed = attempt();
        if (parsed && typeof parsed === 'object') {
          stateData = parsed;
          break;
        }
      } catch {
        // try next attempt
      }
    }
  }

  const clerkAuth = await auth().catch(() => null);
  const activeUserId = stateData.userId || stateData.businessId || clerkAuth?.userId || '';

  const destination = stateData.returnUrl || '/dashboard/setup?connected=true';
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

    console.log(`[OAuth Callback] Saving tokens for user: ${activeUserId}`);

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

    // 3. Fallback to Google UserInfo or RatingPulse if GBP listing title is not yet created
    if (!locationTitle) {
      locationTitle = 'RatingPulse';
    }

    // 4. Save the primary location and access credentials linked to the activeUserId / Clerk userId
    const supabase = getSupabaseAdmin();
    if (supabase && activeUserId) {
      let existingProfile: any = null;
      try {
        const { data: pById } = await supabase.from('profiles').select('*').eq('id', activeUserId).maybeSingle();
        if (pById) existingProfile = pById;
      } catch (lookupErr) {
        console.warn('[OAuth Callback] Profile lookup by id error:', lookupErr);
      }

      if (!existingProfile) {
        try {
          const { data: pByClerk } = await supabase.from('profiles').select('*').eq('clerk_user_id', activeUserId).maybeSingle();
          if (pByClerk) existingProfile = pByClerk;
        } catch (clerkErr) {
          console.warn('[OAuth Callback] Profile lookup by clerk_user_id error:', clerkErr);
        }
      }

      const finalRefreshToken = refreshToken || existingProfile?.google_refresh_token || null;

      const profileUpdates: Record<string, unknown> = {
        google_access_token: accessToken,
        google_token_expiry: expiryDate,
        google_connected: true,
        updated_at: new Date().toISOString(),
      };

      if (finalRefreshToken) profileUpdates.google_refresh_token = finalRefreshToken;
      if (accountId) profileUpdates.google_account_id = accountId;
      if (accountName) profileUpdates.google_account_name = accountName;
      if (locationId) profileUpdates.google_location_id = locationId;
      if (locationTitle) profileUpdates.business_name = locationTitle;
      if (placeId) {
        profileUpdates.google_place_id = placeId;
        profileUpdates.review_url = `https://search.google.com/local/writereview?placeid=${placeId}`;
      }
      if (formattedAddress) profileUpdates.formatted_address = formattedAddress;

      if (existingProfile?.id) {
        const { error: updateErr } = await supabase
          .from('profiles')
          .update(profileUpdates)
          .eq('id', existingProfile.id);
        if (updateErr) {
          console.error('[Google OAuth Update Profile Error]:', updateErr.message);
        }
      } else {
        const { error: insertErr } = await supabase
          .from('profiles')
          .upsert({
            id: activeUserId,
            clerk_user_id: activeUserId,
            ...profileUpdates,
          }, { onConflict: 'id' });
        if (insertErr) {
          console.error('[Google OAuth Insert Profile Error]:', insertErr.message);
        }
      }

      try {
        const settingsUserId = existingProfile?.id || activeUserId;
        const settingsUpdates: Record<string, unknown> = {
          user_id: settingsUserId,
          business_name: locationTitle,
          google_access_token: accessToken,
          google_refresh_token: finalRefreshToken,
          connected_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };
        if (placeId) {
          settingsUpdates.place_id = placeId;
          settingsUpdates.google_review_url = `https://search.google.com/local/writereview?placeid=${placeId}`;
        }

        await supabase
          .from('business_settings')
          .upsert(settingsUpdates, { onConflict: 'user_id' });
      } catch (settErr) {
        console.warn('[Google OAuth Save Business Settings Warning]:', settErr);
      }
    }

    // 5. Explicit server-side cache invalidation before redirecting
    try {
      revalidatePath('/dashboard', 'layout');
      revalidatePath('/dashboard/setup');
      revalidatePath('/dashboard/businesses');
      revalidatePath('/dashboard');
      revalidatePath('/dashboard/reviews');
      revalidatePath('/dashboard/invites');
      revalidatePath('/dashboard/settings');
    } catch (revErr) {
      console.warn('[OAuth Callback] Revalidate cache warning:', revErr);
    }

    // 6. Redirect back to /dashboard/setup?connected=true
    const redirectUrl = new URL(redirectBase);
    redirectUrl.searchParams.set('userId', activeUserId);
    redirectUrl.searchParams.set('connected', 'true');
    redirectUrl.searchParams.set('oauth', 'success');
    redirectUrl.searchParams.set('google', 'connected');
    if (locationTitle) redirectUrl.searchParams.set('business', locationTitle);
    if (placeId) {
      redirectUrl.searchParams.set('placeId', placeId);
    } else {
      redirectUrl.searchParams.set('pending_place_id', 'true');
    }

    return NextResponse.redirect(redirectUrl.toString());
  } catch (err: any) {
    console.error('[Google OAuth Callback Exception]:', err);
    const redirectUrl = new URL(redirectBase);
    redirectUrl.searchParams.set('google_error', err?.message || 'oauth_exchange_failed');
    return NextResponse.redirect(redirectUrl.toString());
  }
}

